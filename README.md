# The Gem Logo

An SVG diamond: the orthographic projection of a real 3D model of a cut stone, lit the way light actually travels through a gem, with seven animations that need no JavaScript. The mark spins and floats by default.

## SVG

<p align="center">
  <img src="./diamond.svg" alt="Diamond icon" width="220" />
</p>

## Playground

Playground: https://brillout.github.io/gem-logo

## Light & color

The stone sits in a photo studio — a dark room, a key softbox (`lightAngle`, `lightElevation`) and three dimmer ones — and every facet shows what a real gem would. Its polished surface mirrors the softboxes, and through it you see the light that comes out of the stone: bent on its way in (`refractiveIndex`), reflected inside, and split by those reflections into a mosaic of flat patches, the kaleidoscope of a real stone (`reflections` levels deep; `0` gives every facet one tone). The camera itself hides part of the studio, which gives the stone its dark patches.

A gem is one color, so a palette is a tone ramp of that color — highlight, body, shadow — and every patch takes its tone from the light it returns. [`color-palettes.ts`](./color-palettes.ts) has ready-made stones (Spinel, Ruby, Sapphire, Emerald, Zircon, Rubellite, Tanzanite, Citrine, Onyx, …); pick any of them in the playground, or pass a single color and the highlight and shadow are derived. The metal palettes (Gold, Silver, …) set `material` to `metal`: an opaque stone, every facet shaded by how squarely it faces the key light.

## Cut

`cut: "simple"` (default) is the classic icon: the table, a ring of trapezoid crown facets and triangular pavilion facets. `cut: "brilliant"` is the jeweler's cut: the table ringed by star facets, kite facets down to the girdle with upper-girdle facets between them, and pavilion mains meeting at the culet with lower-girdle facets between them. Both take the same proportions (`size`, `tableSize`, `crownHeight`, `pavilionHeight`, `sides`).

## Animations

Every animation is an independent toggle with its own timing parameters, rendered as native SVG animation (SMIL) — so the files play inside `<img>` tags and READMEs like this one, and combine freely (the mark above combines `spin` and `float`). At t&nbsp;=&nbsp;0 each animation rests in the static pose, so tools that don't animate (PNG export, favicons) show exactly the un-animated mark. Each file below shows one animation alone.

|                             `colorFlow`                             |                           `sweep`                           |                           `glint`                           |                          `glow`                           |
| :-----------------------------------------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------------: | :-------------------------------------------------------: |
| <img src="./animations/colorFlow.svg" alt="colorFlow" width="200"/> | <img src="./animations/sweep.svg" alt="sweep" width="200"/> | <img src="./animations/glint.svg" alt="glint" width="200"/> | <img src="./animations/glow.svg" alt="glow" width="200"/> |
|  The studio circles the stone; the light flows across the facets.   |           A band of light passes over the facets.           |            Sparkles pop at the stone's corners.             |          A soft highlight breathes on the table.          |

|                          `spin`                           |                           `float`                           |                           `pulse`                           |
| :-------------------------------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------------: |
| <img src="./animations/spin.svg" alt="spin" width="200"/> | <img src="./animations/float.svg" alt="float" width="200"/> | <img src="./animations/pulse.svg" alt="pulse" width="200"/> |
| The stone revolves about its axis, sparkling as it turns. |              The stone bobs above its shadow.               |           The "skill unlocked" pop, with a flash.           |

| Animation   | Parameters                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| `colorFlow` | `colorFlowDuration`                                                        |
| `sweep`     | `sweepDuration`, `sweepHold`, `sweepAngle`, `sweepWidth`, `sweepIntensity` |
| `glint`     | `glintDuration`, `glintCount`, `glintSize`, `glintColor`                   |
| `glow`      | `glowDuration`, `glowRadius`, `glowIntensity`                              |
| `spin`      | `spinDuration`, `spinSteps`                                                |
| `float`     | `floatDuration`, `floatHeight`, `floatShadow`                              |
| `pulse`     | `pulseHold`, `pulseDuration`, `pulseScale`, `pulseFlash`                   |

Each parameter is documented in [`diamond.ts`](./diamond.ts).

## PNG

All `1024px` but with different paddings (the stone at rest, without any animation):

|                        `none`                        |                        `small`                        |                        `medium`                        |                        `large`                        |
| :--------------------------------------------------: | :---------------------------------------------------: | :----------------------------------------------------: | :---------------------------------------------------: |
| <img src="./diamond-padding-none.png" width="150" /> | <img src="./diamond-padding-small.png" width="150" /> | <img src="./diamond-padding-medium.png" width="150" /> | <img src="./diamond-padding-large.png" width="150" /> |

For custom size & padding, go to the [playground](https://brillout.github.io/gem-logo).

## CLI

```bash
pnpm install
pnpm run node-ts cli.ts logo.svg --spin=true --sweep=true                    # any parameter as --name=value
pnpm run node-ts cli.ts logo.svg --colors=#dfeaff,#6fa3fb,#2458d8,#132f96,#070f45   # a tone ramp (this one is Sapphire)
pnpm run node-ts cli.ts logo.svg --colors=#16b56c                            # one color; highlight and shadow derived
pnpm run node-ts cli.ts logo.svg --cut=brilliant --reflections=2             # the jeweler's cut, a deeper kaleidoscope
pnpm run node-ts cli.ts logo.svg --refractiveIndex=2.42                      # a diamond's sparkle
pnpm run node-ts cli.ts logo.svg --pitch=15 --yaw=22.5                       # look down onto the table, turned
pnpm run node-ts cli.ts logo.png --pngSize=512 --padding=large
```

## Development

```bash
pnpm run dev     # playground at http://localhost:3000
pnpm run build   # regenerate diamond.svg, the PNGs and animations/*.svg
```
