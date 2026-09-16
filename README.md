# The gem-skills Logo

An SVG diamond: the orthographic projection of a real 3D model of a cut stone, with nine optional animations that need no JavaScript.

## SVG

<p align="center">
  <img src="./diamond.svg" alt="Diamond icon" width="220" />
</p>

## Playground

Playground: https://brillout.github.io/gem-skills-logo

## Animations

Every animation is an independent toggle with its own timing parameters, rendered as native SVG animation (SMIL) — so the files play inside `<img>` tags and READMEs like this one, and combine freely. At t&nbsp;=&nbsp;0 each animation rests in the static pose, so tools that don't animate (PNG export, favicons) show exactly the un-animated mark.

|                             `colorFlow`                             |                           `sweep`                           |                           `glint`                           |
| :-----------------------------------------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------------: |
| <img src="./animations/colorFlow.svg" alt="colorFlow" width="200"/> | <img src="./animations/sweep.svg" alt="sweep" width="200"/> | <img src="./animations/glint.svg" alt="glint" width="200"/> |
|                The palette drifts across the facets.                |           A band of light passes over the facets.           |            Sparkles pop at the stone's corners.             |

|                          `glow`                           |                          `spin`                           |                           `float`                           |
| :-------------------------------------------------------: | :-------------------------------------------------------: | :---------------------------------------------------------: |
| <img src="./animations/glow.svg" alt="glow" width="200"/> | <img src="./animations/spin.svg" alt="spin" width="200"/> | <img src="./animations/float.svg" alt="float" width="200"/> |
|          A soft highlight breathes on the table.          |     The stone turns about its axis, with real depth.      |              The stone bobs above its shadow.               |

|                          `flip`                           |                           `forge`                           |                           `pulse`                           |
| :-------------------------------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------------: |
| <img src="./animations/flip.svg" alt="flip" width="200"/> | <img src="./animations/forge.svg" alt="forge" width="200"/> | <img src="./animations/pulse.svg" alt="pulse" width="200"/> |
|         The stone turns over to its mirror image.         | The cut stone dissolves into a rough one and is cut again.  |           The "skill unlocked" pop, with a flash.           |

| Animation   | Parameters                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| `colorFlow` | `colorFlowDuration`                                                        |
| `sweep`     | `sweepDuration`, `sweepHold`, `sweepAngle`, `sweepWidth`, `sweepIntensity` |
| `glint`     | `glintDuration`, `glintCount`, `glintSize`, `glintColor`                   |
| `glow`      | `glowDuration`, `glowRadius`, `glowIntensity`                              |
| `spin`      | `spinDuration`, `spinSteps`                                                |
| `float`     | `floatDuration`, `floatHeight`, `floatShadow`                              |
| `flip`      | `flipDuration`, `flipHold`                                                 |
| `forge`     | `forgeHold`, `forgeMorph`, `forgeRough`, `forgeRoughness`, `forgeDull`     |
| `pulse`     | `pulseHold`, `pulseDuration`, `pulseScale`, `pulseFlash`                   |

Each parameter is documented in [`diamond.ts`](./diamond.ts).

## PNG

All `1024px` but with different paddings (PNGs show the static pose):

|                        `none`                        |                        `small`                        |                        `medium`                        |                        `large`                        |
| :--------------------------------------------------: | :---------------------------------------------------: | :----------------------------------------------------: | :---------------------------------------------------: |
| <img src="./diamond-padding-none.png" width="150" /> | <img src="./diamond-padding-small.png" width="150" /> | <img src="./diamond-padding-medium.png" width="150" /> | <img src="./diamond-padding-large.png" width="150" /> |

For custom size & padding, go to the [playground](https://brillout.github.io/gem-skills-logo).

## CLI

```bash
pnpm install
pnpm run node-ts cli.ts logo.svg --spin=true --sweep=true   # any parameter as --name=value
pnpm run node-ts cli.ts logo.svg --colors=#7fbbb3            # monochrome stone
pnpm run node-ts cli.ts logo.svg --pitch=15 --yaw=22.5       # look down onto the table, turned
pnpm run node-ts cli.ts logo.png --pngSize=512 --padding=large
```

## Development

```bash
pnpm run dev     # playground at http://localhost:3000
pnpm run build   # regenerate diamond.svg, the PNGs and animations/*.svg
```
