# Purple Wave Field

Animated purple particle wave field — a full-viewport hero background built with Three.js and custom GLSL shaders.

**[View Live Demo](https://falvarez1.github.io/Purple-wave/)**

## How it works

80,000 dots arranged in a perspective grid are displaced on the GPU by layered simplex noise, producing a flowing-silk wave effect against pure black. UnrealBloom post-processing adds the glowing halo.

## Usage

```js
import createPurpleWaveField from './purple-wave.js';

const dispose = createPurpleWaveField(document.getElementById('container'));
// call dispose() to tear down
```

## Tunables

Edit the constants at the top of `purple-wave.js`:

| Constant | Default | Description |
|---|---|---|
| `POINT_COUNT_X` | 400 | Dots across |
| `POINT_COUNT_Z` | 200 | Dots deep |
| `WAVE_SPEED` | 0.15 | Animation speed multiplier |
| `WAVE_AMPLITUDE` | 3.0 | Max vertical displacement |
| `COLOR_CORE` | `#a855f7` | Trough color (deep violet) |
| `COLOR_CREST` | `#c4b5fd` | Crest color (bright lavender) |
| `BLOOM_STRENGTH` | 0.8 | Bloom intensity |
