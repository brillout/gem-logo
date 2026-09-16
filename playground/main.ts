/**
 * Interactive playground for diamond.ts — tweak the mark's parameters with
 * live controls and grab the resulting SVG. Run with: pnpm run dev
 */

import { COLOR_PALETTES, PALETTE_GROUPS } from "../color-palettes.ts";
import { PADDING_PRESETS } from "../default.ts";
import { DEFAULTS, diamondSvg, type DiamondParams, type Gradient, GRADIENTS } from "../diamond.ts";

// ------------------------------------------------------------------- state

// The playground drives every visual parameter; `idPrefix` stays at its default.
type State = Omit<Required<DiamondParams>, "idPrefix" | "onWarn">;

const { idPrefix: _idPrefix, ...stateDefaults } = DEFAULTS;
// The playground previews the bare mark: padding starts at the "none" preset
// (0) and is picked via the preset select above the preview.
stateDefaults.padding = PADDING_PRESETS.none;

// The numeric parameters, each with the control range it gets in the sidebar.
// `NumericKey` is derived from State, so TypeScript keeps this registry
// exhaustive: a new numeric param won't compile until it gets a slider here.
type NumericKey = { [K in keyof State]: State[K] extends number ? K : never }[keyof State];
type BooleanKey = { [K in keyof State]: State[K] extends boolean ? K : never }[keyof State];
interface SliderSpec {
  min: number;
  max: number;
  /** Slider granularity; whole numbers when omitted. */
  step?: number;
  /** Sliders whose parameter only matters for one gradient mode get disabled otherwise. */
  onlyFor?: Gradient;
}
const SLIDERS: Record<NumericKey, SliderSpec> = {
  size: { min: 64, max: 1024 },
  tableSize: { min: 8, max: 1024 },
  crownHeight: { min: 1, max: 512 },
  pavilionHeight: { min: 1, max: 1024 },
  sides: { min: 3, max: 16 },
  pitch: { min: -60, max: 60 },
  yaw: { min: 0, max: 360 },
  gap: { min: 0, max: 40 },
  cornerRadius: { min: 0, max: 40 },
  padding: { min: 0, max: 256 },
  shading: { min: 0, max: 1, step: 0.05 },
  lightAngle: { min: -180, max: 180 },
  lightElevation: { min: -90, max: 90 },
  colorFlowDuration: { min: 1, max: 60, step: 0.5 },
  sweepDuration: { min: 0.2, max: 10, step: 0.1 },
  sweepHold: { min: 0, max: 20, step: 0.5 },
  sweepAngle: { min: -180, max: 180 },
  sweepWidth: { min: 0.05, max: 1, step: 0.05 },
  sweepIntensity: { min: 0, max: 1, step: 0.05 },
  glintDuration: { min: 0.5, max: 20, step: 0.5 },
  glintCount: { min: 1, max: 5 },
  glintSize: { min: 4, max: 80 },
  glowDuration: { min: 0.5, max: 20, step: 0.5 },
  glowRadius: { min: 20, max: 800 },
  glowIntensity: { min: 0, max: 1, step: 0.05 },
  spinDuration: { min: 1, max: 60, step: 0.5 },
  spinSteps: { min: 8, max: 72 },
  floatDuration: { min: 0.5, max: 20, step: 0.5 },
  floatHeight: { min: 0, max: 100 },
  pulseHold: { min: 0.5, max: 20, step: 0.5 },
  pulseDuration: { min: 0.1, max: 5, step: 0.1 },
  pulseScale: { min: 1, max: 2, step: 0.01 },
  pulseFlash: { min: 0, max: 1, step: 0.05 },
  precision: { min: 0, max: 6 },
};
const NUMERIC_KEYS = Object.keys(SLIDERS) as NumericKey[];
const BOOLEAN_KEYS = (Object.keys(stateDefaults) as (keyof State)[]).filter(
  (key): key is BooleanKey => typeof stateDefaults[key] === "boolean",
);

// The sidebar, top to bottom: one titled section per parameter group. An
// animation's section starts with its toggle; its other controls are dimmed
// while the toggle is off.
type ControlKey = keyof State;
const SECTIONS: { title: string; keys: ControlKey[] }[] = [
  {
    title: "Shape",
    keys: ["size", "tableSize", "crownHeight", "pavilionHeight", "sides", "gap", "cornerRadius"],
  },
  { title: "Camera", keys: ["pitch", "yaw"] },
  { title: "Color", keys: ["gradient", "colors", "background"] },
  { title: "Light", keys: ["shading", "lightAngle", "lightElevation"] },
  { title: "Color flow", keys: ["colorFlow", "colorFlowDuration"] },
  {
    title: "Sweep",
    keys: ["sweep", "sweepDuration", "sweepHold", "sweepAngle", "sweepWidth", "sweepIntensity"],
  },
  { title: "Glint", keys: ["glint", "glintDuration", "glintCount", "glintSize", "glintColor"] },
  { title: "Glow", keys: ["glow", "glowDuration", "glowRadius", "glowIntensity"] },
  { title: "Spin", keys: ["spin", "spinDuration", "spinSteps"] },
  { title: "Float", keys: ["float", "floatDuration", "floatHeight", "floatShadow"] },
  { title: "Pulse", keys: ["pulse", "pulseHold", "pulseDuration", "pulseScale", "pulseFlash"] },
  { title: "Output", keys: ["padding", "precision"] },
];
{
  const placed = new Set<ControlKey>(SECTIONS.flatMap((section) => section.keys));
  const missing = (Object.keys(stateDefaults) as ControlKey[]).filter((key) => !placed.has(key));
  if (missing.length) throw new Error(`Parameters without a control: ${missing.join(", ")}`);
}

const state: State = { ...stateDefaults, colors: [...stateDefaults.colors], ...paramsFromUrl() };

// ------------------------------------------------------------- url <-> state

/** Restore state from the query string, so parameter combinations are shareable links. */
function paramsFromUrl(): Partial<State> {
  const query = new URLSearchParams(location.search);
  const partial: Partial<State> = {};
  for (const key of NUMERIC_KEYS) {
    // `raw` must be non-empty: Number("") is 0, not NaN.
    const raw = query.get(key);
    if (raw && !Number.isNaN(Number(raw))) partial[key] = Number(raw);
  }
  for (const key of BOOLEAN_KEYS) if (query.has(key)) partial[key] = query.get(key) !== "false";
  const gradient = query.get("gradient");
  if (gradient && GRADIENTS.includes(gradient as Gradient)) partial.gradient = gradient as Gradient;
  // Like the numeric params, a colors list that is effectively empty
  // (?colors=,,) is ignored.
  const colors = query
    .get("colors")
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (colors?.length) partial.colors = colors;
  if (query.has("background")) partial.background = query.get("background") || null;
  const glintColor = query.get("glintColor");
  if (glintColor) partial.glintColor = glintColor;
  return partial;
}

function syncUrl(): void {
  const query = new URLSearchParams();
  for (const key of NUMERIC_KEYS)
    if (state[key] !== stateDefaults[key]) query.set(key, String(state[key]));
  for (const key of BOOLEAN_KEYS)
    if (state[key] !== stateDefaults[key]) query.set(key, String(state[key]));
  if (state.gradient !== stateDefaults.gradient) query.set("gradient", state.gradient);
  if (state.colors.join(",") !== stateDefaults.colors.join(","))
    query.set("colors", state.colors.join(","));
  if (state.background !== stateDefaults.background)
    query.set("background", state.background ?? "");
  if (state.glintColor !== stateDefaults.glintColor) query.set("glintColor", state.glintColor);
  if (previewSize !== PREVIEW_SIZE_DEFAULT)
    query.set("previewSize", previewSize ? String(previewSize) : "fit");
  if (previewBackground !== "#ffffff") query.set("previewBackground", previewBackground);
  const search = query.toString();
  history.replaceState(null, "", search ? `?${search}` : location.pathname);
}

// ---------------------------------------------------------------- controls

const $ = <T extends HTMLElement>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
};

const controls = $("#controls");

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

const sliderRows = new Map<NumericKey, HTMLElement>();
const toggles = new Map<BooleanKey, HTMLInputElement>();
/** Every control row by parameter, for dimming the ones that currently have no effect. */
const rows = new Map<ControlKey, HTMLElement>();

function setSliderValue(key: NumericKey, value: number): void {
  state[key] = value;
  for (const input of sliderRows.get(key)!.querySelectorAll("input")) input.value = String(value);
}

function sliderRow(key: NumericKey): HTMLElement {
  const spec = SLIDERS[key];
  const attrs = {
    min: String(spec.min),
    max: String(spec.max),
    step: String(spec.step ?? 1),
    value: String(state[key]),
  };
  const range = el("input", { type: "range", ...attrs });
  const number = el("input", { type: "number", ...attrs });
  const apply = (raw: string): void => {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    state[key] = value;
    range.value = raw;
    number.value = raw;
    render();
  };
  range.addEventListener("input", () => apply(range.value));
  number.addEventListener("input", () => apply(number.value));
  const row = el("label", { class: "control" }, el("span", {}, key), range, number);
  sliderRows.set(key, row);
  return row;
}

function toggleRow(key: BooleanKey): HTMLElement {
  const toggle = el("input", { type: "checkbox" });
  toggle.checked = state[key];
  toggle.addEventListener("input", () => {
    state[key] = toggle.checked;
    render();
  });
  toggles.set(key, toggle);
  return el("label", { class: "control" }, el("span", {}, key), toggle);
}

// Gradient mode.
const gradientSelect = el("select", {});
gradientSelect.append(
  ...GRADIENTS.map((g) => el("option", g === state.gradient ? { selected: "" } : {}, g)),
);
gradientSelect.addEventListener("input", () => {
  state.gradient = gradientSelect.value as Gradient;
  render();
});

// The tone ramp: one picker per stop, lightest first; a single stop gets its highlight and shadow derived.
const colorList = el("div", { class: "color-list" });
const addColorButton = el("button", { type: "button", class: "small" }, "+ Add color");
addColorButton.addEventListener("click", () => {
  state.colors.push(state.colors.at(-1) ?? "#333333");
  rebuildColorList();
  render();
});

function rebuildColorList(): void {
  colorList.replaceChildren(
    ...state.colors.map((color, i) => {
      const picker = el("input", { type: "color", value: color });
      picker.addEventListener("input", () => {
        state.colors[i] = picker.value;
        render();
      });
      const remove = el("button", { type: "button", class: "small", title: "Remove color" }, "×");
      remove.disabled = state.colors.length <= 1;
      remove.addEventListener("click", () => {
        state.colors.splice(i, 1);
        rebuildColorList();
        render();
      });
      return el("div", { class: "color-entry" }, picker, remove);
    }),
    addColorButton,
  );
}
rebuildColorList();

// Background: transparent by default, optional solid color.
const backgroundToggle = el("input", { type: "checkbox" });
const backgroundPicker = el("input", { type: "color", value: "#ffffff" });

/** Point the toggle & picker at the current state.background. */
function syncBackgroundControls(): void {
  backgroundToggle.checked = state.background !== null;
  if (state.background) backgroundPicker.value = state.background;
}
syncBackgroundControls();

backgroundToggle.addEventListener("input", () => {
  state.background = backgroundToggle.checked ? backgroundPicker.value : null;
  render();
});
backgroundPicker.addEventListener("input", () => {
  backgroundToggle.checked = true;
  state.background = backgroundPicker.value;
  render();
});

// Sparkle color.
const glintColorPicker = el("input", { type: "color", value: state.glintColor });
glintColorPicker.addEventListener("input", () => {
  state.glintColor = glintColorPicker.value;
  render();
});

function controlRow(key: ControlKey): HTMLElement {
  if (key === "gradient")
    return el("label", { class: "control" }, el("span", {}, "gradient"), gradientSelect);
  if (key === "colors")
    return el("div", { class: "control control-colors" }, el("span", {}, "colors"), colorList);
  if (key === "background")
    return el(
      "div",
      { class: "control" },
      el("span", {}, "background"),
      backgroundToggle,
      backgroundPicker,
    );
  if (key === "glintColor")
    return el("label", { class: "control" }, el("span", {}, "glintColor"), glintColorPicker);
  if (typeof stateDefaults[key] === "boolean") return toggleRow(key as BooleanKey);
  return sliderRow(key as NumericKey);
}

for (const section of SECTIONS) {
  const sectionRows = section.keys.map((key) => {
    const row = controlRow(key);
    rows.set(key, row);
    return row;
  });
  controls.append(el("div", { class: "section" }, el("h2", {}, section.title), ...sectionRows));
}

// Preset palettes: clicking one replaces the colors, and the background when
// the palette is designed for its own (dark) backdrop.
const paletteGroups = PALETTE_GROUPS.map((group) =>
  el(
    "div",
    { class: "palette-group" },
    el("h2", {}, group),
    ...COLOR_PALETTES.filter((palette) => palette.group === group).map((palette) => {
      const swatches = el(
        "span",
        {
          class: "palette-swatches",
          style: palette.background ? `background: ${palette.background}` : "",
        },
        ...palette.colors.map((color) => el("span", { style: `background: ${color}` })),
      );
      const button = el("button", { type: "button", class: "palette" }, swatches, palette.name);
      button.addEventListener("click", () => {
        state.colors = [...palette.colors];
        state.background = palette.background ?? null;
        syncBackgroundControls();
        rebuildColorList();
        render();
      });
      return button;
    }),
  ),
);
controls.append(el("div", { class: "palettes" }, ...paletteGroups));

// ----------------------------------------------------------------- actions

// Padding: a preset pick plus a free slider, applied to the live preview
// (and thus everything copied/downloaded). Both drive the same `padding` as
// the sidebar row; a value matching no preset shows as "custom".
const paddingSelect = $<HTMLSelectElement>("#padding-preset");
const paddingSlider = $<HTMLInputElement>("#padding-slider");
paddingSelect.append(
  ...Object.entries(PADDING_PRESETS).map(([name, value]) =>
    el("option", { value: String(value) }, name),
  ),
  el("option", { value: "custom", disabled: "", hidden: "" }, "custom"),
);
paddingSelect.addEventListener("input", () => {
  setSliderValue("padding", Number(paddingSelect.value));
  render();
});
paddingSlider.addEventListener("input", () => {
  setSliderValue("padding", Number(paddingSlider.value));
  render();
});

/** Point the preset select & stage slider at the current state.padding. */
function syncPaddingControls(): void {
  const value = String(state.padding);
  paddingSelect.value = Object.values(PADDING_PRESETS).some((p) => String(p) === value)
    ? value
    : "custom";
  paddingSlider.value = value;
}

// ----------------------------------------------------------------- preview
//
// Preview settings style the DOM around the SVG — how big it is shown, and
// what's behind it — and nothing else: the SVG itself, and so every copy,
// download and PNG export, is unaffected. (The sidebar's `background` is
// the opposite: part of the SVG, and it paints over this backdrop.)

/** Icon sizes to show the mark at; "fit" fills the stage instead. */
const PREVIEW_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];
const CHECKERBOARD = "checkerboard";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const previewSizeSelect = $<HTMLSelectElement>("#preview-size-preset");
const previewSizeInput = $<HTMLInputElement>("#preview-size");
const previewBackgroundToggle = $<HTMLInputElement>("#preview-background-on");
const previewBackgroundPicker = $<HTMLInputElement>("#preview-background");

/** Displayed size of the SVG in CSS pixels; null fits it to the stage. */
const PREVIEW_SIZE_DEFAULT = 64;
let previewSize: number | null = PREVIEW_SIZE_DEFAULT;
/** Backdrop of the preview area: a color, or (toggle off) the transparency checkerboard. */
let previewBackground = "#ffffff";
{
  // Restore the preview settings from the query string, like the mark's parameters.
  const query = new URLSearchParams(location.search);
  const size = query.get("previewSize");
  if (size === "fit") previewSize = null;
  else if (Number(size) > 0) previewSize = Number(size);
  const background = query.get("previewBackground");
  if (background && (background === CHECKERBOARD || HEX_COLOR.test(background)))
    previewBackground = background;
}

previewSizeSelect.append(
  el("option", { value: "" }, "fit"),
  ...PREVIEW_SIZES.map((px) => el("option", { value: String(px) }, `${px}px`)),
  el("option", { value: "custom", disabled: "", hidden: "" }, "custom"),
);
previewSizeSelect.addEventListener("input", () => {
  previewSize = previewSizeSelect.value ? Number(previewSizeSelect.value) : null;
  applyPreview();
  syncUrl();
});
previewSizeInput.addEventListener("input", () => {
  const value = Number(previewSizeInput.value);
  previewSize = previewSizeInput.value && value > 0 ? value : null;
  applyPreview();
  syncUrl();
});
previewBackgroundToggle.addEventListener("input", () => {
  previewBackground = previewBackgroundToggle.checked
    ? previewBackgroundPicker.value
    : CHECKERBOARD;
  applyPreview();
  syncUrl();
});
previewBackgroundPicker.addEventListener("input", () => {
  previewBackground = previewBackgroundPicker.value;
  applyPreview();
  syncUrl();
});

/** Style the stage per the preview settings, and point the controls at them. */
function applyPreview(): void {
  const svg = preview.querySelector("svg");
  if (svg) {
    svg.style.width = previewSize ? `${previewSize}px` : "";
    svg.style.height = previewSize ? `${previewSize}px` : "";
  }
  const checkerboard = previewBackground === CHECKERBOARD;
  preview.classList.toggle(CHECKERBOARD, checkerboard);
  preview.style.background = checkerboard ? "" : previewBackground;
  const size = previewSize ? String(previewSize) : "";
  previewSizeSelect.value = !previewSize || PREVIEW_SIZES.includes(previewSize) ? size : "custom";
  previewSizeInput.value = size;
  previewBackgroundToggle.checked = !checkerboard;
  if (!checkerboard) previewBackgroundPicker.value = previewBackground;
}

$("#reset").addEventListener("click", () => {
  Object.assign(state, stateDefaults, { colors: [...stateDefaults.colors] });
  // Everything goes back to its default, the preview settings included.
  previewSize = PREVIEW_SIZE_DEFAULT;
  previewBackground = "#ffffff";
  for (const key of NUMERIC_KEYS) setSliderValue(key, state[key]);
  for (const key of BOOLEAN_KEYS) toggles.get(key)!.checked = state[key];
  gradientSelect.value = state.gradient;
  glintColorPicker.value = state.glintColor;
  syncBackgroundControls();
  rebuildColorList();
  render();
});

$("#copy").addEventListener("click", async (event) => {
  await navigator.clipboard.writeText(currentSvg);
  const button = event.currentTarget as HTMLButtonElement;
  button.textContent = "Copied!";
  setTimeout(() => (button.textContent = "Copy SVG"), 1200);
});

$("#download").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([currentSvg], { type: "image/svg+xml" }));
  const link = el("a", { href: url, download: "diamond.svg" });
  link.click();
  URL.revokeObjectURL(url);
});

// PNG export rasterizes at the width given by the "PNG size" controls (height
// follows the aspect ratio), independent of the mark's own `size`, so the
// exported icon stays crisp however the preview is configured. The preset
// select offers the usual icon sizes; the input takes any value. Animations
// don't rasterize: the PNG shows the static pose.
const PNG_EXPORT_SIZE = 1024;
const PNG_SIZE_PRESETS = [16, 32, 64, 128, 256, 512, 1024, 2048];

const pngSizeSelect = $<HTMLSelectElement>("#png-size-preset");
const pngSizeInput = $<HTMLInputElement>("#png-size");
pngSizeSelect.append(
  ...PNG_SIZE_PRESETS.map((px) => el("option", { value: String(px) }, String(px))),
  el("option", { value: "custom", disabled: "", hidden: "" }, "custom"),
);
pngSizeInput.value = String(PNG_EXPORT_SIZE);
pngSizeSelect.value = String(PNG_EXPORT_SIZE);
pngSizeSelect.addEventListener("input", () => {
  pngSizeInput.value = pngSizeSelect.value;
});
pngSizeInput.addEventListener("input", () => {
  const value = pngSizeInput.value;
  pngSizeSelect.value = PNG_SIZE_PRESETS.some((px) => String(px) === value) ? value : "custom";
});

$("#download-png").addEventListener("click", async () => {
  const match = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(currentSvg);
  if (!match) return;
  const [, , , viewBoxWidth, viewBoxHeight] = match.map(Number);
  const pngSize = Math.round(Number(pngSizeInput.value)) || PNG_EXPORT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = pngSize;
  canvas.height = Math.round((pngSize * viewBoxHeight) / viewBoxWidth);

  const svgUrl = URL.createObjectURL(new Blob([currentSvg], { type: "image/svg+xml" }));
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to rasterize SVG"));
      img.src = svgUrl;
    });
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!pngBlob) return;
  const pngUrl = URL.createObjectURL(pngBlob);
  const link = el("a", { href: pngUrl, download: "diamond.png" });
  link.click();
  URL.revokeObjectURL(pngUrl);
});

// ------------------------------------------------------------------ render

const preview = $("#preview");
const source = $("#source");
const byteCount = $("#byte-count");
const warningsBox = $("#warnings");
const favicon = $<HTMLLinkElement>('link[rel="icon"]');

let currentSvg = "";

function render(): void {
  const warnings: string[] = [];
  try {
    currentSvg = diamondSvg({ ...state, onWarn: (message) => warnings.push(message) });
    preview.innerHTML = currentSvg;
    applyPreview();
    source.textContent = currentSvg;
    byteCount.textContent = `(${currentSvg.length} bytes)`;
    // A tab icon doesn't replay SMIL, so it shows the static pose.
    favicon.href = `data:image/svg+xml,${encodeURIComponent(currentSvg)}`;
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
  }

  warningsBox.hidden = warnings.length === 0;
  warningsBox.replaceChildren(...warnings.map((w) => el("p", {}, w)));

  // Dim the controls that currently have no effect: an animation's settings
  // while it is off, and sliders tied to another gradient mode.
  for (const section of SECTIONS) {
    const [first, ...others] = section.keys;
    if (typeof stateDefaults[first] !== "boolean") continue;
    for (const key of others)
      rows.get(key)!.classList.toggle("inactive", !state[first as BooleanKey]);
  }
  for (const key of NUMERIC_KEYS) {
    const { onlyFor } = SLIDERS[key];
    if (onlyFor) rows.get(key)!.classList.toggle("inactive", state.gradient !== onlyFor);
  }

  syncPaddingControls();
  syncUrl();
}

render();
