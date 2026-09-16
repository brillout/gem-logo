/**
 * default.ts — the default parameters of the diamond mark, i.e. the branding
 * actually in use. Tweak values in the playground (pnpm run dev), then record
 * the result here.
 */

import { COLOR_PALETTES } from "./color-palettes.ts";
import type { DiamondParams } from "./diamond.ts";

const DEFAULT_PALETTE = COLOR_PALETTES.find((p) => p.name === "Sapphire");
if (!DEFAULT_PALETTE)
  throw new Error('default palette "Sapphire" is missing from color-palettes.ts');

const padding = 40;

/**
 * Padding presets for exported assets (e.g. the PNG variants in README.md),
 * in the same units as `size`; `medium` is the mark's own default.
 */
export const PADDING_PRESETS = {
  none: 0,
  small: 24,
  medium: padding,
  large: 120,
} as const;
export type PaddingPreset = keyof typeof PADDING_PRESETS;

/** Defaults: a sapphire with a soft sheen on every facet, every animation off. */
export const DEFAULTS: Required<Omit<DiamondParams, "onWarn">> = {
  size: 480,
  tableSize: 260,
  crownHeight: 110,
  pavilionHeight: 300,
  sides: 8,
  pitch: 0,
  yaw: 0,
  gap: 0,
  cornerRadius: 0,
  padding,
  colors: DEFAULT_PALETTE.colors,
  gradient: "sheen",
  shading: 0.85,
  lightAngle: -50,
  lightElevation: 40,
  colorFlow: false,
  colorFlowDuration: 6,
  sweep: false,
  sweepDuration: 1.4,
  sweepHold: 3,
  sweepAngle: 20,
  sweepWidth: 0.35,
  sweepIntensity: 0.55,
  glint: false,
  glintDuration: 4,
  glintCount: 3,
  glintSize: 28,
  glintColor: "#ffffff",
  glow: false,
  glowDuration: 4,
  glowRadius: 260,
  glowIntensity: 0.45,
  spin: false,
  spinDuration: 8,
  spinSteps: 24,
  float: false,
  floatDuration: 3,
  floatHeight: 18,
  floatShadow: true,
  pulse: false,
  pulseHold: 3,
  pulseDuration: 0.6,
  pulseScale: 1.12,
  pulseFlash: 0.5,
  background: null,
  idPrefix: "gem",
  precision: 1,
};
