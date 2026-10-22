// three.js setup + tiny mesh helpers shared by all render code.
import * as THREE from 'three';

export { THREE };

// Globe look (prototype, Colin Oct 22): every vertex drops by d^2 / 2R with its ground distance d from the camera's focus,
// so the flat board reads as a little planet. Render only -- the sim stays flat. Built into three's own vertex chunk, so
// shadows bend the same way (the bend centre is a shared uniform, NOT the camera, which is the sun during the shadow pass).
// GLOBE.u = (centre x, centre z, 1/2R); z = 0 is off and costs nothing but a multiply.
export const GLOBE = { u: { x: 0, y: 0, z: 0 }, R: 110 };
THREE.ShaderChunk.common = '#define CW_GLOBE\nuniform vec3 cwGlobe;\n' + THREE.ShaderChunk.common; // guarded: PMREM's own shaders use project_vertex without common
THREE.ShaderChunk.project_vertex = THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',
  '#ifdef CW_GLOBE\nvec4 cwW = modelMatrix * mvPosition; vec2 cwD = cwW.xz - cwGlobe.xy; cwW.y -= dot( cwD, cwD ) * cwGlobe.z; mvPosition = viewMatrix * cwW;\n#else\nmvPosition = modelViewMatrix * mvPosition;\n#endif');
// A plain object (not a Vector3) is shared by reference when three clones these uniforms into each program.
for (const k in THREE.ShaderLib) THREE.ShaderLib[k].uniforms.cwGlobe = { value: GLOBE.u };
export function setGlobe(on) { GLOBE.u.z = on ? 1 / (2 * GLOBE.R) : 0; }
// A big flat plane only bends at its vertices: split large planes/boxes into ~4 m tiles so the ground curves with the rest.
export function tessellate(root, step = 4) {
  const _s = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.geometry.parameters) return;
    const g = o.geometry, p = g.parameters; o.getWorldScale(_s);
    const n = (len) => Math.min(120, Math.max(1, Math.ceil(len / step)));
    if (g.type === 'PlaneGeometry') {
      const a = n(p.width * _s.x), b = n(p.height * _s.y);
      if (a * b > 1) { o.geometry = new THREE.PlaneGeometry(p.width, p.height, a, b); g.dispose(); }
    } else if (g.type === 'BoxGeometry') {
      const a = n(p.width * _s.x), c = n(p.depth * _s.z);
      if (a * c > 1) { o.geometry = new THREE.BoxGeometry(p.width, p.height, p.depth, a, 1, c); g.dispose(); }
    }
  });
}
export const canvas = document.getElementById('c');
// WEIRDPORT'S LOOK (B243, Colin: "look how nice Weirdport looks compared to our dull flat look"): its renderer recipe,
// ported. Khronos PBR NEUTRAL tone mapping (not ACES: a film curve that greys out a hand-picked palette) -- three r160
// predates THREE.NeutralToneMapping, so it goes in as the CustomToneMapping body, the same maths.
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
  'vec3 CustomToneMapping( vec3 color ) { return color; }',
  `vec3 CustomToneMapping( vec3 color ) {
    const float StartCompression = 0.8 - 0.04; const float Desaturation = 0.15;
    color *= toneMappingExposure;
    float x = min( color.r, min( color.g, color.b ) ); float offset = x < 0.08 ? x - 6.25 * x * x : 0.04; color -= offset;
    float peak = max( color.r, max( color.g, color.b ) ); if ( peak < StartCompression ) return color;
    float d = 1. - StartCompression; float newPeak = 1. - d * d / ( peak + d - StartCompression ); color *= newPeak / peak;
    float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. ); return mix( color, vec3( newPeak ), g ); }`);
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9c8de);
scene.fog = new THREE.Fog(0xa9c8de, 140, 300);
export const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 700);
// Day light: cool sky fill, warm low-ish sun. ONE shadow-casting light whose small shadow box follows the camera
// target, and only units + player buildings cast (the city does not), so it stays cheap on a phone.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const hemi = new THREE.HemisphereLight(0xe4f0ff, 0x2a1f3d, 1.75); // Weirdport: bright sky fill, purple ground
scene.add(hemi);
// A cool FILL from the side opposite the sun (the shadow side reads), a pink RIM low behind, a teal BOUNCE up off the
// street. None casts a shadow. Weirdport's LIGHTX numbers.
const fill = new THREE.DirectionalLight(0xbfd8ff, 0.85); fill.position.set(-7, 5, -6);
const rim = new THREE.DirectionalLight(0xff7a9e, 1.15); rim.position.set(-4, 3, 8);
const bounce = new THREE.DirectionalLight(0x3fd9c4, 0.38); bounce.position.set(0, -10, 0);
scene.add(fill, rim, bounce);
export const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
export const SUN_OFF = new THREE.Vector3(30, 60, 22);
sun.position.copy(SUN_OFF);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 160 });
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
scene.add(sun, sun.target);
/** Keep the shadow box centred on what the camera looks at; snapped to texels so shadows don't shimmer while panning. */
export function followSun(x, z) {
  const step = 80 / 1024; x = Math.round(x / step) * step; z = Math.round(z / step) * step;
  sun.target.position.set(x, 0, z); sun.position.set(x + SUN_OFF.x, SUN_OFF.y, z + SUN_OFF.z);
}
/** Time of day, k = 0 (morning) .. 1 (golden hour): the sun drops lower, warmer and longer-shadowed, the sky
 * and fog go peach, the sky fill dims. Only colours and one direction change, so it costs nothing per frame. */
// ALIEN GRADE (B233, "sexy map"): a teal-violet day going to a magenta dusk, cool teal bounce from the ground.
const DAY = { sun: new THREE.Color(0xfff3e0), dusk: new THREE.Color(0xff8a6a), sky: new THREE.Color(0xb7b4e6), skyD: new THREE.Color(0xe08aa8), hemi: new THREE.Color(0xe4f0ff), hemiD: new THREE.Color(0xffc8dc) };
// Sky dome: horizon = the fog colour (so the city melts into it), zenith a deep violet; a ringed planet hangs in it.
// Follows the camera, never fogged, drawn first. Two draws.
const SKY = { hor: { value: new THREE.Color() }, zen: { value: new THREE.Color() } };
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 12), new THREE.ShaderMaterial({ uniforms: { uHor: SKY.hor, uZen: SKY.zen }, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 uHor; uniform vec3 uZen; varying vec3 vD; void main() { gl_FragColor = vec4(mix(uHor, uZen, smoothstep(-0.02, 0.55, vD.y)), 1.0); }' }));
skyDome.renderOrder = -10; skyDome.frustumCulled = false;
{ const pl = new THREE.Group(), ball = new THREE.Mesh(new THREE.SphereGeometry(46, 24, 16), new THREE.MeshBasicMaterial({ color: 0xc88ad8, fog: false, depthWrite: false })),
    ring = new THREE.Mesh(new THREE.RingGeometry(62, 92, 48), new THREE.MeshBasicMaterial({ color: 0xffd0e8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false, depthWrite: false }));
  ring.rotation.x = 1.25; ring.rotation.y = 0.3; pl.add(ball, ring); pl.position.set(-150, 70, -430); pl.renderOrder = -9; ball.renderOrder = ring.renderOrder = -9; skyDome.add(pl); }
scene.add(skyDome);
skyDome.onBeforeRender = (r, sc, cam) => { skyDome.position.copy(cam.position); skyDome.updateMatrixWorld(); };
let lastTod = 0, overcast = 0;
const GREY = new THREE.Color(0x8d969e), SKYC = new THREE.Color();
/** Rain: greys the sky/fog and dims the sun on top of the time of day (k 0..1). */
export function setOvercast(k) { overcast = k; setTimeOfDay(lastTod); }
export function setTimeOfDay(k) {
  lastTod = k;
  sun.color.copy(DAY.sun).lerp(DAY.dusk, k); sun.intensity = 2.4 - 0.25 * k;
  SUN_OFF.set(30 + 25 * k, 60 - 18 * k, 22 + 14 * k);
  SKYC.copy(DAY.sky).lerp(DAY.skyD, k); scene.fog.color.copy(SKYC);
  hemi.color.copy(DAY.hemi).lerp(DAY.hemiD, k); hemi.intensity = 1.75 - 0.15 * k;
  if (overcast > 0) { SKYC.lerp(GREY, 0.55 * overcast); scene.fog.color.copy(SKYC); sun.intensity *= 1 - 0.45 * overcast; }
  if (scene.background && scene.background.isColor) scene.background.copy(SKYC); else scene.backgroundIntensity = 1 - 0.45 * overcast;
  SKY.hor.value.copy(SKYC); SKY.zen.value.setHex(0x2a1f52).lerp(GREY, 0.4 * overcast);
}
setTimeOfDay(0);
// The SKY is Weirdport's painted panorama (textures/sky.jpg, from its images/hdri_game.png): the background, and through
// PMREM the environment light every PBR material (the characters, the worker's pieces) picks up. The dome above is the
// fallback while it loads or if it fails.
new THREE.TextureLoader().load('./textures/sky.jpg', (t) => {
  t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t; skyDome.visible = false; setTimeOfDay(lastTod);
  try { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(t).texture; pm.dispose(); } catch (e) { /* no IBL: lights only */ }
});
/** Mark a subtree as shadow casters. */
export function casts(o) { o.traverse((n) => { if (n.isMesh) n.castShadow = true; }); return o; }

const matCache = new Map();
const cached = new Set();
export function mat(c) {
  if (!matCache.has(c)) { const m = new THREE.MeshLambertMaterial({ color: c }); matCache.set(c, m); cached.add(m); }
  return matCache.get(c);
}
// TEXTURED GROUND (B229): Weirdport's toon-city surfaces (textures/*.webp, lifted from toon_city_visual.glb), laid in
// WORLD metres so a 120 m street and a 4 m kerb share one scale; side faces (kerbs) take their own texture, projected
// along the face. Each call is its own material: mat() is cached by colour and shared with unrelated boxes.
const texLoader = new THREE.TextureLoader(), texCache = {};
function groundTex(name) {
  if (!texCache[name]) { const t = texLoader.load('./textures/' + name + '.webp'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache[name] = t; }
  return texCache[name];
}
export function groundMat(top, side = top, metres = 4, tint = 0xffffff) {
  const m = new THREE.MeshLambertMaterial({ color: tint, map: groundTex(top) });
  const side_ = groundTex(side);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSide = { value: side_ }; sh.uniforms.uM = { value: metres };
    sh.vertexShader = 'varying vec3 vGW; varying vec3 vGN;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 gw = vec4(transformed, 1.0); vec3 gn = objectNormal;
      #ifdef USE_INSTANCING
        gw = instanceMatrix * gw; gn = mat3(instanceMatrix) * gn;
      #endif
      vGW = (modelMatrix * gw).xyz; vGN = normalize(mat3(modelMatrix) * gn);`);
    sh.fragmentShader = 'uniform sampler2D uSide; uniform float uM; varying vec3 vGW; varying vec3 vGN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      vec4 sampledDiffuseColor = abs(vGN.y) > 0.5 ? texture2D(map, vGW.xz / uM)
        : texture2D(uSide, vec2(abs(vGN.x) > 0.5 ? vGW.z : vGW.x, vGW.y) / (uM * 0.25));
      diffuseColor *= sampledDiffuseColor;`);
  };
  return m;
}
// FACADES (B232): Weirdport's tint-ready walls (brick, plaster, wood siding, brick-through-plaster) packed into one 2x2
// atlas so every storefront floor stays ONE instanced draw; a per-instance aTex picks the quarter, the instance colour
// tints it. World-metre UVs along the face (metres across, metres up), textureGrad so the quarter seams do not shimmer.
export function facadeMat(metres = 3) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 2048;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  ['brick', 'plaster', 'siding', 'brickplaster'].forEach((n, i) => {
    const im = new Image(); im.onload = () => { cv.getContext('2d').drawImage(im, (i % 2) * 1024, (i >> 1) * 1024, 1024, 1024); tex.needsUpdate = true; };
    im.src = './textures/' + n + '.webp';
  });
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff, map: tex });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uM = { value: metres };
    sh.vertexShader = 'attribute float aTex; varying float vTex; varying vec3 vGW; varying vec3 vGN;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 gw = vec4(transformed, 1.0); vec3 gn = objectNormal;
      #ifdef USE_INSTANCING
        gw = instanceMatrix * gw; gn = mat3(instanceMatrix) * gn;
      #endif
      vGW = (modelMatrix * gw).xyz; vGN = normalize(mat3(modelMatrix) * gn); vTex = aTex;`);
    sh.fragmentShader = 'uniform float uM; varying float vTex; varying vec3 vGW; varying vec3 vGN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 fu = (abs(vGN.y) > 0.5 ? vGW.xz : vec2(abs(vGN.x) > 0.5 ? vGW.z : vGW.x, vGW.y)) / uM;
      float ti = floor(vTex + 0.5); vec2 off = vec2(mod(ti, 2.0), floor(ti / 2.0)) * 0.5;
      vec2 q = off + (0.004 + fract(fu) * 0.492);
      diffuseColor *= textureGrad(map, q, dFdx(fu) * 0.5, dFdy(fu) * 0.5);`).replace('#include <color_fragment>', `
      #if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
        diffuseColor.rgb *= mix(vColor, vec3(1.0), 0.45); // the texture carries the dirt; the tint only colours it
      #endif`);
  };
  return m;
}
export function box(w, h, d, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); return m; }
export function cyl(rt, rb, h, c, x = 0, y = 0, z = 0, seg = 12) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y, z); return m; }
export function basic(c, o = 1) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide }); }
export function ringMesh(r0, r1, c, o) { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 40), basic(c, o)); m.rotation.x = -Math.PI / 2; m.position.y = 0.1; return m; }
export function disposeObj(o) {
  scene.remove(o);
  o.traverse((n) => {
    if (n.isSkinnedMesh) n.skeleton.dispose();
    if (n.userData.shared) return; // character clones share geometry/material with their prototype
    if (n.geometry) n.geometry.dispose();
    if (n.material && !cached.has(n.material) && n.material.dispose) n.material.dispose();
  });
}
