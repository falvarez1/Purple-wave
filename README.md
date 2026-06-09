# Purple Wave Field

Animated purple particle wave field — a full-viewport hero background built with Three.js and custom GLSL shaders.

**[View Live Demo](https://falvarez1.github.io/Purple-wave/)**

## How it works

80,000 dots arranged in a perspective grid are displaced on the GPU by layered simplex noise, producing a flowing-silk wave effect against pure black. UnrealBloom post-processing adds the glowing halo.

## Interactions

- **Drag / hover** — the cursor acts as a magnet, pulling dots out of their grid with spring-like physics. Faster movement pulls harder.
- **Click / tap** — spawns an expanding shockwave ripple across the field (up to 5 at once).
- **H key** — toggles the effects panel.

## Effects panel

Open with the gear button (top right) or the **H** key. Settings persist in `localStorage`.

| Effect | Controls |
|---|---|
| Bloom Glow | strength |
| Depth of Field | focus distance, blur (bokeh-style CoC, computed per vertex) |
| Wave Motion | speed, amplitude |
| Mouse Magnet | radius, pull |
| Click Ripples | strength |
| Sparkle | amount (per-dot twinkle) |
| Aurora Colors | amount (spatial hue drift across the field) |
| Color Pulse | speed (global hue cycling) |
| Vignette | strength |
| Camera Drift | on/off |
| Auto Quality | on/off (adaptive render scale targeting 60 fps, live fps readout) |
| Exposure | global brightness |
| Core / Crest colors | color pickers |

Plus **8 presets** (Silk Flow, Calm Ocean, Electric Storm, Deep Space, Aurora Borealis, Neon Grid, Zen Garden, Supernova), a **Randomize** button, and **Reset**.

## Usage

```js
import createPurpleWaveField from './purple-wave.js';

const { state, dispose } = createPurpleWaveField(document.getElementById('container'));

// Mutate state at runtime — the render loop picks changes up each frame:
state.waveAmplitude = 5;
state.colorCore = '#22d3ee';
state.aurora = true;

// Tear down:
dispose();
```

`state` keys: `bloom`, `bloomStrength`, `dof`, `focusDistance`, `dofStrength`, `waves`, `waveSpeed`, `waveAmplitude`, `mouse`, `mouseRadius`, `mousePullMax`, `ripples`, `rippleStrength`, `sparkle`, `sparkleStrength`, `aurora`, `auroraStrength`, `cameraDrift`, `colorPulse`, `colorPulseSpeed`, `vignette`, `vignetteStrength`, `exposure`, `autoQuality`, `colorCore`, `colorCrest`. Read-only diagnostics: `_fps`, `_dpr`.

## Performance

- All animation runs in the vertex shader — zero per-frame CPU vertex work.
- Adaptive resolution: render scale steps down (to 0.75x) when fps drops below 45 and back up when above 58.
- Animation pauses when the tab is hidden or the element scrolls off-screen.
- Respects `prefers-reduced-motion`.
