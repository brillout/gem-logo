/**
 * build.ts — render the committed brand assets: diamond.svg, the PNG
 * variants shown in README.md (default size, one per padding preset), and
 * one animated SVG per animation (animations/<name>.svg).
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

write("diamond.svg", diamondSvg());

for (const [preset, padding] of Object.entries(PADDING_PRESETS))
  write(`diamond-padding-${preset}.png`, renderPng(diamondSvg({ padding })));

mkdirSync("animations", { recursive: true });
for (const animation of ANIMATIONS)
  write(`animations/${animation}.svg`, diamondSvg({ [animation]: true }));
