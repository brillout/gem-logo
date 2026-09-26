/**
 * diamond.ts — parametric generator for the gem mark: a faceted diamond.
 *
 * How the shape works
 * -------------------
 * The mark is the orthographic projection of a real 3D model of a cut stone.
 * Four lengths drive it:
 *
 *   size            girdle width (circumdiameter of the girdle, the widest outline)
 *   tableSize       table width (circumdiameter of the table polygon)
 *   crownHeight     girdle → table
 *   pavilionHeight  girdle → culet (the bottom point)
 *
 * and `cut` arranges the facets:
 *
 *   "brilliant"  (default) the jeweler's cut: the `sides`-sided table ringed
 *                by star facets, kite facets reaching down to the girdle
 *                with upper-girdle facets between them, and below, kite-shaped
 *                pavilion mains meeting at the culet with lower-girdle facets
 *                between them — 7 · sides + 1 facets in all.
 *   "simple"     the classic icon: the table, a ring of `sides` trapezoid
 *                crown facets down to the girdle, and `sides` triangular
 *                pavilion facets meeting at the culet.
 *
 * The camera looks at the stone from the front: straight from the side by
 * default, the classic icon with the table edge-on, or elevated by `pitch`
 * degrees so the table shows; the stone can be turned about its vertical axis
 * by `yaw` degrees. Every facet is projected to a 2D polygon, optionally inset
 * by half the `gap` so neighboring facets are separated by a transparent seam,
 * and optionally rounded (`cornerRadius`). The stone is convex, so
 * front-facing facets never overlap and back-facing ones are simply not drawn
 * — which is also what makes the `spin` animation possible without any
 * z-sorting.
 *
 * Light
 * -----
 * The stone sits in a photo studio — a dark room lit by a key softbox at
 * azimuth `lightAngle` (0 = from the viewer, 90 = from the right) and
 * `lightElevation` degrees above the horizon, and three dimmer softboxes
 * around it — and every facet shows what a real stone would:
 *
 *   gloss     the studio mirrored in the polished surface (Fresnel): a glaze
 *             in the highlight tone, strong only on the facets that catch a
 *             softbox.
 *   interior  the light that comes out of the stone through the facet. A ray
 *             entering the facet bends (`refractiveIndex`), crosses the stone
 *             and meets a facet from inside, where it reflects — totally, past
 *             the critical angle — or partly escapes, and so on; whatever
 *             escapes brings back the studio's light from where it points.
 *             The camera being orthographic, the rays entering one facet are
 *             parallel, so the points of the facet whose rays reach the same
 *             facet next form a polygon: the facet splits into a mosaic of
 *             flat patches — the kaleidoscope of a real stone — `reflections`
 *             levels deep (0: every facet one tone). The camera itself hides
 *             part of the studio, which gives the stone its dark patches.
 *
 * With `material` "metal" the stone is opaque instead — a polished metal
 * badge: every facet takes one tone from how squarely it faces the key
 * light.
 *
 * Color
 * -----
 * A gem is one color, so `colors` is a tone ramp of that one color, lightest
 * first: highlight, body, shadow — any number of stops (color-palettes.ts
 * has ready-made ones; a single color gets its highlight and shadow
 * derived). Every patch takes its tone from the light it returns, counted in
 * photographic stops from the median patch of the resting pose, which wears
 * the body tone: every stop brighter climbs toward the highlight, every stop
 * darker sinks toward the shadow; `shading` sets how far along the ramp
 * they go (0: every patch the middle tone, 1: the full ramp).
 *
 * `gradient` picks how a facet wears its light:
 *   "sheen"   (default) a soft gradient across each facet, lighter toward the
 *             light — the glassy look.
 *   "flat"    every patch one solid tone.
 *
 * Animation
 * ---------
 * Every animation is an independent toggle with its own timing, rendered as
 * native SVG <animate>/<animateTransform> elements (no JS at runtime, so
 * they play inside <img> tags and READMEs). Each one loops seamlessly, and
 * at t = 0 every animation rests in the static pose, so static renderers
 * (which ignore SMIL) show exactly the un-animated mark. They combine freely.
 *
 *   colorFlow  the studio circles the stone once every `colorFlowDuration`
 *              seconds — around the viewing axis, so it always lights the
 *              front — and the light flows across the facets.
 *   sweep      a band of light crosses the mark along `sweepAngle`: each
 *              facet flares up toward the highlight tone (`sweepIntensity`)
 *              as the band passes over its center, over `sweepDuration`
 *              seconds, then rests for `sweepHold` seconds.
 *   glint      `glintCount` four-point sparkles pop and fade at facet corners
 *              on a staggered schedule that repeats every `glintDuration`
 *              seconds.
 *   glow       a soft highlight breathes on the table: facets near its
 *              center brighten (up to `glowIntensity`, fading out over
 *              `glowRadius`) and dim again every `glowDuration` seconds.
 *   spin       the stone turns a full revolution about its vertical axis
 *              every `spinDuration` seconds. The cut repeats every
 *              360° / sides, so one such step — projected at
 *              spinSteps / sides keyframes — loops `sides` times per
 *              revolution: every facet and patch tweens its outline between
 *              the keyframes (patches clipped to their facet), back-facing
 *              ones flatten to a line and hide, and the light follows the
 *              changing angles — the stone sparkles as it turns.
 *   float      the stone bobs `floatHeight` up and back every
 *              `floatDuration` seconds, above a soft shadow (`floatShadow`)
 *              that shrinks as it rises.
 *   pulse      every `pulseHold` seconds the stone pops to `pulseScale`
 *              with a flash (`pulseFlash`) and settles back, over
 *              `pulseDuration` seconds — the "skill unlocked" beat.
 *
 * Import:  import { diamondSvg } from "./diamond";
 * CLI:     cli.ts renders the mark to a file (pnpm run node-ts cli.ts logo.svg --param=value ...).
 */

// ------------------------------------------------------------------ options

export const CUTS = ["brilliant", "simple"] as const;
export type Cut = (typeof CUTS)[number];
export const MATERIALS = ["gem", "metal"] as const;
export type Material = (typeof MATERIALS)[number];
export const GRADIENTS = ["sheen", "flat"] as const;
export type Gradient = (typeof GRADIENTS)[number];

export interface DiamondParams {
  /** Width of the girdle (the stone's widest outline), corner to corner. */
  size?: number;
  /** Width of the table (the flat top polygon), corner to corner. */
  tableSize?: number;
  /** Height of the crown: girdle to table. */
  crownHeight?: number;
  /** Height of the pavilion: girdle to culet (the bottom point). */
  pavilionHeight?: number;
  /** Number of sides of the table; the cut repeats that many times around the stone. */
  sides?: number;
  /** How the facets are arranged: "brilliant" (the jeweler's cut, with star, kite and girdle facets) or "simple" (table, crown trapezoids, pavilion triangles). */
  cut?: Cut;
  /** Camera elevation in degrees: 0 looks straight from the side (the table is edge-on), positive looks down onto the table. */
  pitch?: number;
  /** Turn of the stone about its vertical axis, in degrees; 0 has a facet facing the viewer. */
  yaw?: number;
  /** Transparent seam between neighboring facets. */
  gap?: number;
  /** Corner rounding radius of every facet (the SVG-path equivalent of CSS border-radius). 0 keeps sharp corners. */
  cornerRadius?: number;
  /** Margin between the artwork and the edge of the viewBox. */
  padding?: number;
  /** The stone's color as a tone ramp, lightest first (highlight … shadow); a single color gets its highlight and shadow derived. Hex colors. */
  colors?: string[];
  /** What the stone is made of: "gem" (transparent: light bends into it and reflects inside) or "metal" (opaque: every facet shaded by how squarely it faces the key light). */
  material?: Material;
  /** How strongly light bends entering the gem: 1.54 quartz, 1.72 spinel, 1.77 ruby and sapphire, 2.42 diamond. */
  refractiveIndex?: number;
  /** How many internal reflections split the facets into patches (the kaleidoscope), 0 to 3; 0 shows every facet in one tone. Each level multiplies the patches — and a spinning mark's file size. */
  reflections?: number;
  /** How a facet wears its light: "sheen" (a soft gradient toward the light) or "flat" (solid tones). */
  gradient?: Gradient;
  /** How far along the ramp patches go with the light they return: 0 (every patch the middle tone) to 1 (the full ramp). */
  shading?: number;
  /** Azimuth of the key light in degrees: 0 = from the viewer, 90 = from the right, -90 = from the left. */
  lightAngle?: number;
  /** Elevation of the key light above the horizon, in degrees. */
  lightElevation?: number;
  /** Animate the studio circling the stone (on screen, always lighting its front), so the light flows across the facets. */
  colorFlow?: boolean;
  /** Seconds per circuit of the studio. */
  colorFlowDuration?: number;
  /** Animate a band of light sweeping across the facets. */
  sweep?: boolean;
  /** Seconds the light band takes to cross the mark. */
  sweepDuration?: number;
  /** Seconds of rest between two passes of the light band. */
  sweepHold?: number;
  /** Direction the light band travels, in degrees: 0 = left→right, 90 = top→bottom. */
  sweepAngle?: number;
  /** Width of the light band as a fraction of the mark's extent along `sweepAngle`. */
  sweepWidth?: number;
  /** Peak brightness of a facet under the light band, 0 to 1. */
  sweepIntensity?: number;
  /** Animate sparkles popping at facet corners. */
  glint?: boolean;
  /** Seconds per sparkle cycle (every sparkle pops once per cycle). */
  glintDuration?: number;
  /** Number of sparkles, 1 to 5 (each has its own corner). */
  glintCount?: number;
  /** Radius of a sparkle, in the same units as `size`. */
  glintSize?: number;
  /** Color of the sparkles. */
  glintColor?: string;
  /** Animate a soft highlight breathing on the table. */
  glow?: boolean;
  /** Seconds per breath of the highlight. */
  glowDuration?: number;
  /** Distance from the table's center over which the highlight fades out, in the same units as `size`. */
  glowRadius?: number;
  /** Peak brightness of the highlight at the table's center, 0 to 1. */
  glowIntensity?: number;
  /** Animate the stone turning about its vertical axis. */
  spin?: boolean;
  /** Seconds per revolution. */
  spinDuration?: number;
  /** Keyframes per revolution: more is smoother but bigger (the outlines are projected at every keyframe). */
  spinSteps?: number;
  /** Animate the stone bobbing up and down. */
  float?: boolean;
  /** Seconds per bob. */
  floatDuration?: number;
  /** How high the stone rises, in the same units as `size`. */
  floatHeight?: number;
  /** Draw the soft ground shadow under the floating stone. */
  floatShadow?: boolean;
  /** Animate the "skill unlocked" pop: a quick scale-up with a flash. */
  pulse?: boolean;
  /** Seconds of rest between pops. */
  pulseHold?: number;
  /** Seconds one pop takes. */
  pulseDuration?: number;
  /** Peak scale of the pop (1.15 = 15% bigger). */
  pulseScale?: number;
  /** Peak brightness of the flash, 0 to 1. */
  pulseFlash?: number;
  /** Background color; keep null for transparent. */
  background?: string | null;
  /** Prefix for element ids, so several generated SVGs can be inlined on one page. */
  idPrefix?: string;
  /** Decimal places used for coordinates in the output. */
  precision?: number;
  /** Receives each warning about parameter combinations that break the design. Default: console.warn. */
  onWarn?: (message: string) => void;
}

// The default parameters live in default.ts — they are the branding in use.
import { DEFAULTS } from "./default.ts";
export { DEFAULTS };

type Resolved = Required<DiamondParams>;

const warnToConsole = (message: string): void => console.warn(`[diamond] warning: ${message}`);

/** The most internal reflections `reflections` takes: each level multiplies the patches. */
const MAX_REFLECTIONS = 3;

/**
 * Fill in defaults. An empty `colors` array means unset, so the default
 * ramp applies — the resolved `colors` is never empty. Counts are rounded
 * to whole numbers.
 */
function resolve(params: DiamondParams): Resolved {
  const p: Resolved = { onWarn: warnToConsole, ...DEFAULTS, ...params };
  if (p.colors.length === 0) p.colors = DEFAULTS.colors;
  p.sides = Math.max(3, Math.round(p.sides));
  p.reflections = clamp(Math.round(p.reflections), 0, MAX_REFLECTIONS);
  p.spinSteps = Math.max(4, Math.round(p.spinSteps));
  p.glintCount = Math.min(GLINT_SPOTS, Math.max(1, Math.round(p.glintCount)));
  return p;
}

/** Warnings for parameter combinations that break the design, reported through `p.onWarn`. */
function validate(p: Resolved): void {
  const warn = p.onWarn;
  if (p.size <= 0 || p.tableSize <= 0 || p.crownHeight <= 0 || p.pavilionHeight <= 0)
    warn("size, tableSize, crownHeight and pavilionHeight must be positive");
  if (p.tableSize >= p.size)
    warn("tableSize should stay below size, or the crown facets fold over");
  if (!CUTS.includes(p.cut))
    warn(`unknown cut "${p.cut}" — using "brilliant" (options: ${CUTS.join(", ")})`);
  else if (p.cut === "brilliant" && p.tableSize < p.size && !brilliantFits(p))
    warn(
      `a brilliant cut with ${p.sides} sides needs tableSize below ` +
        `${Math.floor(BRILLIANT_TABLE_LIMIT * p.size * Math.cos(Math.PI / p.sides))} — using the simple cut`,
    );
  if (p.gap < 0) warn("gap must be >= 0");
  if (p.cornerRadius < 0) warn("cornerRadius must be >= 0 — treating it as 0 (sharp corners)");
  if (Math.abs(p.pitch) >= 90) warn("pitch must stay between -90 and 90");
  if (!MATERIALS.includes(p.material))
    warn(`unknown material "${p.material}" — using "gem" (options: ${MATERIALS.join(", ")})`);
  if (!(p.refractiveIndex >= 1)) warn("refractiveIndex must be >= 1 — using 1 (no bending)");
  if (!GRADIENTS.includes(p.gradient))
    warn(`unknown gradient "${p.gradient}" — using "flat" (options: ${GRADIENTS.join(", ")})`);
  const bad = p.colors.filter((c) => parseHex(c) === null);
  if (bad.length) warn(`colors must be hex (#rgb / #rrggbb) — using gray for ${bad.join(", ")}`);
  if (p.shading < 0 || p.shading > 1) warn("shading should be between 0 and 1");
  if (p.colorFlow && p.colorFlowDuration <= 0)
    warn("colorFlowDuration must be > 0 — colorFlow ignored");
  if (p.sweep && (p.sweepDuration <= 0 || p.sweepHold < 0 || p.sweepWidth <= 0))
    warn("sweepDuration and sweepWidth must be > 0 and sweepHold >= 0 — sweep ignored");
  if (p.glint && p.glintDuration <= 0) warn("glintDuration must be > 0 — glint ignored");
  if (p.glow && (p.glowDuration <= 0 || p.glowRadius <= 0))
    warn("glowDuration and glowRadius must be > 0 — glow ignored");
  if (p.spin && p.spinDuration <= 0) warn("spinDuration must be > 0 — spin ignored");
  if (p.float && p.floatDuration <= 0) warn("floatDuration must be > 0 — float ignored");
  if (p.pulse && (p.pulseHold <= 0 || p.pulseDuration <= 0))
    warn("pulseHold and pulseDuration must be > 0 — pulse ignored");
  if (p.pulse && p.pulseScale <= 0) warn("pulseScale must be > 0 — pulse ignored");
}

/** The animation toggles, each a boolean parameter with its own timing parameters. */
export const ANIMATIONS = [
  "colorFlow",
  "sweep",
  "glint",
  "glow",
  "spin",
  "float",
  "pulse",
] as const;
export type Animation = (typeof ANIMATIONS)[number];

/** The animations that actually run, after validation knocked out the broken ones. */
function activeAnimations(p: Resolved) {
  return {
    colorFlow: p.colorFlow && p.colorFlowDuration > 0,
    sweep: p.sweep && p.sweepDuration > 0 && p.sweepHold >= 0 && p.sweepWidth > 0,
    glint: p.glint && p.glintDuration > 0,
    glow: p.glow && p.glowDuration > 0 && p.glowRadius > 0,
    spin: p.spin && p.spinDuration > 0,
    float: p.float && p.floatDuration > 0,
    pulse: p.pulse && p.pulseHold > 0 && p.pulseDuration > 0 && p.pulseScale > 0,
  };
}
type Active = ReturnType<typeof activeAnimations>;

// ----------------------------------------------------------------- geometry

type Vec = readonly [number, number];
type Vec3 = readonly [number, number, number];

const rad = (deg: number): number => (deg * Math.PI) / 180;
const deg = (r: number): number => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
/** Angle folded into [-180, 180). */
const foldDeg = (a: number): number => ((((a + 180) % 360) + 360) % 360) - 180;

const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale3 = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
const normalize3 = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v);
  return l < 1e-12 ? [0, 0, 0] : [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Model space: y up, z toward the viewer, x to the right; the stone's axis
 * is the y axis, the girdle sits at y = 0. Azimuths run around that axis,
 * 0° toward the viewer, +90° to the right.
 */
interface Face {
  /** Vertex indices, in the order the facet outline is drawn. */
  readonly indices: readonly number[];
  /** Unit outward normal. */
  readonly normal: Vec3;
  /** The facet's plane: { x : normal · x = offset }. */
  readonly offset: number;
}

interface Model {
  readonly vertices: readonly Vec3[];
  readonly faces: readonly Face[];
  /** Index of the culet (bottom point). */
  readonly culet: number;
  /** The table's corners, as vertex indices. */
  readonly tableRing: readonly number[];
  /** The girdle's corners, as vertex indices. */
  readonly girdleRing: readonly number[];
  /** Center of the table. */
  readonly tableCenter: Vec3;
}

/** How far the star facets reach from the table toward the girdle, along the kites (0 to 1). */
const STAR_LENGTH = 0.5;
/** How far the lower-girdle facets reach from the girdle toward the culet (0 to 1). */
const LOWER_GIRDLE_LENGTH = 0.75;
/** Share of its largest possible width the table may take in a brilliant cut, so the star facets keep some size. */
const BRILLIANT_TABLE_LIMIT = 0.97;

/** Whether the table leaves room for the star facets of a brilliant cut. */
const brilliantFits = (p: Resolved): boolean =>
  p.tableSize < BRILLIANT_TABLE_LIMIT * p.size * Math.cos(Math.PI / p.sides);

/** The cut actually built: an unknown cut, or a brilliant the table leaves no room for, falls back. */
function cutOf(p: Resolved): Cut {
  if (!CUTS.includes(p.cut)) return "brilliant";
  return p.cut === "brilliant" && !brilliantFits(p) ? "simple" : p.cut;
}

/**
 * The cut stone, facet 0 of every ring facing the viewer. Every facet is
 * flat: triangles trivially, and the four-sided kites because their side
 * corners are placed so that their midpoint lies on the kite's axis.
 */
function buildModel(p: Resolved, cut: Cut): Model {
  const n = p.sides;
  const step = 360 / n;
  const R = p.size / 2;
  const H = p.crownHeight;
  const D = p.pavilionHeight;
  const vertices: Vec3[] = [];
  const push = (v: Vec3): number => vertices.push(v) - 1;
  /** A ring of `sides` corners at radius r and height y, corner j at azimuth (j + phase) · step. */
  const ring = (r: number, y: number, phase: number): number[] =>
    range(n).map((j) => {
      const a = rad((j + phase) * step);
      return push([r * Math.sin(a), y, r * Math.cos(a)]);
    });
  const faces: Face[] = [];
  // Normals point away from a point inside the stone: on the axis, halfway
  // between the table and the culet.
  const inside: Vec3 = [0, (H - D) / 2, 0];
  const face = (indices: number[]): void => {
    // Newell's method, then oriented outward.
    const points = indices.map((i) => vertices[i]);
    let normal: Vec3 = [0, 0, 0];
    let center: Vec3 = [0, 0, 0];
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length];
      normal = add3(normal, [
        (a[1] - b[1]) * (a[2] + b[2]),
        (a[2] - b[2]) * (a[0] + b[0]),
        (a[0] - b[0]) * (a[1] + b[1]),
      ]);
      center = add3(center, scale3(a, 1 / points.length));
    });
    normal = normalize3(normal);
    if (dot3(normal, add3(center, scale3(inside, -1))) < 0) normal = scale3(normal, -1);
    faces.push({ indices, normal, offset: dot3(normal, points[0]) });
  };
  const next = (j: number): number => (j + 1) % n;
  const prev = (j: number): number => (j + n - 1) % n;

  if (cut === "simple") {
    // The table and girdle corners share their azimuths, so every crown
    // facet is a trapezoid; facet i is centered on azimuth i · step.
    const table = ring(p.tableSize / 2, H, 0.5);
    const girdle = ring(R, 0, 0.5);
    const culet = push([0, -D, 0]);
    face(table);
    for (let i = 0; i < n; i++) {
      face([table[prev(i)], table[i], girdle[i], girdle[prev(i)]]);
      face([girdle[prev(i)], girdle[i], culet]);
    }
    return { vertices, faces, culet, tableRing: table, girdleRing: girdle, tableCenter: [0, H, 0] };
  }

  // Brilliant. Kite j runs down azimuth j · step from table corner j to
  // girdle corner j, between star points j - 1 and j; the girdle has a
  // second corner between each two kites, above lower-girdle point j.
  const half = rad(step / 2);
  const rt = p.tableSize / 2;
  const starMid = rt + (R * Math.cos(half) - rt) * STAR_LENGTH;
  const lowerMid = R * (1 - LOWER_GIRDLE_LENGTH);
  const table = ring(rt, H, 0);
  const stars = ring(starMid / Math.cos(half), (H * (R - starMid)) / (R - rt), 0.5);
  const kiteTips = ring(R, 0, 0);
  const girdleMids = ring(R, 0, 0.5);
  const culet = push([0, -D, 0]);
  const lowers = ring(lowerMid / Math.cos(half), -D * (1 - lowerMid / R), 0.5);
  face(table);
  for (let j = 0; j < n; j++) face([table[j], table[next(j)], stars[j]]);
  for (let j = 0; j < n; j++) face([table[j], stars[j], kiteTips[j], stars[prev(j)]]);
  for (let j = 0; j < n; j++) {
    face([stars[j], kiteTips[j], girdleMids[j]]);
    face([stars[j], girdleMids[j], kiteTips[next(j)]]);
  }
  for (let j = 0; j < n; j++) face([kiteTips[j], lowers[j], culet, lowers[prev(j)]]);
  for (let j = 0; j < n; j++) {
    face([kiteTips[j], girdleMids[j], lowers[j]]);
    face([girdleMids[j], kiteTips[next(j)], lowers[j]]);
  }
  return {
    vertices,
    faces,
    culet,
    tableRing: table,
    girdleRing: range(2 * n).map((k) => (k % 2 ? girdleMids : kiteTips)[k >> 1]),
    tableCenter: [0, H, 0],
  };
}

/** Rotate a model-space vector about the axis by `yaw` degrees (the stone turning). */
function yawed(v: Vec3, yaw: number): Vec3 {
  const y = rad(yaw);
  return [v[0] * Math.cos(y) + v[2] * Math.sin(y), v[1], -v[0] * Math.sin(y) + v[2] * Math.cos(y)];
}

/** Orthographic projection to SVG coordinates (y down) of a stone turned by `yaw`, seen from `pitch` degrees above. */
function project(v: Vec3, yaw: number, pitch: number): Vec {
  const [x, y, z] = yawed(v, yaw);
  const ph = rad(pitch);
  return [x, -(y * Math.cos(ph) - z * Math.sin(ph))];
}

/** How much a facet faces the viewer (> 0: front-facing) for a stone turned by `yaw`, seen from `pitch`. */
function facing(normal: Vec3, yaw: number, pitch: number): number {
  const n = yawed(normal, yaw);
  const ph = rad(pitch);
  return n[1] * Math.sin(ph) + n[2] * Math.cos(ph);
}

/** The yaws (two per revolution, or none) at which a facet is exactly edge-on. */
function edgeOnYaws(normal: Vec3, pitch: number): number[] {
  const nr = Math.hypot(normal[0], normal[2]);
  if (nr < 1e-9) return [];
  const c = (-normal[1] * Math.tan(rad(pitch))) / nr;
  if (Math.abs(c) > 1) return [];
  const azimuth = deg(Math.atan2(normal[0], normal[2]));
  const a = deg(Math.acos(c));
  return [a - azimuth, -a - azimuth];
}

// ------------------------------------------------------------------- light

/** Unit vector toward a light at `angle` degrees of azimuth and `elevation` degrees above the horizon. */
function lightVector(angle: number, elevation: number): Vec3 {
  const la = rad(angle);
  const le = rad(elevation);
  return [Math.cos(le) * Math.sin(la), Math.sin(le), Math.cos(le) * Math.cos(la)];
}

/**
 * The light swung `angle` degrees around the viewing axis: it circles the
 * stone on screen (up, left, down, right) while always lighting its front.
 */
function orbitLight(light: Vec3, angle: number): Vec3 {
  const a = rad(angle);
  return [
    light[0] * Math.cos(a) - light[1] * Math.sin(a),
    light[0] * Math.sin(a) + light[1] * Math.cos(a),
    light[2],
  ];
}

/**
 * The studio's softboxes: azimuth relative to `lightAngle`, elevation (null:
 * `lightElevation` — the key light), brightness, and spread — each one's
 * light falls off as exp((cos θ − 1) / spread) away from its center.
 */
const SOFTBOXES: readonly {
  azimuth: number;
  elevation: number | null;
  power: number;
  spread: number;
}[] = [
  { azimuth: 0, elevation: null, power: 4, spread: 0.06 },
  { azimuth: 100, elevation: 20, power: 2, spread: 0.06 },
  { azimuth: 200, elevation: 50, power: 2, spread: 0.06 },
  { azimuth: -100, elevation: 10, power: 1.5, spread: 0.04 },
];
/** The dark room around them: the ceiling (brightest overhead) and the floor (dark velvet). */
const CEILING = 0.08;
const FLOOR = 0.008;
/** How much of the studio the camera hides behind it, and over what spread: the dark patches of a real stone. */
const CAMERA_SHADOW = 0.85;
const CAMERA_SPREAD = 0.02;

/** The light arriving from a direction (a unit vector pointing toward where it comes from). */
type Environment = (dir: Vec3) => number;

/** The studio, its softboxes swung `orbit` degrees around the viewing axis (`colorFlow`), for a camera looking along `view`. */
function studio(p: Resolved, orbit: number, view: Vec3): Environment {
  const boxes = SOFTBOXES.map((box) => ({
    dir: orbitLight(
      lightVector(p.lightAngle + box.azimuth, box.elevation ?? p.lightElevation),
      orbit,
    ),
    power: box.power,
    spread: box.spread,
  }));
  const toCamera = scale3(view, -1);
  return (dir) => {
    let light = 0;
    for (const box of boxes) light += box.power * Math.exp((dot3(dir, box.dir) - 1) / box.spread);
    const up = dir[1];
    const horizon = clamp((up + 0.15) / 0.3, 0, 1);
    const ceiling = CEILING * (0.3 + 0.7 * Math.max(0, up) ** 0.6);
    light += FLOOR + (ceiling - FLOOR) * horizon * horizon * (3 - 2 * horizon);
    return light * (1 - CAMERA_SHADOW * Math.exp((dot3(dir, toCamera) - 1) / CAMERA_SPREAD));
  };
}

/**
 * Share of the light reflected where a ray meets an interface at incidence
 * cosine `cos`, going from refractive index n1 into n2 (Fresnel, unpolarized);
 * 1 past the critical angle — total internal reflection.
 */
function fresnel(cos: number, n1: number, n2: number): number {
  if (n1 === n2) return 0;
  const sinT = (n1 / n2) * Math.sqrt(Math.max(0, 1 - cos * cos));
  if (sinT >= 1) return 1;
  const cosT = Math.sqrt(1 - sinT * sinT);
  const s = (n1 * cos - n2 * cosT) / (n1 * cos + n2 * cosT);
  const q = (n1 * cosT - n2 * cos) / (n1 * cosT + n2 * cos);
  return (s * s + q * q) / 2;
}

/** A ray `d` bent through a surface whose unit normal `n` faces it (n · d ≤ 0), with eta = n1 / n2; null past the critical angle. */
function refract(d: Vec3, n: Vec3, eta: number): Vec3 | null {
  const cos = -dot3(d, n);
  const k = 1 - eta * eta * (1 - cos * cos);
  if (k < 0) return null;
  return normalize3(add3(scale3(d, eta), scale3(n, eta * cos - Math.sqrt(k))));
}

/** A ray `d` mirrored off a surface with unit normal `n`. */
const reflect = (d: Vec3, n: Vec3): Vec3 => add3(d, scale3(n, -2 * dot3(d, n)));

/** The stone turned by some yaw, in camera space: its vertices, and its facets' normals and plane offsets. */
interface World {
  readonly vertices: readonly Vec3[];
  readonly normals: readonly Vec3[];
  readonly offsets: readonly number[];
}

/** How many facets a ray inside the stone is followed through. */
const MAX_BOUNCES = 8;
/** Distance, as a multiple of `size`, over which light inside the stone dims to 1/e: long paths come out darker. */
const ABSORPTION = 2.5;

/**
 * The light a ray inside the stone brings back: from `point` on facet `face`,
 * heading `dir`. At every facet it meets, the share that escapes (Fresnel)
 * brings back the studio's light from where it then points; the rest
 * reflects on.
 */
function traceInside(
  w: World,
  env: Environment,
  ior: number,
  reach: number,
  point: Vec3,
  dir: Vec3,
  face: number,
): number {
  let light = 0;
  let carried = 1;
  for (let bounce = 0; bounce < MAX_BOUNCES && carried > 0.01; bounce++) {
    let hit = -1;
    let distance = Infinity;
    w.normals.forEach((normal, g) => {
      const along = dot3(normal, dir);
      if (g === face || along <= 1e-9) return;
      const s = (w.offsets[g] - dot3(normal, point)) / along;
      if (s < distance) {
        distance = s;
        hit = g;
      }
    });
    if (hit < 0) break;
    distance = Math.max(0, distance);
    point = add3(point, scale3(dir, distance));
    carried *= Math.exp(-distance / reach);
    const normal = w.normals[hit];
    const reflected = fresnel(dot3(dir, normal), ior, 1);
    const out = reflected < 1 ? refract(dir, scale3(normal, -1), ior) : null;
    if (out) light += carried * (1 - reflected) * env(out);
    carried *= reflected;
    dir = reflect(dir, normal);
    face = hit;
  }
  return light;
}

// --------------------------------------------------------------- 2D polygons

/** An infinite line { p : n·p = o } — unit normal `n`, signed distance `o` from the origin. */
interface Line {
  readonly n: Vec;
  readonly o: number;
}

/** Point where two lines cross; null when they are (nearly) parallel. */
function intersect(a: Line, b: Line): Vec | null {
  const det = a.n[0] * b.n[1] - a.n[1] * b.n[0];
  if (Math.abs(det) < 1e-9) return null;
  return [(a.o * b.n[1] - b.o * a.n[1]) / det, (a.n[0] * b.o - b.n[0] * a.o) / det];
}

const centroid = (poly: readonly Vec[]): Vec => [
  poly.reduce((s, [x]) => s + x, 0) / poly.length,
  poly.reduce((s, [, y]) => s + y, 0) / poly.length,
];

/** Twice the signed area (shoelace); positive = clockwise on screen (y grows downward). */
const signedArea2 = (poly: readonly Vec[]): number =>
  poly.reduce((s, [x, y], i) => {
    const [nx, ny] = poly[(i + 1) % poly.length];
    return s + x * ny - nx * y;
  }, 0);

const area = (poly: readonly Vec[]): number => Math.abs(signedArea2(poly)) / 2;

/**
 * Convex polygon with every edge moved inward by `d`; null when the polygon
 * is too thin for that — the caller falls back to `shrink`.
 */
function inset(poly: readonly Vec[], d: number): Vec[] | null {
  if (d === 0) return [...poly];
  const c = centroid(poly);
  const lines: Line[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey);
    if (len < 1e-9) return null;
    let n: Vec = [-ey / len, ex / len];
    if (n[0] * (c[0] - a[0]) + n[1] * (c[1] - a[1]) < 0) n = [-n[0], -n[1]];
    lines.push({ n, o: n[0] * a[0] + n[1] * a[1] + d });
  }
  const out: Vec[] = [];
  for (let i = 0; i < poly.length; i++) {
    const q = intersect(lines[(i + poly.length - 1) % poly.length], lines[i]);
    if (!q) return null;
    out.push(q);
  }
  // Every inset corner must still satisfy every inset edge, or the polygon collapsed.
  for (const q of out)
    for (const l of lines) if (l.n[0] * q[0] + l.n[1] * q[1] < l.o - 1e-6) return null;
  return out;
}

/** Polygon scaled toward its centroid so its corners move about `d` closer — the always-valid fallback for `inset`. */
function shrink(poly: readonly Vec[], d: number): Vec[] {
  const c = centroid(poly);
  const mean = poly.reduce((s, [x, y]) => s + Math.hypot(x - c[0], y - c[1]), 0) / poly.length;
  const f = mean < 1e-9 ? 0 : clamp(1 - d / mean, 0, 1);
  return poly.map(([x, y]) => [c[0] + (x - c[0]) * f, c[1] + (y - c[1]) * f]);
}

/**
 * The part of polygon `subject` inside the convex polygon `clip`, of either
 * winding (Sutherland–Hodgman); empty when they don't overlap.
 */
function clipConvex(subject: readonly Vec[], clip: readonly Vec[]): Vec[] {
  const winding = signedArea2(clip) > 0 ? 1 : -1;
  let out: Vec[] = [...subject];
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const side = (q: Vec): number =>
      winding * ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]));
    const kept: Vec[] = [];
    out.forEach((cur, j) => {
      const before = out[(j + out.length - 1) % out.length];
      const sCur = side(cur);
      const sBefore = side(before);
      if (sCur >= 0 !== sBefore >= 0) {
        const f = sBefore / (sBefore - sCur);
        kept.push([before[0] + (cur[0] - before[0]) * f, before[1] + (cur[1] - before[1]) * f]);
      }
      if (sCur >= 0) kept.push(cur);
    });
    out = kept;
  }
  return out.length >= 3 ? out : [];
}

/**
 * Rounded corner i of a polygon: the two adjacent edges are trimmed back and
 * bridged by a circular arc. The trim distance is r / tan(θ/2) for interior
 * angle θ, capped at half of either edge so neighboring roundings never
 * overlap; when capped, the arc radius shrinks to match.
 */
interface RoundedCorner {
  /** Where the incoming edge stops (arc start). */
  readonly from: Vec;
  /** Where the outgoing edge resumes (arc end). */
  readonly to: Vec;
  /** Effective arc radius after capping; 0 means keep the corner sharp. */
  readonly r: number;
  /** SVG sweep flag: 1 = clockwise on screen (y grows downward). */
  readonly sweep: 0 | 1;
}

function roundCorner(poly: readonly Vec[], i: number, radius: number): RoundedCorner {
  const pt = poly[i];
  const prev = poly[(i + poly.length - 1) % poly.length];
  const next = poly[(i + 1) % poly.length];
  const sharp: RoundedCorner = { from: pt, to: pt, r: 0, sweep: 1 };
  if (radius <= 0) return sharp;

  const d1: Vec = [prev[0] - pt[0], prev[1] - pt[1]];
  const d2: Vec = [next[0] - pt[0], next[1] - pt[1]];
  const l1 = Math.hypot(...d1);
  const l2 = Math.hypot(...d2);
  if (l1 < 1e-9 || l2 < 1e-9) return sharp;
  const u1: Vec = [d1[0] / l1, d1[1] / l1];
  const u2: Vec = [d2[0] / l2, d2[1] / l2];

  const dot = clamp(u1[0] * u2[0] + u1[1] * u2[1], -1, 1);
  const theta = Math.acos(dot); // interior angle at the corner
  // Collinear edges (a flat corner, or a facet flattened to its edge-on
  // line, where the edges fold onto each other): nothing to round.
  if (theta < 1e-6 || theta > Math.PI - 1e-6) return sharp;

  const trim = Math.min(radius / Math.tan(theta / 2), l1 / 2, l2 / 2);
  const r = trim * Math.tan(theta / 2);
  if (r < 1e-9) return sharp;

  return {
    from: [pt[0] + u1[0] * trim, pt[1] + u1[1] * trim],
    to: [pt[0] + u2[0] * trim, pt[1] + u2[1] * trim],
    r,
    // Travel direction turns with sign of (-u1) × u2; the arc sweeps the same way.
    sweep: -(u1[0] * u2[1] - u1[1] * u2[0]) > 0 ? 1 : 0,
  };
}

/** Segments each rounded corner becomes where an outline is needed as a polygon (to clip patches to). */
const ARC_SEGMENTS = 4;

/** A polygon with its corners rounded, the arcs traced by short segments. */
function roundedPolygon(poly: readonly Vec[], radius: number): Vec[] {
  if (radius <= 0) return [...poly];
  return poly.flatMap((pt, i) => {
    const c = roundCorner(poly, i, radius);
    if (c.r === 0) return [pt];
    // The arc's center sits on the corner's bisector, `r` from both trimmed ends.
    const mid: Vec = [(c.from[0] + c.to[0]) / 2, (c.from[1] + c.to[1]) / 2];
    const toCorner = Math.hypot(pt[0] - mid[0], pt[1] - mid[1]);
    const half = Math.hypot(c.to[0] - c.from[0], c.to[1] - c.from[1]) / 2;
    const depth = Math.sqrt(Math.max(0, c.r * c.r - half * half));
    const u: Vec = [(mid[0] - pt[0]) / toCorner, (mid[1] - pt[1]) / toCorner];
    const center: Vec = [mid[0] + u[0] * depth, mid[1] + u[1] * depth];
    const a0 = Math.atan2(c.from[1] - center[1], c.from[0] - center[0]);
    let a1 = Math.atan2(c.to[1] - center[1], c.to[0] - center[0]);
    // Take the short way round.
    if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
    if (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
    return range(ARC_SEGMENTS + 1).map((k): Vec => {
      const a = a0 + ((a1 - a0) * k) / ARC_SEGMENTS;
      return [center[0] + c.r * Math.cos(a), center[1] + c.r * Math.sin(a)];
    });
  });
}

// -------------------------------------------------------------------- color

type Rgb = readonly [number, number, number];

/** "#rgb" or "#rrggbb" → [r, g, b]; null for anything else. */
function parseHex(color: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((ch) => ch + ch).join("") : m[1];
  const channel = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
  return [channel(0), channel(2), channel(4)];
}

const toHex = (rgb: readonly number[]): string =>
  "#" +
  rgb
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

/** Linear blend from `a` (f = 0) to `b` (f = 1). */
const mix = (a: Rgb, b: Rgb, f: number): Rgb => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

/** The tone ramp sampled at t ∈ [0, 1]: its first stop at 0, its last at 1, blended linearly in between. */
function rampAt(ramp: readonly Rgb[], t: number): string {
  if (ramp.length === 1) return toHex(ramp[0]);
  const x = clamp(t, 0, 1) * (ramp.length - 1);
  const i = Math.min(Math.floor(x), ramp.length - 2);
  return toHex(mix(ramp[i], ramp[i + 1], x - i));
}

/** A tone ramp for a single color: tinted toward white for the highlights, deepened toward black for the shadows. */
const deriveRamp = (color: Rgb): Rgb[] => {
  const white: Rgb = [255, 255, 255];
  const black: Rgb = [0, 0, 0];
  return [
    mix(color, white, 0.72),
    mix(color, white, 0.3),
    color,
    mix(color, black, 0.45),
    mix(color, black, 0.75),
  ];
};

// --------------------------------------------------------------- svg output

/** Coordinate formatter: `precision` decimals, trailing zeros stripped, no "-0". */
const numberFormatter =
  (precision: number) =>
  (n: number): string => {
    const s = n.toFixed(precision);
    // Trailing zeros only exist after a decimal point; at precision 0 there is
    // none, and stripping would corrupt integers ("120" -> "12").
    const trimmed = precision ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
    return trimmed === "-0" ? "0" : trimmed;
  };

/** Short form of a 0..1 fraction (opacities, keyTimes). */
const frac = (v: number): string => String(+v.toFixed(4));

const LINEAR = "0 0 1 1";
const EASE = "0.45 0 0.55 1";

/**
 * One SMIL animation of `attr`, looping forever. Omit `keyTimes` for evenly
 * spaced keyframes; pass `splines` (one per segment) for eased motion. The
 * default calcMode, linear, goes unwritten.
 */
function animateEl(
  el: "animate" | "animateTransform",
  attr: string,
  dur: number,
  values: readonly string[],
  opts: {
    keyTimes?: readonly number[];
    splines?: readonly string[];
    calcMode?: "linear" | "spline" | "discrete";
    additive?: boolean;
    type?: "translate" | "scale" | "rotate";
  } = {},
): string {
  const calcMode = opts.calcMode ?? (opts.splines ? "spline" : "linear");
  return (
    `<${el} attributeName="${attr}"` +
    (opts.type ? ` type="${opts.type}"` : "") +
    ` dur="${+dur.toFixed(4)}s" repeatCount="indefinite"` +
    (opts.additive ? ` additive="sum"` : "") +
    (calcMode === "linear" ? "" : ` calcMode="${calcMode}"`) +
    (opts.keyTimes ? ` keyTimes="${opts.keyTimes.map(frac).join(";")}"` : "") +
    (opts.splines ? ` keySplines="${opts.splines.join(";")}"` : "") +
    ` values="${values.join(";")}"/>`
  );
}

/**
 * The keyframes a track can't do without (Ramer–Douglas–Peucker over time):
 * dropping all the others leaves every value within `tolerance` of the
 * straight tween between the kept keyframes around it. The first and last
 * keyframes stay, and so does every one `keep` marks.
 */
function essentialKeyframes(
  times: readonly number[],
  values: readonly (readonly number[])[],
  tolerance: number,
  keep: (i: number) => boolean = () => false,
): number[] {
  const kept = new Set([0, times.length - 1, ...range(times.length).filter(keep)]);
  const refine = (a: number, b: number): void => {
    let worst = -1;
    let worstError = tolerance;
    for (let i = a + 1; i < b; i++) {
      const f = (times[i] - times[a]) / (times[b] - times[a]);
      const error = Math.max(
        ...values[i].map((v, k) =>
          Math.abs(v - (values[a][k] + (values[b][k] - values[a][k]) * f)),
        ),
      );
      if (error > worstError) {
        worst = i;
        worstError = error;
      }
    }
    if (worst < 0) return;
    kept.add(worst);
    refine(a, worst);
    refine(worst, b);
  };
  const anchors = [...kept].sort((a, b) => a - b);
  for (let j = 0; j + 1 < anchors.length; j++) refine(anchors[j], anchors[j + 1]);
  return [...kept].sort((a, b) => a - b);
}

/** Keyframes per circuit of the studio for `colorFlow`. */
const COLOR_FLOW_STEPS = 24;

/**
 * The evenly spaced keyframes the stone tweens through when it spins and/or
 * the studio circles it (`spin`, `colorFlow`): the turn and the studio's
 * swing at every keyframe. Spinning alone, the loop is one step of the cut
 * (360° / sides — after which the stone looks exactly as it started), so it
 * repeats `sides` times per revolution. Otherwise the loop is the spin's
 * period, and the studio makes as many whole circuits inside it as
 * `colorFlowDuration` allows (or, without a spin, the loop is the studio's
 * own period), so both repeat seamlessly together.
 */
interface Timeline {
  readonly period: number;
  /** The base keyframes, 0 .. 1; the last closes the loop. */
  readonly keyTimes: readonly number[];
  /** Degrees the stone turns per loop; 0 when it isn't spinning. */
  readonly turn: number;
  readonly yawAt: (t: number) => number;
  /** Degrees the studio has swung around the viewing axis. */
  readonly orbitAt: (t: number) => number;
}

function timelineOf(p: Resolved, active: Active): Timeline | null {
  if (!active.spin && !active.colorFlow) return null;
  if (!active.colorFlow) {
    const turn = 360 / p.sides;
    const count = Math.max(2, Math.ceil(p.spinSteps / p.sides));
    return {
      period: p.spinDuration / p.sides,
      keyTimes: range(count + 1).map((i) => i / count),
      turn,
      yawAt: (t) => p.yaw + turn * t,
      orbitAt: () => 0,
    };
  }
  const period = active.spin ? p.spinDuration : p.colorFlowDuration;
  const turn = active.spin ? 360 : 0;
  const orbits = Math.max(1, Math.round(period / p.colorFlowDuration));
  const count = Math.max(active.spin ? p.spinSteps : 0, orbits * COLOR_FLOW_STEPS);
  return {
    period,
    keyTimes: range(count + 1).map((i) => i / count),
    turn,
    yawAt: (t) => p.yaw + turn * t,
    orbitAt: (t) => 360 * orbits * t,
  };
}

/** How many sparkle spots `glint` can pick from (a `glintCount` of n uses the first n). */
const GLINT_SPOTS = 5;
/** A patch's stroke: one screen pixel wide at any rendered size, with round joins so sharp corners don't spike. */
const STROKE_ATTRS = 'stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
/** How far along the ramp (at `shading` 1) a metal facet's sheen runs lighter toward the light and darker away from it. */
const SHEEN_SPREAD = 0.14;
/** Share of a facet's gloss left at its far side from the light, with the "sheen" gradient. */
const SHEEN_FADE = 0.35;
/** Gloss is capped at this opacity, and left out below `MIN_GLOSS`. */
const MAX_GLOSS = 0.85;
const MIN_GLOSS = 0.004;
/** How far past the key light's terminator a metal facet still catches light (0: plain Lambert, 1: full wrap). */
const METAL_WRAP = 0.5;
/**
 * The tone curve, in photographic stops: the median patch sits at ramp
 * position MEDIAN_TONE (just past the body, toward the shadow), and every
 * stop of light more or less moves a patch STOP_TONE along the ramp.
 */
const MEDIAN_TONE = 0.55;
const STOP_TONE = 0.2;
/** Patches smaller than this share of size² are left out: invisible, and the neighbors' strokes cover the spot. */
const MIN_PATCH_AREA = 2e-6;
/** A ray this close to parallel to a facet (cosine) no longer projects reliably through it. */
const GRAZING = 0.02;
/** How far (as a share of `size`) a tweened patch may stray from its true path, and a tone from its true ramp position, where keyframes are dropped. */
const SHAPE_TOLERANCE = 0.002;
const TONE_TOLERANCE = 0.012;
/** How close (as a share of `size`) a spinning patch's corner may come to where the patch shows and still be dropped as irrelevant. */
const CORNER_MARGIN = 0.01;

/** A ray inside the stone leaving facet `face` along `dir`. */
interface Link {
  readonly face: number;
  readonly dir: Vec3;
}

export function diamondSvg(params: DiamondParams = {}): string {
  const p = resolve(params);
  validate(p);
  const active = activeAnimations(p);
  const fmt = numberFormatter(p.precision);
  const id = (name: string): string => `${p.idPrefix}-${name}`;
  const cut = cutOf(p);
  const material: Material = MATERIALS.includes(p.material) ? p.material : "gem";
  const ior = p.refractiveIndex >= 1 ? p.refractiveIndex : 1;
  const model = buildModel(p, cut);
  const timeline = timelineOf(p, active);

  // ------------------------------------------------------------------ poses
  //
  // Everything is drawn around (0,0): the stone's axis is x = 0 and the
  // static pose's silhouette is centered vertically, so the scale
  // animation (`pulse`) scales about the stone's own center.
  const staticRaw = model.vertices.map((v) => project(v, p.yaw, p.pitch));
  const staticYs = staticRaw.map(([, y]) => y);
  const yShift = (Math.min(...staticYs) + Math.max(...staticYs)) / 2;
  const ph = rad(p.pitch);
  /** The line of sight, from the camera into the scene. */
  const view: Vec3 = [0, -Math.sin(ph), -Math.cos(ph)];
  /** A camera-space point on screen. */
  const toScreen = ([x, y, z]: Vec3): Vec => [x, -(y * Math.cos(ph) - z * Math.sin(ph)) - yShift];
  /** The camera-space point on the plane { n · x = offset } that shows at screen point (sx, sy). */
  const lift = ([sx, sy]: Vec, n: Vec3, offset: number): Vec3 => {
    const b: Vec3 = [sx, -(sy + yShift) * Math.cos(ph), (sy + yShift) * Math.sin(ph)];
    return add3(b, scale3(view, (offset - dot3(n, b)) / dot3(n, view)));
  };
  /** Every vertex on screen, for the stone turned by `yaw`. */
  const pose = (yaw: number): Vec[] => model.vertices.map((v) => toScreen(yawed(v, yaw)));
  const worldAt = (yaw: number): World => ({
    vertices: model.vertices.map((v) => yawed(v, yaw)),
    normals: model.faces.map((f) => yawed(f.normal, yaw)),
    offsets: model.faces.map((f) => f.offset),
  });
  const yawAt = timeline ? timeline.yawAt : (): number => p.yaw;
  const orbitAt = timeline ? timeline.orbitAt : (): number => 0;
  const envAt = (t: number): Environment => studio(p, orbitAt(t), view);
  const baseTimes: readonly number[] = timeline ? timeline.keyTimes : [0];
  const turn = timeline?.turn ?? 0;
  const spinning = turn > 0;
  /** The vertices at every base keyframe; frames[0] is the static pose. */
  const frames = baseTimes.map((t) => pose(yawAt(t)));

  // ------------------------------------------------------------------ light

  const ramp: Rgb[] = (() => {
    const parsed = p.colors.map((c) => parseHex(c) ?? ([128, 128, 128] as Rgb));
    return parsed.length === 1 ? deriveRamp(parsed[0]) : parsed;
  })();
  const gradient: Gradient = GRADIENTS.includes(p.gradient) ? p.gradient : "flat";
  const sheen = gradient === "sheen";
  const reach = ABSORPTION * p.size;
  /** Split the facets into patches, or give every facet one tone. */
  const patched = material === "gem" && p.reflections > 0;

  /** The gloss of facet f: the studio mirrored in its surface (Fresnel). */
  const glossOf = (w: World, env: Environment, f: number): number => {
    const n = w.normals[f];
    return fresnel(Math.max(0, -dot3(view, n)), 1, ior) * env(reflect(view, n));
  };
  /** The light that comes out of the gem through facet f at one screen point. */
  const lightThrough = (w: World, env: Environment, f: number, at: Vec): number => {
    const n = w.normals[f];
    const into = refract(view, n, 1 / ior);
    if (!into) return 0;
    return traceInside(w, env, ior, reach, lift(at, n, w.offsets[f]), into, f);
  };

  // ----------------------------------------------------------------- facets

  interface Facet {
    readonly face: Face;
    /** Position in the model's face list — the basis for ids. */
    readonly index: number;
    /** The facet's own keyframes: the base ones plus the moments it turns exactly edge-on. */
    readonly times: readonly number[];
    /** Outline at every keyframe: inset by the half gap while front-facing, its edge-on line otherwise. */
    readonly polys: readonly (readonly Vec[])[];
    /** Whether it faces the camera at every keyframe. */
    readonly facingAt: readonly boolean[];
    /** Whether the static pose (t = 0) shows the facet. */
    readonly shownAtStart: boolean;
    /** Visibility switches at the edge-on moments; null when the facet never leaves the view. */
    readonly visibility: { keyTimes: number[]; values: string[] } | null;
    /** Arc sweep flag of the outline's corners (the outline's winding while front-facing). */
    readonly sweep: 0 | 1;
    /** Center of the facet in the static pose. */
    readonly center: Vec;
    /** keyTimes of this facet's keyframe animations; empty when they are the evenly spaced base ones. */
    readonly keyframeOpts: { keyTimes?: readonly number[] };
  }

  const facets: Facet[] = [];
  model.faces.forEach((face, index) => {
    const isFacing = (yaw: number): boolean => facing(face.normal, yaw, p.pitch) > 1e-9;
    const edgeOns = edgeOnYaws(face.normal, p.pitch);

    // The moments (0..1) the spinning facet turns exactly edge-on, entering
    // or leaving the view. Each becomes a keyframe of its own, where the
    // outline is a line and the visibility switches: the facet grows out of
    // that line, and thins back into it, in step with its neighbors.
    const events: { t: number; entering: boolean }[] = [];
    if (spinning)
      for (const e of edgeOns) {
        let phase = (((e - p.yaw) % 360) + 360) % 360; // degrees into the loop
        if (phase > 360 - 1e-6) phase = 0;
        if (phase >= turn - 1e-9) continue; // past this step of the cut
        events.push({ t: phase / turn, entering: isFacing(e + 0.01) });
      }
    events.sort((a, b) => a.t - b.t);
    const times = [...baseTimes];
    for (const event of events) {
      const snapped = times.find((t) => Math.abs(t - event.t) < 1e-6);
      if (snapped === undefined) times.push(event.t);
      else event.t = snapped;
    }
    times.sort((a, b) => a - b);

    const facingAt = times.map((t) => isFacing(yawAt(t)));
    if (!facingAt.some(Boolean)) return; // never in view (e.g. the table at pitch 0)
    const polys = times.map((t, i) => {
      const yaw = yawAt(t);
      if (facingAt[i]) {
        const verts = pose(yaw);
        const raw = face.indices.map((j) => verts[j]);
        return inset(raw, p.gap / 2) ?? shrink(raw, p.gap / 2);
      }
      // Hidden: the line it is at the nearest edge-on turn (at an edge-on
      // keyframe, that is this very turn) — or, for a facet that only
      // grazes edge-on without turning away, its outline right here.
      if (!edgeOns.length) {
        const verts = pose(yaw);
        return face.indices.map((j) => verts[j]);
      }
      const nearest = edgeOns.reduce((best, e) =>
        Math.abs(foldDeg(e - yaw)) < Math.abs(foldDeg(best - yaw)) ? e : best,
      );
      const edgeOn = pose(nearest);
      return face.indices.map((j) => edgeOn[j]);
    });

    // Visibility: what the static pose shows, then a switch at every edge-on
    // moment (one right at the start decides the initial state instead).
    const atStart = events.find((event) => event.t < 1e-9);
    const initial = atStart ? atStart.entering : facingAt[0];
    const later = events.filter((event) => event.t >= 1e-9);
    const final = later.length ? later[later.length - 1].entering : initial;
    const visibility = events.length
      ? {
          keyTimes: [0, ...later.map((event) => event.t), 1],
          values: [initial, ...later.map((event) => event.entering), final].map((v) =>
            v ? "visible" : "hidden",
          ),
        }
      : null;

    facets.push({
      face,
      index,
      times,
      polys,
      facingAt,
      shownAtStart: facingAt[0],
      visibility,
      sweep: signedArea2(polys[facingAt.indexOf(true)]) > 0 ? 1 : 0,
      center: centroid(face.indices.map((j) => frames[0][j])),
      keyframeOpts: times.length === baseTimes.length ? {} : { keyTimes: times },
    });
  });

  /** A facet's outline as the polygon patches are clipped to (its rounded corners traced by segments). */
  const clipOutline = (poly: readonly Vec[]): Vec[] => roundedPolygon(poly, p.cornerRadius);

  /**
   * The polygon of facet `g` pulled back along a chain of rays onto the
   * chain's first facet, on screen: the points of that facet whose ray,
   * following the chain, reaches g next.
   */
  const pullback = (w: World, chain: readonly Link[], g: number): Vec[] =>
    model.faces[g].indices.map((i) => {
      let q = w.vertices[i];
      for (let k = chain.length - 1; k >= 0; k--) {
        const { face, dir } = chain[k];
        q = add3(
          q,
          scale3(dir, (w.offsets[face] - dot3(w.normals[face], q)) / dot3(w.normals[face], dir)),
        );
      }
      return toScreen(q);
    });

  const minPatchArea = MIN_PATCH_AREA * p.size * p.size;
  /**
   * Walk the patches of facet f (outline `outline`, in world w): for every
   * chain of facets its refracted rays go on to — `reflections` deep, shorter
   * chains first — the exact screen polygon that chain covers.
   */
  const walkPatches = (
    w: World,
    f: number,
    outline: readonly Vec[],
    visit: (chain: readonly number[], poly: Vec[]) => void,
  ): void => {
    const into = refract(view, w.normals[f], 1 / ior);
    if (!into) return;
    const step = (region: Vec[], chain: number[], links: Link[]): void => {
      visit(chain, region);
      if (chain.length > p.reflections) return;
      const last = links[links.length - 1];
      w.normals.forEach((normal, g) => {
        if (g === last.face || dot3(normal, last.dir) <= 1e-9) return;
        const part = clipConvex(pullback(w, links, g), region);
        if (part.length === 0 || area(part) < minPatchArea) return;
        step(part, [...chain, g], [...links, { face: g, dir: reflect(last.dir, normal) }]);
      });
    };
    step(clipOutline(outline), [f], [{ face: f, dir: into }]);
  };

  // ---------------------------------------------------------------- exposure
  //
  // Tones are counted in stops from the median patch of the static pose (by
  // area), whatever the animations do, so the resting pose looks the same.
  const staticWorld = worldAt(yawAt(0));
  const staticEnv = envAt(0);
  const samples: { light: number; area: number }[] = [];
  for (const f of facets) {
    if (!f.facingAt[0] || material === "metal") continue;
    if (patched)
      walkPatches(staticWorld, f.index, f.polys[0], (chain, poly) => {
        if (chain.length === p.reflections + 1)
          samples.push({
            light: lightThrough(staticWorld, staticEnv, f.index, centroid(poly)),
            area: area(poly),
          });
      });
    else
      samples.push({
        light: lightThrough(staticWorld, staticEnv, f.index, centroid(f.polys[0])),
        area: area(f.polys[0]),
      });
  }
  const median = (() => {
    samples.sort((a, b) => a.light - b.light);
    const total = samples.reduce((s, x) => s + x.area, 0);
    let seen = 0;
    return Math.max(samples.find((x) => (seen += x.area) >= total / 2)?.light ?? 1, 1e-6);
  })();
  /** Ramp position (0: highlight, 1: shadow) of a patch that sends the camera `light`. */
  const toneOf = (light: number): number => {
    const stops = Math.log2(Math.max(light, median / 1024) / median);
    return clamp(0.5 + p.shading * (MEDIAN_TONE - 0.5 - STOP_TONE * stops), 0, 1);
  };

  /** Fill every gap in a per-keyframe track with the value of the nearest keyframe that has one. */
  const holdNearest = <T>(times: readonly number[], values: readonly (T | null)[]): T[] | null => {
    const known = values.flatMap((v, i) => (v === null ? [] : [i]));
    if (!known.length) return null;
    return values.map((v, i) => {
      if (v !== null) return v;
      const j = known.reduce((best, k) =>
        Math.abs(times[k] - times[i]) < Math.abs(times[best] - times[i]) ? k : best,
      );
      return values[j] as T;
    });
  };

  /**
   * The facet's tone (one per facet — or, patched, its base under the
   * patches) and gloss at each of its keyframes. A metal facet's tone comes
   * from how squarely it faces the key light, with half-wrap lighting so the
   * facets past the light's terminator keep some shading.
   */
  const facetLight = (f: Facet): { tones: number[]; glosses: number[] } => {
    const light = f.times.map((t, i) => {
      if (!f.facingAt[i]) return null;
      const w = worldAt(yawAt(t));
      if (material === "metal") {
        const key = orbitLight(lightVector(p.lightAngle, p.lightElevation), orbitAt(t));
        const lit = clamp((dot3(w.normals[f.index], key) + METAL_WRAP) / (1 + METAL_WRAP), 0, 1);
        return { tone: clamp(0.5 + p.shading * (0.5 - lit), 0, 1), gloss: 0 };
      }
      const env = envAt(t);
      return {
        tone: toneOf(lightThrough(w, env, f.index, centroid(f.polys[i]))),
        gloss: glossOf(w, env, f.index),
      };
    });
    const held = holdNearest(f.times, light)!;
    return { tones: held.map((l) => l.tone), glosses: held.map((l) => l.gloss) };
  };

  // ---------------------------------------------------------------- patches
  //
  // A patch is a chain of facets [f, g1, …]: the part of facet f whose rays,
  // refracted into the stone, reach g1 next, then (reflected there) g2 next…
  // A still stone gets every patch as its exact polygon. A spinning one gets
  // every patch that shows at some keyframe as a tweened polygon — facet g's
  // pullback along the chain, which keeps its corner count as the stone
  // turns — clipped to its facet (and to the patch it splits) by the SVG
  // renderer, with keyframes of its own where a facet of the chain turns
  // parallel to the ray, where the patch vanishes and the visibility switches.

  interface Patch {
    readonly chain: readonly number[];
    readonly times: readonly number[];
    /** Screen polygon at every keyframe: exact when still, the unclipped pullback when spinning. */
    readonly polys: readonly (readonly Vec[])[];
    /** Ramp position at every keyframe. */
    readonly tones: readonly number[];
    readonly shownAtStart: boolean;
    readonly visibility: { keyTimes: number[]; values: string[] } | null;
    /** The patches that split this one, one reflection deeper. */
    readonly children: Patch[];
  }

  /** The rays of a chain for the stone turned by `yaw`: the refracted one into its facet, then the reflected one off each next facet — null while the facet looks away. */
  const chainRays = (chain: readonly number[], normals: readonly Vec3[]): Link[] | null => {
    const n0 = normals[chain[0]];
    if (-dot3(n0, view) < 0) return null;
    let dir = refract(view, n0, 1 / ior);
    if (!dir) return null;
    const links: Link[] = [{ face: chain[0], dir }];
    for (let k = 1; k < chain.length; k++) {
      dir = reflect(dir, normals[chain[k]]);
      links.push({ face: chain[k], dir });
    }
    return links;
  };
  /**
   * How squarely each facet of the chain lies ahead of its incoming ray
   * (> 0: the ray reaches it), the facet facing the camera first; null
   * while the facet looks away.
   */
  const chainAhead = (chain: readonly number[], yaw: number): number[] | null => {
    const normals = chain.map((g) => yawed(model.faces[g].normal, yaw));
    const facingCam = -dot3(normals[0], view);
    if (facingCam < 0) return null;
    let dir = refract(view, normals[0], 1 / ior);
    if (!dir) return null;
    const ahead = [facingCam];
    for (let k = 1; k < chain.length; k++) {
      ahead.push(dot3(normals[k], dir));
      dir = reflect(dir, normals[k]);
    }
    return ahead;
  };

  const patchesOf = (f: Facet): Patch[] => {
    const leafDepth = p.reflections + 1;
    if (!spinning) {
      // Still: the exact patches of the static pose, their tones over the
      // timeline (`colorFlow`).
      const root: Patch[] = [];
      const w = staticWorld;
      walkPatches(w, f.index, f.polys[0], (chain, poly) => {
        if (chain.length !== leafDepth) return;
        const at = centroid(poly);
        root.push({
          chain,
          times: baseTimes,
          polys: [poly],
          tones: baseTimes.map((t) => toneOf(lightThrough(w, envAt(t), f.index, at))),
          shownAtStart: true,
          visibility: null,
          children: [],
        });
      });
      return root;
    }

    // Spinning: first, every chain that covers some area at some base keyframe.
    const chains = new Map<string, readonly number[]>();
    f.times.forEach((t, i) => {
      if (!f.facingAt[i] || !baseTimes.includes(t)) return;
      walkPatches(worldAt(yawAt(t)), f.index, f.polys[i], (chain) => {
        if (chain.length > 1) chains.set(chain.join("."), chain);
      });
    });

    const track = (chain: readonly number[]): Patch | null => {
      // Keyframes: the facet's own, plus every moment a facet of the chain
      // turns parallel to its incoming ray (found by bisection).
      const moments: number[] = [];
      const SUBSTEPS = 4;
      for (let i = 0; i + 1 < f.times.length; i++) {
        let t0 = f.times[i];
        let a0 = chainAhead(chain, yawAt(t0));
        for (let s = 1; s <= SUBSTEPS; s++) {
          const t1 = f.times[i] + ((f.times[i + 1] - f.times[i]) * s) / SUBSTEPS;
          const a1 = chainAhead(chain, yawAt(t1));
          if (a0 && a1)
            for (let k = 1; k < chain.length; k++) {
              if (a0[k] > 0 === a1[k] > 0) continue;
              let lo = t0;
              let hi = t1;
              for (let it = 0; it < 40; it++) {
                const mid = (lo + hi) / 2;
                const am = chainAhead(chain, yawAt(mid));
                if (am && am[k] > 0 === a0[k] > 0) lo = mid;
                else hi = mid;
              }
              moments.push((lo + hi) / 2);
            }
          t0 = t1;
          a0 = a1;
        }
      }
      const times = [...f.times];
      for (const m of moments) if (!times.some((t) => Math.abs(t - m) < 1e-7)) times.push(m);
      times.sort((a, b) => a - b);

      // Shown between two keyframes when every facet of the chain lies ahead.
      const shown = (t: number): boolean =>
        chainAhead(chain, yawAt(t))?.every((a) => a > 0) ?? false;
      const between = range(times.length - 1).map((i) => shown((times[i] + times[i + 1]) / 2));
      if (!between.some(Boolean)) return null;

      const polys: (Vec[] | null)[] = [];
      /** Where the patch can show at every keyframe: its facet, cut down to the patch it splits. */
      const reaches: (Vec[] | null)[] = [];
      const tones: (number | null)[] = [];
      for (const [i, t] of times.entries()) {
        // Hidden on both sides of this keyframe: the patch holds still.
        if (!between[i - 1] && !between[i]) {
          polys.push(null);
          reaches.push(null);
          tones.push(null);
          continue;
        }
        const w = worldAt(yawAt(t));
        const links = chainRays(chain, w.normals);
        // The pullback divides by how squarely each earlier facet of the
        // chain meets its ray: hold it where one runs nearly parallel.
        const reliable =
          links !== null &&
          Math.abs(dot3(w.normals[chain[0]], links[0].dir)) >= GRAZING &&
          range(chain.length - 2).every(
            (k) => Math.abs(dot3(w.normals[chain[k + 1]], links[k].dir)) >= GRAZING,
          );
        if (!links || !reliable) {
          polys.push(null);
          reaches.push(null);
          tones.push(null);
          continue;
        }
        const own = pullback(w, links.slice(0, -1), chain[chain.length - 1]);
        polys.push(own);
        const verts = pose(yawAt(t));
        const raw = f.face.indices.map((j) => verts[j]);
        let reach: Vec[] = clipOutline(inset(raw, p.gap / 2) ?? shrink(raw, p.gap / 2));
        for (let k = 1; k < chain.length - 1 && reach.length; k++)
          reach = clipConvex(pullback(w, links.slice(0, k), chain[k]), reach);
        reaches.push(reach.length ? reach : null);
        if (chain.length !== leafDepth) {
          tones.push(null);
          continue;
        }
        // The exact patch at this keyframe, for its tone.
        const region = reach.length ? clipConvex(own, reach) : [];
        tones.push(
          region.length && area(region) > 1e-9
            ? toneOf(lightThrough(w, envAt(t), f.index, centroid(region)))
            : null,
        );
      }
      const heldPolys = holdNearest(times, polys);
      if (!heldPolys) return null;
      const heldTones = holdNearest(times, tones) ?? times.map(() => 0.5);

      // Drop every corner whose triangle (with its two neighbors) never
      // reaches where the patch can show: the patch shows exactly the same,
      // with fewer numbers per keyframe — a facet pulled back from across the
      // stone mostly lies outside the facet it shows in.
      const margin = CORNER_MARGIN * p.size;
      const grown = reaches.map((reach) => reach && (inset(reach, -margin) ?? reach));
      const corners = range(heldPolys[0].length);
      for (let j = 0; j < corners.length && corners.length > 3; j++) {
        const n = corners.length;
        const [a, b, c] = [corners[(j + n - 1) % n], corners[j], corners[(j + 1) % n]];
        const touches = grown.some(
          (reach, i) =>
            reach && clipConvex([heldPolys[i][a], heldPolys[i][b], heldPolys[i][c]], reach).length,
        );
        if (touches) continue;
        corners.splice(j, 1);
        j = -1; // the neighbors' triangles changed: look again from the start
      }
      const trimmed = heldPolys.map((poly) => corners.map((k) => poly[k]));

      const switches = range(times.length - 1).filter(
        (i) => i > 0 && between[i] !== between[i - 1],
      );
      const visibility = switches.length
        ? {
            keyTimes: [0, ...switches.map((i) => times[i]), 1],
            values: [
              between[0],
              ...switches.map((i) => between[i]),
              between[between.length - 1],
            ].map((v) => (v ? "visible" : "hidden")),
          }
        : null;
      return {
        chain,
        times,
        polys: trimmed,
        tones: heldTones,
        shownAtStart: between[0],
        visibility,
        children: [],
      };
    };

    // Build the tree: every chain under its parent (dropped with it).
    const byKey = new Map<string, Patch>();
    const root: Patch[] = [];
    [...chains.values()]
      .sort((a, b) => a.length - b.length)
      .forEach((chain) => {
        const parent = chain.length > 2 ? byKey.get(chain.slice(0, -1).join(".")) : undefined;
        if (chain.length > 2 && !parent) return;
        const patch = track(chain);
        if (!patch) return;
        byKey.set(chain.join("."), patch);
        (parent ? parent.children : root).push(patch);
      });
    return root;
  };

  // ---------------------------------------------------------------- output

  const dOf = (poly: readonly Vec[], sweep: 0 | 1): string =>
    poly
      .map((pt, i) => {
        const c = roundCorner(poly, i, p.cornerRadius);
        const enter = `${i === 0 ? "M" : "L"}${fmt(c.from[0])} ${fmt(c.from[1])}`;
        // With rounding on, every corner is written as an arc (radius 0 = a
        // plain corner, and the flag is the facet's so a hidden, flattened
        // outline keeps it), so all keyframes of a tweened outline share one
        // command structure — which is what SMIL needs to interpolate `d`.
        return p.cornerRadius > 0
          ? `${enter} A${fmt(c.r)} ${fmt(c.r)} 0 0 ${sweep} ${fmt(c.to[0])} ${fmt(c.to[1])}`
          : enter;
      })
      .join(" ") + " Z";
  /**
   * A patch's polygon, compact: after the M, every pair is an implicit L.
   * Spinning patches take one decimal less: they lie inside their facet's
   * clip, and neighbors share their corners exactly, so rounding opens no
   * seam.
   */
  const patchFmt = spinning ? numberFormatter(Math.max(0, p.precision - 1)) : fmt;
  const patchD = (poly: readonly Vec[]): string =>
    "M" + poly.map(([x, y]) => `${patchFmt(x)} ${patchFmt(y)}`).join(" ") + "Z";
  /** Patches are painted by one CSS rule — their color in currentColor, stroked one screen pixel wide so no seam shows between neighbors. */
  const patchClass = id("p");

  const period = timeline?.period ?? 0;
  /** The animation of one attribute through a track's essential keyframes; empty when it holds still. */
  const trackAnimate = (
    attr: string,
    times: readonly number[],
    values: readonly (readonly number[])[],
    tolerance: number,
    format: (value: readonly number[]) => string,
    keep?: (i: number) => boolean,
  ): string => {
    if (!timeline) return "";
    const kept = essentialKeyframes(times, values, tolerance, keep);
    const formatted = kept.map((i) => format(values[i]));
    if (formatted.every((v) => v === formatted[0])) return "";
    const uniform =
      kept.length === baseTimes.length && kept.every((i, j) => times[i] === baseTimes[j]);
    return animateEl(
      "animate",
      attr,
      period,
      formatted,
      uniform ? {} : { keyTimes: kept.map((i) => times[i]) },
    );
  };
  /**
   * A tone track as a color animation, through its essential keyframes —
   * plus one wherever the tone crosses a ramp stop between two of them:
   * SMIL blends colors in a straight line, which would cut across the ramp
   * (a flash from shadow to highlight would pass through gray), so the
   * color follows the ramp instead.
   */
  const colorAnimate = (times: readonly number[], tones: readonly number[]): string => {
    if (!timeline) return "";
    const kept = essentialKeyframes(
      times,
      tones.map((t) => [t]),
      TONE_TOLERANCE,
    );
    const keyTimes: number[] = [];
    const colors: string[] = [];
    const segments = ramp.length - 1;
    kept.forEach((i, j) => {
      if (j > 0) {
        const a = kept[j - 1];
        const [from, to] = [tones[a], tones[i]];
        const lo = Math.min(from, to) * segments;
        const hi = Math.max(from, to) * segments;
        const stops = range(Math.ceil(hi) - Math.floor(lo) + 1)
          .map((k) => Math.floor(lo) + k)
          .filter((s) => s > lo && s < hi)
          .map((s) => s / segments);
        if (to < from) stops.reverse();
        for (const stop of stops) {
          keyTimes.push(times[a] + ((stop - from) / (to - from)) * (times[i] - times[a]));
          colors.push(rampAt(ramp, stop));
        }
      }
      keyTimes.push(times[i]);
      colors.push(rampAt(ramp, tones[i]));
    });
    if (colors.every((c) => c === colors[0])) return "";
    const uniform =
      keyTimes.length === baseTimes.length && keyTimes.every((t, j) => t === baseTimes[j]);
    return animateEl("animate", "color", period, colors, uniform ? {} : { keyTimes });
  };
  /**
   * A patch as a path: its polygon tweened through its essential keyframes
   * (keeping the moments its visibility switches, where it is flat) and its
   * visibility switches — plus, painted, its tone.
   */
  const patchPath = (patch: Patch, indent: string, painted = true): string => {
    const switches = new Set(patch.visibility?.keyTimes ?? []);
    const shape = spinning
      ? trackAnimate(
          "d",
          patch.times,
          patch.polys.map((poly) => poly.flat()),
          SHAPE_TOLERANCE * p.size,
          (flat) => patchD(range(flat.length / 2).map((k): Vec => [flat[2 * k], flat[2 * k + 1]])),
          (i) => switches.has(patch.times[i]),
        )
      : "";
    const color = painted ? colorAnimate(patch.times, patch.tones) : "";
    const paint = painted ? `class="${patchClass}" color="${rampAt(ramp, patch.tones[0])}" ` : "";
    const hidden = patch.shownAtStart ? "" : ` visibility="hidden"`;
    const attrs = `${paint}d="${patchD(patch.polys[0])}"${hidden}`;
    const inner = shape + visibilityAnimate(patch.visibility) + color;
    return inner ? `${indent}<path ${attrs}>${inner}</path>` : `${indent}<path ${attrs}/>`;
  };
  /** Tween a polygon track through its keyframes. */
  const shapeAnimate = (
    polys: readonly (readonly Vec[])[],
    d: (poly: readonly Vec[]) => string,
    opts: { keyTimes?: readonly number[] },
  ): string => (spinning ? animateEl("animate", "d", period, polys.map(d), opts) : "");
  /** Switch visibility at the recorded moments. */
  const visibilityAnimate = (visibility: { keyTimes: number[]; values: string[] } | null): string =>
    timeline && visibility
      ? animateEl("animate", "visibility", period, visibility.values, {
          keyTimes: visibility.keyTimes,
          calcMode: "discrete",
        })
      : "";
  /**
   * Paint for a tone track: fill and stroke in one color when it holds still;
   * otherwise both in currentColor, and the color animated.
   */
  const paintOf = (
    times: readonly number[],
    tones: readonly number[],
  ): { attrs: string; animate: string } => {
    const color = rampAt(ramp, tones[0]);
    const animate = colorAnimate(times, tones);
    return animate
      ? { attrs: `fill="currentColor" stroke="currentColor" color="${color}"`, animate }
      : { attrs: `fill="${color}" stroke="${color}"`, animate: "" };
  };

  const defs: string[] = [];
  const outlineIds = new Map<number, string>();
  /** The facet's outline, defined once (with its geometry animations) for every layer that <use>s it. */
  const outlineOf = (f: Facet): string => {
    const known = outlineIds.get(f.index);
    if (known) return known;
    const oid = id(`f${f.index}`);
    const geometry =
      shapeAnimate(f.polys, (poly) => dOf(poly, f.sweep), f.keyframeOpts) +
      visibilityAnimate(f.visibility);
    const d0 = dOf(f.polys[0], f.sweep);
    const hidden = f.shownAtStart ? "" : ` visibility="hidden"`;
    defs.push(
      geometry
        ? `    <path id="${oid}" ${STROKE_ATTRS} d="${d0}"${hidden}>${geometry}</path>`
        : `    <path id="${oid}" ${STROKE_ATTRS} d="${d0}"${hidden}/>`,
    );
    outlineIds.set(f.index, oid);
    return oid;
  };
  const use = (href: string, attrs: string, inner = ""): string =>
    inner ? `  <use href="#${href}" ${attrs}>${inner}</use>` : `  <use href="#${href}" ${attrs}/>`;

  // The sheen runs toward the light: from the facet's side nearest the key
  // light to the far side, in each facet's own box.
  const sheenDir = ((): Vec => {
    const light = lightVector(p.lightAngle, p.lightElevation);
    const v: Vec = [light[0], -(light[1] * Math.cos(ph) - light[2] * Math.sin(ph))];
    const len = Math.hypot(...v);
    return len < 1e-6 ? [0, -1] : [v[0] / len, v[1] / len];
  })();
  const sheenFrom: Vec = [0.5 + 0.5 * sheenDir[0], 0.5 + 0.5 * sheenDir[1]];
  const sheenTo: Vec = [0.5 - 0.5 * sheenDir[0], 0.5 - 0.5 * sheenDir[1]];
  const gradientAttrs =
    `x1="${frac(sheenFrom[0])}" y1="${frac(sheenFrom[1])}"` +
    ` x2="${frac(sheenTo[0])}" y2="${frac(sheenTo[1])}"`;
  let glossGradient = false;
  /**
   * The gloss takes the ramp's highlight: white light mirrored off a dark
   * patch would gray it, where the highlight pales it like the milky
   * reflections on a real stone.
   */
  const glossColor = rampAt(ramp, 0);

  /** The gloss on a facet: a glaze in the highlight (fading toward the far side with the sheen), following the facet's gloss over time. */
  const glazeOf = (f: Facet, glosses: readonly number[]): string => {
    const values = glosses.map((g) => clamp(g, 0, MAX_GLOSS));
    if (Math.max(...values) < MIN_GLOSS) return "";
    const fill = sheen ? `url(#${id("gloss")})` : glossColor;
    glossGradient ||= sheen;
    const moves = timeline !== null && values.some((v) => Math.abs(v - values[0]) > 1e-4);
    return use(
      outlineOf(f),
      `fill="${fill}" fill-opacity="${frac(values[0])}"`,
      moves ? animateEl("animate", "fill-opacity", period, values.map(frac), f.keyframeOpts) : "",
    );
  };

  /** A metal facet's sheen: a gradient around its tone, a shade lighter toward the light. */
  const metalSheenOf = (f: Facet, tones: readonly number[]): string => {
    const gid = id(`g${f.index}`);
    const spread = SHEEN_SPREAD * p.shading;
    const moves = timeline !== null && tones.some((t) => Math.abs(t - tones[0]) > 1e-4);
    const stop = (offset: number): string => {
      const color = rampAt(ramp, tones[0] + offset);
      const animate = moves
        ? animateEl(
            "animate",
            "stop-color",
            period,
            tones.map((t) => rampAt(ramp, t + offset)),
            f.keyframeOpts,
          )
        : "";
      const at = offset < 0 ? 0 : 1;
      return animate
        ? `      <stop offset="${at}" stop-color="${color}">${animate}</stop>`
        : `      <stop offset="${at}" stop-color="${color}"/>`;
    };
    defs.push(
      [
        `    <linearGradient id="${gid}" ${gradientAttrs}>`,
        stop(-spread),
        stop(spread),
        `    </linearGradient>`,
      ].join("\n"),
    );
    return `url(#${gid})`;
  };

  // -------------------------------------------------- per-facet animations

  // `sweep`: the band travels along `sweepAngle`; every facet lights up
  // as the band's center passes its own position along that direction.
  const sweepDir: Vec = [Math.cos(rad(p.sweepAngle)), Math.sin(rad(p.sweepAngle))];
  const along = (pt: Vec): number => pt[0] * sweepDir[0] + pt[1] * sweepDir[1];
  const sweepLo = Math.min(...frames[0].map(along));
  const sweepHi = Math.max(...frames[0].map(along));
  function sweepAnimate(f: Facet): string {
    const w = p.sweepWidth;
    const at = (along(f.center) - sweepLo) / (sweepHi - sweepLo);
    const period = p.sweepDuration + p.sweepHold;
    // The band's center runs from -w to 1 + w over `sweepDuration`; the facet
    // brightens while the center is within w of it.
    const time = (s: number): number => (((s + w) / (1 + 2 * w)) * p.sweepDuration) / period;
    const keyTimes = [0, Math.max(time(at - w), 0.0005), time(at), time(at + w), 1];
    return animateEl("animate", "opacity", period, ["0", "0", frac(p.sweepIntensity), "0", "0"], {
      keyTimes,
      splines: [LINEAR, EASE, EASE, LINEAR],
      additive: true,
    });
  }

  // `glow`: brightness by distance from the table's center, breathing.
  const tableCenter = ((): Vec => {
    const [x, y] = project(model.tableCenter, p.yaw, p.pitch);
    return [x, y - yShift];
  })();
  function glowAnimate(f: Facet): string {
    const distance = Math.hypot(f.center[0] - tableCenter[0], f.center[1] - tableCenter[1]);
    const peak = p.glowIntensity * Math.max(0, 1 - distance / p.glowRadius) ** 2;
    if (peak < 0.005) return "";
    return animateEl("animate", "opacity", p.glowDuration, ["0", frac(peak), "0"], {
      keyTimes: [0, 0.5, 1],
      splines: [EASE, EASE],
      additive: true,
    });
  }

  // `pulse`: rest, then pop — the scale on the group, the flash on the facets.
  const pulsePeriod = p.pulseHold + p.pulseDuration;
  const pulseRest = p.pulseHold / pulsePeriod;
  const pulseTime = (fraction: number): number =>
    pulseRest + (fraction * p.pulseDuration) / pulsePeriod;
  const pulseFlashAnimate = (): string =>
    animateEl("animate", "opacity", pulsePeriod, ["0", "0", frac(p.pulseFlash), "0", "0"], {
      keyTimes: [0, pulseRest, pulseTime(0.3), pulseTime(0.9), 1],
      splines: [LINEAR, "0.2 0 0.4 1", EASE, LINEAR],
      additive: true,
    });
  const pulseScaleAnimate = (): string =>
    animateEl(
      "animateTransform",
      "transform",
      pulsePeriod,
      ["1", "1", frac(p.pulseScale), frac(1 - (p.pulseScale - 1) * 0.3), "1"],
      {
        type: "scale",
        keyTimes: [0, pulseRest, pulseTime(0.35), pulseTime(0.7), 1],
        splines: [LINEAR, "0.2 0 0.4 1", EASE, EASE],
      },
    );

  // --------------------------------------------------------------- the body

  // Spinning patches are clipped to their facet, which leaves the facet's
  // own edges anti-aliased against whatever lies beneath: so every facet is
  // first laid down whole, in its base tone and stroked one screen pixel
  // wide, and no seam shows between facets.
  const bases: string[] = [];
  const body: string[] = [];
  for (const f of facets) {
    const { tones, glosses } = facetLight(f);
    if (patched) {
      const patches = patchesOf(f);
      if (spinning) {
        const base = paintOf(f.times, tones);
        bases.push(use(outlineOf(f), base.attrs, base.animate));
        const cid = id(`c${f.index}`);
        defs.push(`    <clipPath id="${cid}"><use href="#${outlineOf(f)}"/></clipPath>`);
        const draw = (patch: Patch, indent: string): string[] => {
          if (!patch.children.length) return [patchPath(patch, indent)];
          // A patch split further: its polygon clips the patches inside it.
          const pid = id(`c${patch.chain.join("-")}`);
          defs.push(`    <clipPath id="${pid}">${patchPath(patch, "", false)}</clipPath>`);
          return [
            `${indent}<g clip-path="url(#${pid})">`,
            ...patch.children.flatMap((child) => draw(child, indent + "  ")),
            `${indent}</g>`,
          ];
        };
        body.push(
          `  <g clip-path="url(#${cid})">`,
          ...patches.flatMap((patch) => draw(patch, "    ")),
          `  </g>`,
        );
      } else body.push(...patches.map((patch) => patchPath(patch, "  ")));
    } else {
      // One tone per facet: the facet itself is the patch, stroked in its
      // own paint so no seam shows between neighbors.
      const sheenFill = material === "metal" && sheen ? metalSheenOf(f, tones) : null;
      const paint = sheenFill
        ? { attrs: `fill="${sheenFill}" stroke="${sheenFill}"`, animate: "" }
        : paintOf(f.times, tones);
      body.push(use(outlineOf(f), paint.attrs, paint.animate));
    }
    body.push(glazeOf(f, glosses));
    const light = [
      active.sweep && p.sweepIntensity > 0 ? sweepAnimate(f) : "",
      active.glow && p.glowIntensity > 0 ? glowAnimate(f) : "",
      active.pulse && p.pulseFlash > 0 ? pulseFlashAnimate() : "",
    ].join("");
    // The light the animations add pales the facet toward its highlight,
    // like the gloss (white would gray the dark patches).
    if (light)
      body.push(
        use(outlineOf(f), `fill="${glossColor}" stroke="${glossColor}" opacity="0"`, light),
      );
  }
  if (patched)
    defs.unshift(
      `    <style>.${patchClass}{fill:currentColor;stroke:currentColor;stroke-width:1px;` +
        `stroke-linejoin:round;vector-effect:non-scaling-stroke}</style>`,
    );
  if (glossGradient)
    defs.push(
      `    <linearGradient id="${id("gloss")}" ${gradientAttrs}>` +
        `<stop offset="0" stop-color="${glossColor}"/>` +
        `<stop offset="1" stop-color="${glossColor}" stop-opacity="${SHEEN_FADE}"/></linearGradient>`,
    );

  // `glint`: sparkles at the front's extreme corners (left/right of the top
  // edge, the girdle's right and left tips) and at the culet — each popping
  // once per cycle on its own schedule, and riding its corner as the stone
  // turns (over a whole revolution, whatever the facets' loop).
  const glintSpots = ((): number[] => {
    const step = 360 / p.sides;
    const azimuth = (i: number): number =>
      foldDeg(deg(Math.atan2(model.vertices[i][0], model.vertices[i][2])) + p.yaw);
    const nearest = (ring: readonly number[], target: number): number =>
      ring.reduce((best, i) =>
        Math.abs(foldDeg(azimuth(i) - target)) < Math.abs(foldDeg(azimuth(best) - target))
          ? i
          : best,
      );
    const edge = 90 - step / 2;
    return [
      nearest(model.tableRing, -edge),
      nearest(model.girdleRing, edge),
      model.culet,
      nearest(model.tableRing, step / 2),
      nearest(model.girdleRing, -edge),
    ];
  })();
  const rideTimes = spinning ? range(p.spinSteps + 1).map((i) => i / p.spinSteps) : [0];
  const rideFrames = rideTimes.map((t) => pose(p.yaw + 360 * t));
  const glints: string[] = [];
  if (active.glint) {
    const s = p.glintSize;
    const star = `M0 ${fmt(-s)}Q0 0 ${fmt(s)} 0Q0 0 0 ${fmt(s)}Q0 0 ${fmt(-s)} 0Q0 0 0 ${fmt(-s)}Z`;
    const period = p.glintDuration;
    const pop = period * 0.16;
    for (let k = 0; k < p.glintCount; k++) {
      const vertex = glintSpots[k];
      const start = (0.02 + ((0.11 + k * 0.618) % 1) * 0.97) * (period - pop);
      const keyTimes = [0, start / period, (start + pop / 2) / period, (start + pop) / period, 1];
      const splines = [LINEAR, "0.2 0 0.4 1", EASE, LINEAR];
      const positions = rideFrames.map((verts) => verts[vertex]);
      const [x0, y0] = positions[0];
      const ride = spinning
        ? animateEl(
            "animateTransform",
            "transform",
            p.spinDuration,
            positions.map(([x, y]) => `${fmt(x)} ${fmt(y)}`),
            { type: "translate" },
          )
        : "";
      glints.push(
        `  <g transform="translate(${fmt(x0)} ${fmt(y0)})">${ride}` +
          `<path d="${star}" fill="${p.glintColor}" opacity="0">` +
          animateEl("animate", "opacity", period, ["0", "0", "1", "0", "0"], {
            keyTimes,
            splines,
          }) +
          animateEl("animateTransform", "transform", period, ["0", "0", "1", "0", "0"], {
            type: "scale",
            keyTimes,
            splines,
          }) +
          animateEl("animateTransform", "transform", period, ["0", "0", "45", "90", "90"], {
            type: "rotate",
            keyTimes,
            additive: true,
          }) +
          `</path></g>`,
      );
    }
  }

  // ------------------------------------------------- whole-stone animations

  let content = [...bases, ...body.filter(Boolean), ...glints];
  const wrap = (animate: string): void => {
    content = ["  <g>", `    ${animate}`, ...content, "  </g>"];
  };
  if (active.pulse) wrap(pulseScaleAnimate());
  if (active.float)
    wrap(
      animateEl(
        "animateTransform",
        "transform",
        p.floatDuration,
        ["0 0", `0 ${fmt(-p.floatHeight)}`, "0 0"],
        {
          type: "translate",
          keyTimes: [0, 0.5, 1],
          splines: [EASE, EASE],
        },
      ),
    );

  // ---------------------------------------------------------------- canvas

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const include = ([x, y]: Vec, margin = 0): void => {
    minX = Math.min(minX, x - margin);
    maxX = Math.max(maxX, x + margin);
    minY = Math.min(minY, y - margin);
    maxY = Math.max(maxY, y + margin);
  };
  // The loop covers one step of the cut, whose poses together reach every
  // spot a whole revolution does.
  for (const verts of frames) for (const v of verts) include(v);
  if (active.pulse) {
    minX *= p.pulseScale;
    maxX *= p.pulseScale;
    minY *= p.pulseScale;
    maxY *= p.pulseScale;
  }
  if (active.glint)
    for (let k = 0; k < p.glintCount; k++)
      for (const verts of rideFrames) include(verts[glintSpots[k]], p.glintSize);

  // `float`'s ground shadow sits under the resting stone; it shrinks and
  // fades as the stone rises.
  const shadow: string[] = [];
  if (active.float) {
    minY -= p.floatHeight;
    if (p.floatShadow) {
      const rx = p.size * 0.3;
      const ry = p.size * 0.06;
      const cy = Math.max(...frames[0].map(([, y]) => y)) + p.size * 0.035 + ry;
      const breathe = (from: number, to: number, attr: string, format = frac): string =>
        animateEl("animate", attr, p.floatDuration, [format(from), format(to), format(from)], {
          keyTimes: [0, 0.5, 1],
          splines: [EASE, EASE],
        });
      shadow.push(
        `  <ellipse cx="0" cy="${fmt(cy)}" rx="${fmt(rx)}" ry="${fmt(ry)}" fill="#000" fill-opacity="0.18">` +
          breathe(rx, rx * 0.7, "rx", fmt) +
          breathe(ry, ry * 0.7, "ry", fmt) +
          breathe(0.18, 0.09, "fill-opacity") +
          `</ellipse>`,
      );
      maxY = Math.max(maxY, cy + ry);
    }
  }

  // The axis stays centered: the canvas is as wide as the mark's wider side.
  const halfWidth = Math.max(-minX, maxX) + p.padding;
  const [x, y, w, h] = [
    -halfWidth,
    minY - p.padding,
    2 * halfWidth,
    maxY - minY + 2 * p.padding,
  ].map(fmt);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">`,
    ...(p.background
      ? [`  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.background}"/>`]
      : []),
    ...(defs.length ? ["  <defs>", ...defs, "  </defs>"] : []),
    ...shadow,
    ...content,
    `</svg>`,
    ``,
  ].join("\n");
}
