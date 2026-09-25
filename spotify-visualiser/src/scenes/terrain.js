// Spectral Terrain: fly low over a landscape built from the music.
//
// Each row of the ground is one spectrum snapshot. Rows are born on the
// horizon and roll towards the camera. With a timeline source (Spotify
// analysis or the demo), rows are sampled LOOKAHEAD seconds in the future,
// so the mountains you see ahead are the music that is about to play, and
// the row under the camera is exactly "now".

import * as THREE from 'three';
import { BINS } from '../audio.js';

const COLS = 128;
const ROWS = 220;
const ROW_RATE = 30; // rows per second
const WIDTH = 90;
const DEPTH = 180;
const CAMERA_Z = 72;
// Age (in rows) of the terrain directly under the camera.
const LOOKAHEAD = ((0.5 + CAMERA_Z / DEPTH) * (ROWS - 1)) / ROW_RATE;

const vertexShader = /* glsl */ `
  uniform sampler2D uHeights;
  uniform float uHead, uFrac, uAmp;
  varying float vH, vDist;
  varying vec2 vGrid;
  void main() {
    float side = abs(uv.x * 2.0 - 1.0);        // bass down the middle, treble at the edges
    float age = (1.0 - uv.y) * (ROWS - 1.0) + uFrac;
    float h = texture2D(uHeights, vec2(0.02 + side * 0.96, (uHead - age + 0.5) / ROWS)).r;
    h *= smoothstep(0.03, 0.22, side) * (0.55 + side * 1.1); // keep a flight path open
    vec3 p = position;
    p.y += h * uAmp;
    vH = h;
    vGrid = vec2(uv.x * (COLS - 1.0), age);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColA, uColB, uColC, uBg;
  uniform float uBeat;
  varying float vH, vDist;
  varying vec2 vGrid;
  void main() {
    vec2 d = fwidth(vGrid);
    vec2 a = abs(fract(vGrid - 0.5) - 0.5) / d;
    float line = 1.0 - min(min(a.x, a.y), 1.0);
    float h = clamp(vH, 0.0, 1.0);
    vec3 grad = h < 0.5 ? mix(uColA, uColB, h * 2.0) : mix(uColB, uColC, h * 2.0 - 1.0);
    vec3 col = grad * (0.05 + h * 0.35) + grad * line * (0.3 + h * 1.8 + uBeat * 0.5);
    col = mix(col, uBg, smoothstep(50.0, 175.0, vDist));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  uniform vec3 uTop, uBottom;
  uniform float uTime, uGlow;
  varying vec2 vUv;
  void main() {
    float y = vUv.y;
    if (y < 0.5 && fract(y * 16.0 + uTime * 0.4) < (0.5 - y) * 1.5) discard;
    if (length(vUv - 0.5) > 0.5) discard;
    gl_FragColor = vec4(mix(uBottom, uTop, y) * uGlow, 1.0);
  }
`;

export class TerrainScene {
  name = 'Spectral Terrain';
  blurb = 'Fly over the song. The ground is built from the music, and with Spotify analysis the mountains ahead are what is about to play.';

  constructor() {
    this.scene = new THREE.Scene();
    this.bg = new THREE.Color(0x06020d);
    this.scene.background = this.bg;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);

    this.heights = new Uint8Array(COLS * ROWS);
    const tex = new THREE.DataTexture(this.heights, COLS, ROWS, THREE.RedFormat, THREE.UnsignedByteType);
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    this.heightTex = tex;
    this.head = 0;
    this.acc = 0;
    this.row = new Float32Array(BINS);

    this.uniforms = {
      uHeights: { value: tex },
      uHead: { value: 0 },
      uFrac: { value: 0 },
      uAmp: { value: 20 },
      uBeat: { value: 0 },
      uColA: { value: new THREE.Color() },
      uColB: { value: new THREE.Color() },
      uColC: { value: new THREE.Color() },
      uBg: { value: this.bg },
    };
    const geo = new THREE.PlaneGeometry(WIDTH, DEPTH, COLS - 1, ROWS - 1);
    geo.rotateX(-Math.PI / 2);
    const terrain = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader, fragmentShader, defines: { ROWS: ROWS.toFixed(1), COLS: COLS.toFixed(1) } }),
    );
    terrain.frustumCulled = false;
    this.scene.add(terrain);

    this.sunUniforms = { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() }, uTime: { value: 0 }, uGlow: { value: 1 } };
    this.sun = new THREE.Mesh(
      new THREE.PlaneGeometry(56, 56),
      new THREE.ShaderMaterial({
        uniforms: this.sunUniforms,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: sunFragment,
      }),
    );
    this.sun.position.set(0, 16, -120);
    this.scene.add(this.sun);

    const stars = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      stars.set([Math.cos(theta) * Math.sin(phi) * 300, Math.cos(phi) * 300 - 20, Math.sin(theta) * Math.sin(phi) * 300 - 60], i * 3);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0.7 }));
    this.scene.add(this.stars);
  }

  setPalette(colors) {
    this.uniforms.uColA.value.copy(colors[1]);
    this.uniforms.uColB.value.copy(colors[0]);
    this.uniforms.uColC.value.copy(colors[2]).lerp(new THREE.Color(1, 1, 1), 0.3);
    this.sunUniforms.uTop.value.copy(colors[3]);
    this.sunUniforms.uBottom.value.copy(colors[0]);
  }

  update(f, dt, t, timeline, pos) {
    this.acc = Math.min(this.acc + dt * ROW_RATE, ROWS);
    while (this.acc >= 1) {
      this.acc -= 1;
      const src = timeline ? timeline.spectrumAt(pos + LOOKAHEAD - this.acc / ROW_RATE, this.row) : f.spectrum;
      this.#writeRow(src);
    }
    this.heightTex.needsUpdate = true;
    this.uniforms.uHead.value = this.head;
    this.uniforms.uFrac.value = this.acc;
    this.uniforms.uBeat.value = f.beat;

    this.sunUniforms.uTime.value = t;
    this.sunUniforms.uGlow.value = 0.8 + f.bass * 0.6;
    this.sun.scale.setScalar(1 + f.bass * 0.12 + f.bar * 0.05);
    this.stars.rotation.y = t * 0.004;

    const cam = this.camera;
    cam.position.set(Math.sin(t * 0.13) * 4, 6.5 + f.bass * 1.5, CAMERA_Z);
    cam.lookAt(Math.sin(t * 0.13 + 0.6) * 3, 5, 0);
    cam.rotateZ(Math.sin(t * 0.21) * 0.06);
    cam.fov = 60 + f.beat * 2;
    cam.updateProjectionMatrix();
  }

  #writeRow(spectrum) {
    this.head = (this.head + 1) % ROWS;
    const base = this.head * COLS;
    for (let c = 0; c < COLS; c++) {
      const x = (c / (COLS - 1)) * (BINS - 1);
      const i = Math.floor(x);
      const v = spectrum[i] + (spectrum[Math.min(i + 1, BINS - 1)] - spectrum[i]) * (x - i);
      this.heights[base + c] = Math.min(255, Math.pow(v, 1.4) * 330);
    }
  }
}
