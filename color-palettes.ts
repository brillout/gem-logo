/**
 * Gem palettes for the diamond mark. A gem is one color, so each palette is
 * a tone ramp of that color, lightest first — highlight, light body, body,
 * deep body, shadow — and every patch of the stone picks its tone from it by
 * the light it returns (see diamond.ts). The ramps follow real stones under
 * studio light: vivid bodies, highlights paling toward white, and shadows
 * sinking to a near-black of the same hue. Pass a palette's `colors` (and
 * `background`, when the palette is made for a dark backdrop, or `material`,
 * for metal), e.g.:
 *
 *   pnpm run node-ts cli.ts logo.svg --colors=#dfeaff,#6fa3fb,#2458d8,#132f96,#070f45
 */

import type { Material } from "./diamond.ts";

export interface ColorPalette {
  name: string;
  group: PaletteGroup;
  /** The tone ramp, lightest first. */
  colors: string[];
  /** Backdrop the palette is designed for; omitted = transparent. */
  background?: string;
  /** What the stone is made of; omitted = "gem". */
  material?: Material;
}

export type PaletteGroup = (typeof PALETTE_GROUPS)[number];

export const PALETTE_GROUPS = [
  // The big four.
  "Precious",
  // The rest of the jeweler's tray.
  "Semi-precious",
  // Pale, milky and icy stones.
  "Pale",
  // Black and smoky stones.
  "Dark",
  // Not gems, but a diamond cut in metal looks great as a badge (opaque:
  // every facet mirrors the studio).
  "Metal",
  // Soft candy tones.
  "Pastel",
  // Saturated glow tones, made for a dark backdrop.
  "Neon",
] as const;

const DARK_BACKDROP = "#0e1116";

export const COLOR_PALETTES: ColorPalette[] = [
  // ----------------------------------------------------------------- precious
  {
    name: "Diamond",
    group: "Precious",
    colors: ["#ffffff", "#eef3f8", "#c3d0dc", "#7d8c9c", "#2c3440"],
  },
  {
    name: "Sapphire",
    group: "Precious",
    colors: ["#dfeaff", "#6fa3fb", "#2458d8", "#132f96", "#070f45"],
  },
  {
    name: "Ruby",
    group: "Precious",
    colors: ["#ffd9e0", "#ff6680", "#dc1a3c", "#8e0c26", "#35040e"],
  },
  {
    name: "Emerald",
    group: "Precious",
    colors: ["#d8fbe8", "#5ee0a0", "#10a862", "#08663b", "#022716"],
  },

  // ------------------------------------------------------------ semi-precious
  {
    name: "Amethyst",
    group: "Semi-precious",
    colors: ["#f1e2ff", "#bd84ff", "#8a3fe0", "#521c9e", "#1f0848"],
  },
  {
    name: "Aquamarine",
    group: "Semi-precious",
    colors: ["#e6fbff", "#8ee5f3", "#3dbcd6", "#1a7f97", "#083745"],
  },
  {
    name: "Citrine",
    group: "Semi-precious",
    colors: ["#fff7c0", "#f5d15e", "#d99a17", "#8f540b", "#3d1d07"],
  },
  {
    name: "Topaz",
    group: "Semi-precious",
    colors: ["#ffeede", "#ffba80", "#f08a3e", "#b2531c", "#4e2008"],
  },
  {
    name: "Peridot",
    group: "Semi-precious",
    colors: ["#f3ffd8", "#c5f062", "#8cc419", "#557f0c", "#223a04"],
  },
  {
    name: "Garnet",
    group: "Semi-precious",
    colors: ["#ffd9d9", "#e45a5f", "#b01c28", "#6a0b15", "#270307"],
  },
  {
    name: "Tanzanite",
    group: "Semi-precious",
    colors: ["#e3e2fd", "#a4aef7", "#6e68dd", "#3b30a0", "#0f0a5c"],
  },
  {
    name: "Zircon",
    group: "Semi-precious",
    colors: ["#d4fbfd", "#6ad9f2", "#1a9fcb", "#065a88", "#031c36"],
  },
  {
    name: "Tourmaline",
    group: "Semi-precious",
    colors: ["#d6fbef", "#67dcb0", "#189e78", "#0b5a44", "#032219"],
  },
  {
    name: "Rubellite",
    group: "Semi-precious",
    colors: ["#f9b3d2", "#e8508c", "#b8165a", "#6c0630", "#25020f"],
  },
  {
    name: "Mandarin garnet",
    group: "Semi-precious",
    colors: ["#ffe2a8", "#ffab45", "#ea6e18", "#983610", "#3c1106"],
  },
  {
    name: "Morganite",
    group: "Semi-precious",
    colors: ["#fff4f1", "#f9cfcb", "#e2a3a2", "#b0716f", "#6e3c3d"],
  },
  {
    name: "Rose quartz",
    group: "Semi-precious",
    colors: ["#fff2f7", "#ffc3da", "#f08db4", "#c05886", "#63294a"],
  },
  {
    name: "Spinel",
    group: "Semi-precious",
    colors: ["#ffd9ea", "#ff6fa8", "#e22674", "#9c1250", "#3e061f"],
  },

  // --------------------------------------------------------------------- pale
  {
    name: "Moonstone",
    group: "Pale",
    colors: ["#ffffff", "#eaf0ff", "#c4d0f5", "#95a5d7", "#60709f"],
  },
  {
    name: "Ice",
    group: "Pale",
    colors: ["#ffffff", "#e6f7ff", "#b4e4ff", "#75c3f1", "#3f90c1"],
  },
  {
    name: "Opal",
    group: "Pale",
    colors: ["#ffffff", "#f3f0ff", "#d9d2f4", "#b4aad8", "#8479ad"],
  },
  {
    name: "Pearl",
    group: "Pale",
    colors: ["#ffffff", "#fbf6ee", "#ecdfcc", "#cdb99d", "#9c8768"],
  },
  {
    name: "Jade",
    group: "Pale",
    colors: ["#f2fff7", "#c2f0d3", "#8fd4a8", "#5da97c", "#356d4d"],
  },

  // --------------------------------------------------------------------- dark
  {
    name: "Onyx",
    group: "Dark",
    colors: ["#b9b9b9", "#606060", "#303030", "#181818", "#060606"],
  },
  {
    name: "Obsidian",
    group: "Dark",
    colors: ["#a3aeb2", "#4c585c", "#252c2f", "#131719", "#060809"],
  },
  {
    name: "Smoky quartz",
    group: "Dark",
    colors: ["#f2ece5", "#c4ad95", "#8e7053", "#5d4734", "#34271c"],
  },
  {
    name: "Hematite",
    group: "Dark",
    colors: ["#d9dde3", "#8f97a3", "#5a6270", "#353b46", "#161a21"],
    material: "metal",
  },
  {
    name: "Black opal",
    group: "Dark",
    colors: ["#b8c8d8", "#4a6a8a", "#243a58", "#142238", "#080e18"],
  },

  // -------------------------------------------------------------------- metal
  {
    name: "Gold",
    group: "Metal",
    colors: ["#fff7d6", "#ffd966", "#e6a91d", "#a9740c", "#5e4006"],
    material: "metal",
  },
  {
    name: "Silver",
    group: "Metal",
    colors: ["#ffffff", "#e7eaef", "#b9bfc9", "#868d99", "#4f5662"],
    material: "metal",
  },
  {
    name: "Copper",
    group: "Metal",
    colors: ["#fff1e7", "#f6b58d", "#d47b4b", "#9b502b", "#5b2e18"],
    material: "metal",
  },
  {
    name: "Rose gold",
    group: "Metal",
    colors: ["#fff3f0", "#f8c4bb", "#e19587", "#b3675a", "#6f3d34"],
    material: "metal",
  },

  // ------------------------------------------------------------------- pastel
  {
    name: "Candy",
    group: "Pastel",
    colors: ["#ffebf7", "#ff9bd7", "#f650b1", "#c02586", "#701551"],
  },
  {
    name: "Mint",
    group: "Pastel",
    colors: ["#f0fff9", "#a7f6d4", "#50daa4", "#28a176", "#155d45"],
  },
  {
    name: "Lavender",
    group: "Pastel",
    colors: ["#f8f3ff", "#dac7ff", "#b495f6", "#8566ca", "#503c81"],
  },
  {
    name: "Coral",
    group: "Pastel",
    colors: ["#fff1ed", "#ffb4a4", "#ff7b5d", "#d4472b", "#7e2817"],
  },
  {
    name: "Sky",
    group: "Pastel",
    colors: ["#f2faff", "#bfe4ff", "#7fc4f5", "#4b93c8", "#2b5f88"],
  },
  {
    name: "Butter",
    group: "Pastel",
    colors: ["#fffbe6", "#fff0a8", "#f7dc63", "#cfae2f", "#8a7118"],
  },

  // --------------------------------------------------------------------- neon
  {
    name: "Neon cyan",
    group: "Neon",
    colors: ["#eaffff", "#7ffdff", "#19d6e9", "#0b90a1", "#065561"],
    background: DARK_BACKDROP,
  },
  {
    name: "Neon magenta",
    group: "Neon",
    colors: ["#ffe9fb", "#ff8ae6", "#f22bc6", "#b3168f", "#650b52"],
    background: DARK_BACKDROP,
  },
  {
    name: "Neon lime",
    group: "Neon",
    colors: ["#f7ffe4", "#d0ff6b", "#a1f218", "#6fb30a", "#3f6605"],
    background: DARK_BACKDROP,
  },
  {
    name: "Neon violet",
    group: "Neon",
    colors: ["#f1e8ff", "#c497ff", "#9642ff", "#6a22c4", "#3d1273"],
    background: DARK_BACKDROP,
  },
  {
    name: "Neon orange",
    group: "Neon",
    colors: ["#fff2e3", "#ffb266", "#ff7a0f", "#c25605", "#6e3103"],
    background: DARK_BACKDROP,
  },
];
