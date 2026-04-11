// ═══════════════════════════════════════════════════════════════════════════
// Purple Wave Field — Animated particle wave hero background
// Self-contained Three.js ES-module. Mount into any container div.
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ─── Tunables ───────────────────────────────────────────────────────────────
const POINT_COUNT_X   = 400;        // dots across
const POINT_COUNT_Z   = 200;        // dots deep
const SPACING         = 0.55;       // distance between dots in world units
const WAVE_SPEED      = 0.15;       // time multiplier — lower = calmer
const WAVE_AMPLITUDE  = 3.0;        // max vertical displacement
const COLOR_CORE      = '#a855f7';  // deep violet (troughs)
const COLOR_CREST     = '#c4b5fd';  // bright lavender (crests)
const BLOOM_STRENGTH  = 0.8;
const BLOOM_RADIUS    = 0.6;
const BLOOM_THRESHOLD = 0.0;
// ─────────────────────────────────────────────────────────────────────────────

// ─── GLSL: Ashima 3-D simplex noise ─────────────────────────────────────────
const SNOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// ─── Vertex Shader ──────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
${SNOISE_GLSL}

uniform float uTime;
uniform float uAmplitude;
attribute vec2 aGridCoord;
varying float vElevation;
varying float vDistance;

void main(){
  vec3 pos = position;
  float t = uTime;

  // ── Layered noise → organic flowing-silk displacement ──
  // Octave 1: broad, slow undulation (largest amplitude)
  float n1 = snoise(vec3(aGridCoord * 0.015, t * 0.4)) * uAmplitude;
  // Octave 2: medium ripple, offset & drifting at a different angle
  float n2 = snoise(vec3(aGridCoord.x * 0.04 + 97.0,
                         aGridCoord.y * 0.03 + 31.0,
                         t * 0.7)) * uAmplitude * 0.45;
  // Octave 3: fine shimmer / texture
  float n3 = snoise(vec3(aGridCoord.x * 0.09 + 210.0,
                         aGridCoord.y * 0.07 + 140.0,
                         t * 1.1)) * uAmplitude * 0.2;

  // ── Breathing sine ripple — whole sheet rises and falls ──
  float sine = sin(aGridCoord.x * 0.025 + t * 0.55)
             * cos(aGridCoord.y * 0.018 + t * 0.35)
             * uAmplitude * 0.65;

  float elevation = n1 + n2 + n3 + sine;
  pos.y += elevation;

  vElevation = elevation;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // ── Point size: perspective-scaled + per-vertex sparkle hash ──
  float hash = fract(sin(dot(aGridCoord, vec2(12.9898, 78.233))) * 43758.5453);
  float baseSize = 2.8;
  gl_PointSize = baseSize * (1.0 + hash * 0.35) * (220.0 / vDistance);
  gl_PointSize = clamp(gl_PointSize, 0.5, 14.0);

  gl_Position = projectionMatrix * mvPosition;
}
`;

// ─── Fragment Shader ────────────────────────────────────────────────────────
const fragmentShader = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorCrest;
uniform float uAmplitude;
varying float vElevation;
varying float vDistance;

void main(){
  // ── Soft circular dot ──
  float d = length(gl_PointCoord - 0.5);
  float alpha = 1.0 - smoothstep(0.32, 0.5, d);

  // ── Color: violet (troughs) → lavender (crests) ──
  float elevNorm = smoothstep(-uAmplitude * 1.2, uAmplitude * 1.4, vElevation);
  vec3 color = mix(uColorCore, uColorCrest, elevNorm);

  // Brightness: crests glow brightly, troughs nearly vanish
  float brightness = smoothstep(-uAmplitude * 1.8, uAmplitude * 0.6, vElevation);
  brightness = max(brightness, 0.06);
  color *= brightness;

  // ── Distance fade — far dots dissolve to black ──
  float distFade = 1.0 - smoothstep(35.0, 240.0, vDistance);
  alpha *= distFade;
  // Near fade — avoid harsh pop at camera
  alpha *= smoothstep(3.0, 14.0, vDistance);

  gl_FragColor = vec4(color, alpha);
}
`;

// ─── Main entry ─────────────────────────────────────────────────────────────
export default function createPurpleWaveField(container) {
  if (!container) throw new Error('createPurpleWaveField: container element required');

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);

  // ── Scene & Camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
  // Low vantage, looking across the surface toward the horizon
  const camBase = new THREE.Vector3(0, 18, -25);
  camera.position.copy(camBase);
  camera.lookAt(0, 0, 55);

  // ── Build the point grid ─────────────────────────────────────────────────
  const count = POINT_COUNT_X * POINT_COUNT_Z;
  const positions  = new Float32Array(count * 3);
  const gridCoords = new Float32Array(count * 2);

  const halfX = (POINT_COUNT_X - 1) * SPACING * 0.5;
  const halfZ = (POINT_COUNT_Z - 1) * SPACING * 0.5;

  let idx3 = 0, idx2 = 0;
  for (let iz = 0; iz < POINT_COUNT_Z; iz++) {
    for (let ix = 0; ix < POINT_COUNT_X; ix++) {
      const x = ix * SPACING - halfX;
      const z = iz * SPACING - halfZ + 30; // offset so field stretches ahead
      positions[idx3]     = x;
      positions[idx3 + 1] = 0;
      positions[idx3 + 2] = z;
      gridCoords[idx2]     = x;
      gridCoords[idx2 + 1] = z;
      idx3 += 3;
      idx2 += 2;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',   new THREE.BufferAttribute(positions,  3));
  geometry.setAttribute('aGridCoord', new THREE.BufferAttribute(gridCoords, 2));

  // ── Shader material ──────────────────────────────────────────────────────
  const coreColor  = new THREE.Color(COLOR_CORE);
  const crestColor = new THREE.Color(COLOR_CREST);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime:       { value: 0 },
      uAmplitude:  { value: WAVE_AMPLITUDE },
      uColorCore:  { value: new THREE.Vector3(coreColor.r,  coreColor.g,  coreColor.b) },
      uColorCrest: { value: new THREE.Vector3(crestColor.r, crestColor.g, crestColor.b) },
    },
    transparent:  true,
    blending:     THREE.AdditiveBlending,
    depthWrite:   false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // ── Post-processing: bloom ────────────────────────────────────────────────
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD
  );
  composer.addPass(bloom);

  // ── Resize handling ───────────────────────────────────────────────────────
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
  }
  window.addEventListener('resize', onResize);
  onResize();

  // ── Reduced-motion preference ─────────────────────────────────────────────
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  motionQuery.addEventListener('change', (e) => { reducedMotion = e.matches; });

  // ── Visibility: pause when hidden / off-screen ────────────────────────────
  let visible = true;
  let onScreen = true;

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  const observer = new IntersectionObserver(
    ([entry]) => { onScreen = entry.isIntersecting; },
    { threshold: 0 }
  );
  observer.observe(container);

  // ── Animation loop ────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let animId = null;
  let elapsed = 0;

  function animate() {
    animId = requestAnimationFrame(animate);

    if (!visible || !onScreen) return;

    const delta = clock.getDelta();
    // Freeze or drastically slow time when reduced-motion is preferred
    const speed = reducedMotion ? WAVE_SPEED * 0.05 : WAVE_SPEED;
    elapsed += delta * speed;
    material.uniforms.uTime.value = elapsed;

    // Subtle camera drift (lissajous)
    if (!reducedMotion) {
      camera.position.x = camBase.x + Math.sin(elapsed * 0.6)  * 0.8;
      camera.position.y = camBase.y + Math.cos(elapsed * 0.45) * 0.4;
      camera.lookAt(0, 0, 55);
    }

    composer.render();
  }

  animate();

  // ── Cleanup function ──────────────────────────────────────────────────────
  return function dispose() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', onResize);
    observer.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    composer.dispose();
    container.removeChild(renderer.domElement);
  };
}
