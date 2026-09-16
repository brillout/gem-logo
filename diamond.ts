/**
 * diamond.ts — parametric generator for the gem mark: a faceted diamond.
 *
 * How the shape works
 * -------------------
 * The mark is the orthographic projection of a real 3D model of a cut stone:
 * a `sides`-sided table on top, a ring of `sides` trapezoid crown facets
 * running down to the girdle (the widest polygon), and `sides` triangular
 * pavilion facets meeting at the culet point below. Four lengths drive it:
 *
 *   size            girdle width (circumdiameter of the girdle polygon)
 *   tableSize       table width (circumdiameter of the table polygon)
 *   crownHeight     girdle → table
 *   pavilionHeight  girdle → culet
 *
 * The camera looks at the stone from the front (a flat girdle side facing
 * the viewer): straight from the side by default, the classic icon with the
 * table edge-on, or elevated by `pitch` degrees so the table shows; the
 * stone can be turned about its vertical axis by `yaw` degrees. Every facet is
 * projected to a 2D polygon, inset by half the `gap` so neighboring facets
 * are separated by a transparent seam, and optionally rounded
 * (`cornerRadius`). The stone is convex, so front-facing facets never overlap
 * and back-facing ones are simply not drawn — which is also what makes the
 * `spin` animation possible without any z-sorting.
 *
 * Color
 * -----
 * A gem is one color, so `colors` is a tone ramp of that one color, lightest
 * first: highlight, body, shadow — any number of stops (color-palettes.ts
 * has ready-made ones; a single color gets its highlight and shadow
 * derived). Every facet takes its tone from how squarely it faces a light
 * at azimuth `lightAngle` (0 = from the viewer, 90 = from the right) and
 * `lightElevation` degrees above the horizon: facets turned toward the
 * light climb toward the highlight, facets turned away sink toward the
 * shadow, and `shading` sets how far along the ramp they go (0: every facet
 * the middle tone, 1: the full ramp). Half-wrap lighting keeps facets past
 * the light's terminator from clamping to one flat dark tone, so the
 * pavilion keeps its left/right variation.
 *
 * `gradient` picks how a facet wears its tone:
 *   "sheen"   (default) a soft gradient across each facet, a shade lighter
 *             toward the light and darker away from it — the glassy look.
 *   "flat"    every facet one solid tone.
 *
 * Animation
 * ---------
 * Every animation is an independent toggle with its own timing, rendered as
 * native SVG <animate>/<animateTransform> elements (no JS at runtime, so
 * they play inside <img> tags and READMEs). Each one loops seamlessly, and
 * at t = 0 every animation rests in the static pose, so static renderers
 * (which ignore SMIL) show exactly the un-animated mark. They combine freely.
 *
 *   colorFlow  the light circles the stone once every `colorFlowDuration`
 *              seconds — around the viewing axis, so it always lights the
 *              front — and the tones flow around the facets: each facet
 *              brightens as the light passes its side and dims again.
 *   sweep      a band of light crosses the mark along `sweepAngle`: each
 *              facet flares up (white overlay, `sweepIntensity`) as the band
 *              passes over its center, over `sweepDuration` seconds, then
 *              rests for `sweepHold` seconds.
 *   glint      `glintCount` four-point sparkles pop and fade at facet corners
 *              on a staggered schedule that repeats every `glintDuration`
 *              seconds.
 *   glow       a soft highlight breathes on the table: facets near its
 *              center brighten (up to `glowIntensity`, fading out over
 *              `glowRadius`) and dim again every `glowDuration` seconds.
 *   spin       the stone turns a full revolution about its vertical axis
 *              every `spinDuration` seconds. The 3D model is projected at
 *              `spinSteps` keyframes; every facet's outline tweens between
 *              them, back-facing facets flatten to a line and hide, and the
 *              tones follow each facet's changing angle to the light.
 *   float      the stone bobs `floatHeight` up and back every
 *              `floatDuration` seconds, above a soft shadow (`floatShadow`)
 *              that shrinks as it rises.
 *   pulse      every `pulseHold` seconds the stone pops to `pulseScale`
 *              with a white flash (`pulseFlash`) and settles back, over
 *              `pulseDuration` seconds — the "skill unlocked" beat.
 *
 * Import:  import { diamondSvg } from "./diamond";
 * CLI:     cli.ts renders the mark to a file (pnpm run node-ts cli.ts logo.svg --param=value ...).
 */

// ------------------------------------------------------------------ options

export const GRADIENTS = ["sheen", "flat"] as const;
export type Gradient = (typeof GRADIENTS)[number];

export interface DiamondParams {
  /** Width of the girdle (the stone's widest polygon), corner to corner. The front view is a little narrower: size · cos(180° / sides). */
  size?: number;
  /** Width of the table (the flat top polygon), corner to corner. */
  tableSize?: number;
  /** Height of the crown: girdle to table. */
  crownHeight?: number;
  /** Height of the pavilion: girdle to culet (the bottom point). */
  pavilionHeight?: number;
  /** Number of sides of the girdle (and table): as many crown and pavilion facets. */
  sides?: number;
  /** Camera elevation in degrees: 0 looks straight from the side (the table is edge-on), positive looks down onto the table. */
  pitch?: number;
  /** Turn of the stone about its vertical axis, in degrees; 0 has a flat side facing the viewer. */
  yaw?: number;
  /** Transparent seam between neighboring facets. */
  gap?: number;
  /** Corner rounding radius of every facet (the SVG-path equivalent of CSS border-radius). 0 keeps sharp corners. */
  cornerRadius?: number;
  /** Margin between the artwork and the edge of the viewBox. */
  padding?: number;
  /** The stone's color as a tone ramp, lightest first (highlight … shadow); a single color gets its highlight and shadow derived. Hex colors. */
  colors?: string[];
  /** How a facet wears its tone: "sheen" (a soft gradient toward the light) or "flat" (one solid tone). */
  gradient?: Gradient;
  /** How far along the ramp facets go with their angle to the light: 0 (every facet the middle tone) to 1 (the full ramp). */
  shading?: number;
  /** Azimuth of the light in degrees: 0 = from the viewer, 90 = from the right, -90 = from the left. */
  lightAngle?: number;
  /** Elevation of the light above the horizon, in degrees. */
  lightElevation?: number;
  /** Animate the light circling the stone (on screen, always lighting its front), so the tones flow around the facets. */
  colorFlow?: boolean;
  /** Seconds per circuit of the light. */
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
  /** Keyframes per revolution: more is smoother but bigger (the outline is projected at every keyframe). */
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

/**
 * Fill in defaults. An empty `colors` array means unset, so the default
 * ramp applies — the resolved `colors` is never empty. Counts are rounded
 * to whole numbers.
 */
function resolve(params: DiamondParams): Resolved {
  const p: Resolved = { onWarn: warnToConsole, ...DEFAULTS, ...params };
  if (p.colors.length === 0) p.colors = DEFAULTS.colors;
  p.sides = Math.max(3, Math.round(p.sides));
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
  if (p.gap < 0) warn("gap must be >= 0");
  if (p.cornerRadius < 0) warn("cornerRadius must be >= 0 — treating it as 0 (sharp corners)");
  if (Math.abs(p.pitch) >= 90) warn("pitch must stay between -90 and 90");
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
  readonly kind: "table" | "crown" | "pavilion";
  /** Vertex indices, in the order the facet outline is drawn. */
  readonly indices: readonly number[];
  /** Unit outward normal. */
  readonly normal: Vec3;
}

interface Model {
  readonly vertices: readonly Vec3[];
  readonly faces: readonly Face[];
  /** Index of the culet (bottom point). */
  readonly culet: number;
  /** Center of the table. */
  readonly tableCenter: Vec3;
}

/** Outward unit normal of a planar polygon (Newell's method), oriented away from the axis. */
function outwardNormal(points: readonly Vec3[]): Vec3 {
  let n: Vec3 = [0, 0, 0];
  let c: Vec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    n = [
      n[0] + (a[1] - b[1]) * (a[2] + b[2]),
      n[1] + (a[2] - b[2]) * (a[0] + b[0]),
      n[2] + (a[0] - b[0]) * (a[1] + b[1]),
    ];
    c = [c[0] + a[0], c[1] + a[1], c[2] + a[2]];
  }
  n = normalize3(n);
  // Radial direction from the axis through the polygon's center; the table
  // sits on the axis, so its outward direction is straight up instead.
  const radial: Vec3 = Math.hypot(c[0], c[2]) < 1e-9 ? [0, 1, 0] : [c[0], 0, c[2]];
  return dot3(n, radial) < 0 ? [-n[0], -n[1], -n[2]] : n;
}

/**
 * The cut stone: table polygon, a ring of crown trapezoids down to the
 * girdle polygon, and a ring of pavilion triangles down to the culet. Facet
 * i is centered on azimuth i · 360°/sides, so facet 0 faces the viewer.
 */
function buildModel(p: Resolved): Model {
  const n = p.sides;
  const step = 360 / n;
  const vertices: Vec3[] = [];
  const ring = (r: number, y: number): void => {
    for (let j = 0; j < n; j++) {
      const a = rad((j + 0.5) * step);
      vertices.push([r * Math.sin(a), y, r * Math.cos(a)]);
    }
  };
  ring(p.tableSize / 2, p.crownHeight); // 0 .. n-1: table corners
  ring(p.size / 2, 0); //                  n .. 2n-1: girdle corners
  const culet = vertices.length;
  vertices.push([0, -p.pavilionHeight, 0]);

  const face = (kind: Face["kind"], indices: number[]): Face => ({
    kind,
    indices,
    normal: outwardNormal(indices.map((i) => vertices[i])),
  });
  const faces: Face[] = [face("table", range(n))];
  for (let i = 0; i < n; i++) {
    const prev = (i + n - 1) % n;
    faces.push(face("crown", [prev, i, n + i, n + prev]));
    faces.push(face("pavilion", [n + prev, n + i, culet]));
  }
  return { vertices, faces, culet, tableCenter: [0, p.crownHeight, 0] };
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

/** How far past the light's terminator a facet still catches light (0: plain Lambert, 1: full wrap). */
const SHADE_WRAP = 0.5;

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
 * How lit a facet is, 0 (turned away) to 1 (squarely facing the light), for
 * a stone turned by `yaw` under a light from the unit direction `light`.
 * Half-wrap lighting: facets turned up to 60° past the light still get
 * some light, so the pavilion keeps its left/right variation instead of
 * clamping to one flat dark tone.
 */
function litOf(normal: Vec3, yaw: number, light: Vec3): number {
  return clamp((dot3(yawed(normal, yaw), light) + SHADE_WRAP) / (1 + SHADE_WRAP), 0, 1);
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

/**
 * Convex polygon with every edge moved inward by `d` (outward for a
 * negative `d`); null when the polygon is too thin for that — the caller
 * falls back to `shrink`.
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
    mix(color, black, 0.38),
    mix(color, black, 0.66),
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
 * spaced keyframes; pass `splines` (one per segment) for eased motion.
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
    ` calcMode="${calcMode}"` +
    (opts.keyTimes ? ` keyTimes="${opts.keyTimes.map(frac).join(";")}"` : "") +
    (opts.splines ? ` keySplines="${opts.splines.join(";")}"` : "") +
    ` values="${values.join(";")}"/>`
  );
}

/** Keyframes per circuit of the light for `colorFlow`. */
const COLOR_FLOW_STEPS = 24;

/**
 * The evenly spaced keyframes that the stone tweens through when it spins
 * and/or the light circles it (`spin`, `colorFlow`): the turn and the
 * light's direction at every keyframe. The loop is the spin's period, and
 * the light makes as many whole circuits inside it as `colorFlowDuration`
 * allows (or, without a spin, the loop is the light's own period), so both
 * repeat seamlessly together.
 */
interface Timeline {
  readonly period: number;
  /** The base keyframes, 0 .. 1; the last repeats the first. */
  readonly keyTimes: readonly number[];
  /** Whole turns of the stone per loop; 0 when it isn't spinning. */
  readonly turns: number;
  readonly yawAt: (t: number) => number;
  readonly lightAt: (t: number) => Vec3;
}

function timelineOf(p: Resolved, active: Active): Timeline | null {
  if (!active.spin && !active.colorFlow) return null;
  const period = active.spin ? p.spinDuration : p.colorFlowDuration;
  const turns = active.spin ? 1 : 0;
  const orbits = active.colorFlow ? Math.max(1, Math.round(period / p.colorFlowDuration)) : 0;
  const count = Math.max(turns * p.spinSteps, orbits * COLOR_FLOW_STEPS);
  const light = lightVector(p.lightAngle, p.lightElevation);
  return {
    period,
    keyTimes: range(count + 1).map((i) => i / count),
    turns,
    yawAt: (t) => p.yaw + 360 * turns * t,
    lightAt: (t) => orbitLight(light, 360 * orbits * t),
  };
}

/** How many sparkle spots `glint` can pick from (a `glintCount` of n uses the first n). */
const GLINT_SPOTS = 5;
/** Without a gap, neighboring facets overlap by this hair so anti-aliasing leaves no seam between them. */
const SEAM_OVERLAP = 0.35;
/** How far along the ramp (at `shading` 1) a facet's sheen runs lighter toward the light and darker away from it. */
const SHEEN_SPREAD = 0.14;

export function diamondSvg(params: DiamondParams = {}): string {
  const p = resolve(params);
  validate(p);
  const active = activeAnimations(p);
  const fmt = numberFormatter(p.precision);
  const id = (name: string): string => `${p.idPrefix}-${name}`;
  const model = buildModel(p);
  const timeline = timelineOf(p, active);

  // ------------------------------------------------------------------ poses
  //
  // Everything is drawn around (0,0): the stone's axis is x = 0 and the
  // static pose's silhouette is centered vertically, so the scale
  // animation (`pulse`) scales about the stone's own center.
  const staticRaw = model.vertices.map((v) => project(v, p.yaw, p.pitch));
  const staticYs = staticRaw.map(([, y]) => y);
  const yShift = (Math.min(...staticYs) + Math.max(...staticYs)) / 2;
  /** Every vertex on screen, for the stone turned by `yaw`. */
  const pose = (yaw: number): Vec[] =>
    model.vertices.map((v) => {
      const [x, y] = project(v, yaw, p.pitch);
      return [x, y - yShift];
    });
  const staticLight = lightVector(p.lightAngle, p.lightElevation);
  const yawAt = timeline ? timeline.yawAt : (): number => p.yaw;
  const lightAt = timeline ? timeline.lightAt : (): Vec3 => staticLight;
  const baseTimes: readonly number[] = timeline ? timeline.keyTimes : [0];
  const turns = timeline?.turns ?? 0;
  /** The vertices at every base keyframe; frames[0] is the static pose. */
  const frames = baseTimes.map((t) => pose(yawAt(t)));

  // ------------------------------------------------------------------ color

  const ramp: Rgb[] = (() => {
    const parsed = p.colors.map((c) => parseHex(c) ?? ([128, 128, 128] as Rgb));
    return parsed.length === 1 ? deriveRamp(parsed[0]) : parsed;
  })();
  /** Ramp position (0: highlight, 1: shadow) of a facet that is `lit` much. */
  const toneOf = (lit: number): number => clamp(0.5 + p.shading * (0.5 - lit), 0, 1);
  const gradient: Gradient = GRADIENTS.includes(p.gradient) ? p.gradient : "flat";
  const sheen = gradient === "sheen";
  const spread = SHEEN_SPREAD * p.shading;
  // The sheen runs toward the light: from the facet's side nearest the
  // light (lighter) to the far side (darker), in each facet's own box.
  const sheenDir = ((): Vec => {
    const ph = rad(p.pitch);
    const v: Vec = [
      staticLight[0],
      -(staticLight[1] * Math.cos(ph) - staticLight[2] * Math.sin(ph)),
    ];
    const len = Math.hypot(...v);
    return len < 1e-6 ? [0, -1] : [v[0] / len, v[1] / len];
  })();
  const sheenFrom: Vec = [0.5 + 0.5 * sheenDir[0], 0.5 + 0.5 * sheenDir[1]];
  const sheenTo: Vec = [0.5 - 0.5 * sheenDir[0], 0.5 - 0.5 * sheenDir[1]];

  // ----------------------------------------------------------------- facets

  interface Facet {
    readonly face: Face;
    /** Position in the model's face list — the basis for ids. */
    readonly index: number;
    /** The facet's own keyframes: the base ones plus the moments it turns exactly edge-on. */
    readonly times: readonly number[];
    /** Outline at every keyframe: inset by the half gap while front-facing, its edge-on line otherwise. */
    readonly polys: readonly (readonly Vec[])[];
    /** Ramp position at every keyframe. */
    readonly tones: readonly number[];
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

  // Facets are inset by half the gap; without a gap they are let out by a
  // hair instead, so neighbors overlap and anti-aliasing leaves no seam.
  const insetBy = p.gap > 0 ? p.gap / 2 : -SEAM_OVERLAP;

  const facets: Facet[] = [];
  model.faces.forEach((face, index) => {
    const isFacing = (yaw: number): boolean => facing(face.normal, yaw, p.pitch) > 1e-9;
    const edgeOns = edgeOnYaws(face.normal, p.pitch);

    // The moments (0..1) the spinning facet turns exactly edge-on, entering
    // or leaving the view. Each becomes a keyframe of its own, where the
    // outline is a line and the visibility switches: the facet grows out of
    // that line, and thins back into it, in step with its neighbors.
    const events: { t: number; entering: boolean }[] = [];
    if (turns > 0)
      for (const e of edgeOns) {
        const phase = (((e - p.yaw) % 360) + 360) % 360; // degrees into the first turn
        const entering = isFacing(e + 0.01);
        for (let j = 0; j < turns; j++) {
          const t = (phase + 360 * j) / (360 * turns);
          events.push({ t: t > 1 - 1e-9 ? 0 : t, entering });
        }
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
        return inset(raw, insetBy) ?? shrink(raw, Math.max(0, insetBy));
      }
      // Hidden: the line it is at the nearest edge-on turn (at an edge-on
      // keyframe, that is this very turn).
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
    const visibility = events.length
      ? {
          keyTimes: [0, ...later.map((event) => event.t), 1],
          values: [initial, ...later.map((event) => event.entering), initial].map((v) =>
            v ? "visible" : "hidden",
          ),
        }
      : null;

    facets.push({
      face,
      index,
      times,
      polys,
      tones: times.map((t) => toneOf(litOf(face.normal, yawAt(t), lightAt(t)))),
      shownAtStart: facingAt[0],
      visibility,
      sweep: signedArea2(polys[facingAt.indexOf(true)]) > 0 ? 1 : 0,
      center: centroid(face.indices.map((j) => frames[0][j])),
      keyframeOpts: times.length === baseTimes.length ? {} : { keyTimes: times },
    });
  });

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

  /** Tween the outline through the facet's keyframes. */
  const shapeAnimate = (f: Facet): string =>
    timeline && active.spin
      ? animateEl(
          "animate",
          "d",
          timeline.period,
          f.polys.map((poly) => dOf(poly, f.sweep)),
          f.keyframeOpts,
        )
      : "";

  /** Hide the facet while it is at the back: switches exactly at its edge-on moments. */
  const visibilityAnimate = (f: Facet): string =>
    timeline && f.visibility
      ? animateEl("animate", "visibility", timeline.period, f.visibility.values, {
          keyTimes: f.visibility.keyTimes,
          calcMode: "discrete",
        })
      : "";

  const defs: string[] = [];

  /**
   * The facet's fill — its tone, or a sheen gradient around it — with the
   * tone's animation over the timeline when the stone turns or the light
   * circles (a sheen animates its gradient stops instead).
   */
  function fillOf(f: Facet): { fill: string; animate: string } {
    const moves = timeline !== null && f.tones.some((t) => Math.abs(t - f.tones[0]) > 1e-4);
    const tone = (t: number, offset: number): string => rampAt(ramp, t + offset);
    const animateTone = (attr: string, offset: number): string =>
      moves && timeline
        ? animateEl(
            "animate",
            attr,
            timeline.period,
            f.tones.map((t) => tone(t, offset)),
            f.keyframeOpts,
          )
        : "";
    if (!sheen) return { fill: tone(f.tones[0], 0), animate: animateTone("fill", 0) };
    const gid = id(`g${f.index}`);
    const stop = (offset: number): string => {
      const color = tone(f.tones[0], offset);
      const animate = animateTone("stop-color", offset);
      const at = offset < 0 ? 0 : 1;
      return animate
        ? `      <stop offset="${at}" stop-color="${color}">${animate}</stop>`
        : `      <stop offset="${at}" stop-color="${color}"/>`;
    };
    defs.push(
      [
        `    <linearGradient id="${gid}" x1="${frac(sheenFrom[0])}" y1="${frac(sheenFrom[1])}"` +
          ` x2="${frac(sheenTo[0])}" y2="${frac(sheenTo[1])}">`,
        stop(-spread),
        stop(spread),
        `    </linearGradient>`,
      ].join("\n"),
    );
    return { fill: `url(#${gid})`, animate: "" };
  }

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
    return animateEl(
      "animate",
      "fill-opacity",
      period,
      ["0", "0", frac(p.sweepIntensity), "0", "0"],
      { keyTimes, splines: [LINEAR, EASE, EASE, LINEAR], additive: true },
    );
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
    return animateEl("animate", "fill-opacity", p.glowDuration, ["0", frac(peak), "0"], {
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
    animateEl("animate", "fill-opacity", pulsePeriod, ["0", "0", frac(p.pulseFlash), "0", "0"], {
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

  /**
   * Whether facets need a light overlay on top of their fill — then each
   * facet's outline is defined once and <use>d by both layers.
   */
  const layered = active.sweep || active.glow || active.pulse;

  const body: string[] = [];
  for (const f of facets) {
    const { fill, animate: fillAnimate } = fillOf(f);
    const d0 = dOf(f.polys[0], f.sweep);
    const geometry = shapeAnimate(f) + visibilityAnimate(f);
    const hidden = f.shownAtStart ? "" : ` visibility="hidden"`;
    if (!layered) {
      const inner = geometry + fillAnimate;
      body.push(
        inner
          ? `  <path fill="${fill}" d="${d0}"${hidden}>${inner}</path>`
          : `  <path fill="${fill}" d="${d0}"${hidden}/>`,
      );
      continue;
    }
    // The outline, defined once (with its geometry animations) and <use>d
    // by both layers: the fill, then the overlay that lights it.
    const gid = id(`f${f.index}`);
    defs.push(
      geometry
        ? `    <path id="${gid}" d="${d0}"${hidden}>${geometry}</path>`
        : `    <path id="${gid}" d="${d0}"${hidden}/>`,
    );
    const use = (attrs: string, inner = ""): string =>
      inner ? `  <use href="#${gid}" ${attrs}>${inner}</use>` : `  <use href="#${gid}" ${attrs}/>`;
    body.push(use(`fill="${fill}"`, fillAnimate));
    const light = [
      active.sweep && p.sweepIntensity > 0 ? sweepAnimate(f) : "",
      active.glow && p.glowIntensity > 0 ? glowAnimate(f) : "",
      active.pulse && p.pulseFlash > 0 ? pulseFlashAnimate() : "",
    ].join("");
    if (light) body.push(use(`fill="#fff" fill-opacity="0"`, light));
  }

  // `glint`: sparkles at the front's extreme corners (left/right of the top
  // edge, the girdle's right and left tips) and at the culet — each popping
  // once per cycle on its own schedule, and riding its corner as the stone
  // moves.
  const glintSpots = ((): number[] => {
    const n = p.sides;
    const step = 360 / n;
    const onScreen = (j: number): number => foldDeg((j + 0.5) * step + p.yaw);
    const nearest = (ring: number, target: number): number =>
      ring +
      range(n).reduce(
        (best, j) =>
          Math.abs(foldDeg(onScreen(j) - target)) < Math.abs(foldDeg(onScreen(best) - target))
            ? j
            : best,
        0,
      );
    const edge = 90 - step / 2;
    return [
      nearest(0, -edge),
      nearest(n, edge),
      model.culet,
      nearest(0, step / 2),
      nearest(n, -edge),
    ];
  })();
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
      const positions = frames.map((verts) => verts[vertex]);
      const [x0, y0] = positions[0];
      const ride =
        timeline && active.spin
          ? animateEl(
              "animateTransform",
              "transform",
              timeline.period,
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

  let content = [...body, ...glints];
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
  for (const verts of frames) for (const v of verts) include(v);
  if (active.pulse) {
    minX *= p.pulseScale;
    maxX *= p.pulseScale;
    minY *= p.pulseScale;
    maxY *= p.pulseScale;
  }
  if (active.glint)
    for (let k = 0; k < p.glintCount; k++)
      for (const verts of frames) include(verts[glintSpots[k]], p.glintSize);

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
