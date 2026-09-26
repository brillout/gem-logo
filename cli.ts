/**
 * cli.ts — render the diamond mark to an SVG or PNG file from the command line.
 *
 * Run:     pnpm run node-ts cli.ts [out.svg|out.png] [--param=value ...]
 * Example: pnpm run node-ts cli.ts logo.svg --colors=#d4fbfd,#6ad9f2,#1a9fcb,#065a88,#031c36
 *          pnpm run node-ts cli.ts logo.svg --colors=#7fbbb3   (one color; highlight and shadow derived)
 *          pnpm run node-ts cli.ts logo.svg --cut=brilliant --reflections=2
 *          pnpm run node-ts cli.ts logo.svg --refractiveIndex=2.42 (a diamond's sparkle)
 *          pnpm run node-ts cli.ts logo.svg --material=metal --colors=#fff7d6,#ffd966,#e6a91d,#a9740c,#5e4006
 *          pnpm run node-ts cli.ts logo.svg --spin=true --spinDuration=10
 *          pnpm run node-ts cli.ts logo.svg --sweep=true --glint=true --float=true
 *          pnpm run node-ts cli.ts logo.svg --pitch=15 --yaw=22.5
 *          pnpm run node-ts cli.ts logo.png --pngSize=512      (raster width in px)
 *          pnpm run node-ts cli.ts logo.png --padding=large    (or a number, or none|small|medium)
 */

import { writeFileSync } from "node:fs";
import { PADDING_PRESETS, type PaddingPreset } from "./default.ts";
import { DEFAULTS, diamondSvg, type DiamondParams } from "./diamond.ts";
import { PNG_SIZE, renderPng } from "./png.ts";

function parseArgs(argv: string[]): { out: string; params: DiamondParams; pngSize: number } {
  const params: DiamondParams = {};
  let out = "diamond.svg";
  let pngSize = PNG_SIZE;

  for (const arg of argv) {
    const match = /^--([A-Za-z]+)=(.+)$/.exec(arg);
    if (!match) {
      // Only a bare word can be the output file; a malformed option (--key,
      // --key=) must not silently become a file named "--key".
      if (arg.startsWith("--")) {
        console.warn(`[diamond] ignoring ${arg} — options take a value: --key=value`);
        continue;
      }
      out = arg;
      continue;
    }
    const [, key, raw] = match;
    // The output width of a .png, in pixels — not a parameter of the mark itself.
    if (key === "pngSize") {
      if (Number.isNaN(Number(raw))) {
        console.warn(`[diamond] ignoring --pngSize: "${raw}" is not a number`);
        continue;
      }
      pngSize = Number(raw);
      continue;
    }
    // `padding` also accepts a named preset (--padding=large).
    if (key === "padding" && raw in PADDING_PRESETS) {
      params.padding = PADDING_PRESETS[raw as PaddingPreset];
      continue;
    }
    if (!(key in DEFAULTS)) {
      console.warn(
        `[diamond] ignoring unknown option --${key} (known: ${Object.keys(DEFAULTS).join(", ")}, pngSize)`,
      );
      continue;
    }
    const template = DEFAULTS[key as keyof typeof DEFAULTS];
    let value: unknown = raw;
    if (Array.isArray(template)) {
      value = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (typeof template === "number") {
      if (Number.isNaN(Number(raw))) {
        console.warn(`[diamond] ignoring --${key}: "${raw}" is not a number`);
        continue;
      }
      value = Number(raw);
    } else if (typeof template === "boolean") {
      value = raw !== "false";
    }
    Object.assign(params, { [key]: value });
  }
  return { out, params, pngSize };
}

const { out, params, pngSize } = parseArgs(process.argv.slice(2));
const svg = diamondSvg(params);
const content = out.endsWith(".png") ? renderPng(svg, pngSize) : svg;
writeFileSync(out, content);
console.log(`[diamond] wrote ${out} (${content.length} bytes)`);
