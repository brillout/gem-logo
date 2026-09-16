/**
 * build.ts — render the committed brand assets: diamond.svg (the mark
 * exactly as configured in default.ts, animations included), the PNG
 * variants shown in README.md (default size, one per padding preset, the
 * stone alone without any animation's extras such as the float shadow),
 * and one SVG per animation showing that animation alone
 * (animations/<name>.svg).
 * Run with: pnpm run build
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { PADDING_PRESETS } from "./default.ts";
import { ANIMATIONS, diamondSvg } from "./diamond.ts";
import { renderPng } from "./png.ts";

const write = (out: string, content: string | Buffer): void => {
  writeFileSync(out, content);
  console.log(`[diamond] wrote ${out} (${content.length} bytes)`);
};

/** Every animation switched off, whatever default.ts turns on. */
const still = Object.fromEntries(ANIMATIONS.map((animation) => [animation, false]));

write("diamond.svg", diamondSvg());

for (const [preset, padding] of Object.entries(PADDING_PRESETS))
  write(`diamond-padding-${preset}.png`, renderPng(diamondSvg({ ...still, padding })));

mkdirSync("animations", { recursive: true });
for (const animation of ANIMATIONS)
  write(`animations/${animation}.svg`, diamondSvg({ ...still, [animation]: true }));
