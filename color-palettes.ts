/**
 * Gem palettes for the diamond mark. A gem is one color, so each palette is
 * a tone ramp of that color, lightest first — highlight, light body, body,
 * deep body, shadow — and the facets pick their tone from it by how they
 * face the light (see diamond.ts). Pass a palette's `colors` (and
 * `background`, when the palette is made for a dark backdrop), e.g.:
 *
 *   pnpm run node-ts cli.ts logo.svg --colors=#e4f0ff,#7cb4ff,#2f6de6,#1b45b4,#0f2670
 */

export interface ColorPalette {
  name: string;
  group: PaletteGroup;
  /** The tone ramp, lightest first. */
  colors: string[];
  /** Backdrop the palette is designed for; omitted = transparent. */
  background?: string;
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
  // Not gems, but a diamond cut in metal looks great as a badge.
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
    colors: ["#ffffff", "#eef5fb", "#c9dae8", "#98b2c8", "#647d96"],
  },
  {
    name: "Sapphire",
    group: "Precious",
    colors: ["#e4f0ff", "#7cb4ff", "#2f6de6", "#1b45b4", "#0f2670"],
  },
  {
    name: "Ruby",
    group: "Precious",
    colors: ["#ffe3e8", "#ff7d90", "#e02244", "#a4122f", "#5c0a1c"],
  },
  {
    name: "Emerald",
    group: "Precious",
    colors: ["#e2fff0", "#6fe9ac", "#16b56c", "#0b7c4a", "#05492c"],
  },

  // ------------------------------------------------------------ semi-precious
  {
    name: "Amethyst",
    group: "Semi-precious",
    colors: ["#f3e7ff", "#c28fff", "#8d46e6", "#6126ad", "#391466"],
  },
  {
    name: "Aquamarine",
    group: "Semi-precious",
    colors: ["#eafcff", "#8fe7f3", "#3ec0d7", "#1f8ca4", "#125767"],
  },
  {
    name: "Citrine",
    group: "Semi-precious",
    colors: ["#fff8d9", "#ffd85e", "#f2b01f", "#c37f0b", "#794b06"],
  },
  {
    name: "Topaz",
    group: "Semi-precious",
    colors: ["#fff0e1", "#ffb97c", "#f5862f", "#c15b12", "#783608"],
  },
  {
    name: "Peridot",
    group: "Semi-precious",
    colors: ["#f6ffe1", "#caf56c", "#93cf20", "#5f9411", "#37580a"],
  },
  {
    name: "Garnet",
    group: "Semi-precious",
    colors: ["#ffe5e5", "#e96c6c", "#b8202b", "#7c111c", "#44080f"],
  },
  {
    name: "Tanzanite",
    group: "Semi-precious",
    colors: ["#ebe9ff", "#a097ff", "#5b4fe7", "#3a2fb1", "#221b6f"],
  },
  {
    name: "Tourmaline",
    group: "Semi-precious",
    colors: ["#e6fff9", "#80e4c4", "#2bb68f", "#1b7e64", "#0f4e3e"],
  },
  {
    name: "Morganite",
    group: "Semi-precious",
    colors: ["#fff2ef", "#ffc0b4", "#f28f81", "#c86150", "#7e3a30"],
  },
  {
    name: "Rose quartz",
    group: "Semi-precious",
    colors: ["#fff4f8", "#ffc7dd", "#f294b9", "#c8638e", "#7e3b5a"],
  },
  {
    name: "Spinel",
    group: "Semi-precious",
    colors: ["#ffe6f0", "#ff85b5", "#e8307a", "#ab1a58", "#621034"],
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
  },
  {
    name: "Silver",
    group: "Metal",
    colors: ["#ffffff", "#e7eaef", "#b9bfc9", "#868d99", "#4f5662"],
  },
  {
    name: "Copper",
    group: "Metal",
    colors: ["#fff1e7", "#f6b58d", "#d47b4b", "#9b502b", "#5b2e18"],
  },
  {
    name: "Rose gold",
    group: "Metal",
    colors: ["#fff3f0", "#f8c4bb", "#e19587", "#b3675a", "#6f3d34"],
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
