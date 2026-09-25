// Album Cosmos: the cover art rebuilt from 16k particles.
//
// - Bright areas stand forward, so the art becomes a relief sculpture.
// - Each pixel listens to the frequency matching its colour: warm colours
//   pump with the bass and cool colours shimmer with the treble.
// - Every beat sends a shockwave out from the centre of the cover.
// - On a track change the cover shatters into a nebula and re-forms as the
//   new one.

import * as THREE from 'three';
import { BINS } from '../audio.js';
import { ART_SIZE } from '../palette.js';

const N = ART_SIZE * ART_SIZE;

const vertexShader = /* glsl */ `
  uniform sampler2D uSpec;
  uniform float uTime, uMorph, uShock, uShockAmp, uLevel, uBar, uSize;
  attribute vec2 aGrid;
  attribute vec3 aColor, aScatter;
  attribute float aBand, aLum;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    float s = texture2D(uSpec, vec2(0.03 + aBand * 0.8, 0.5)).r;
    vec3 p = vec3(aGrid * 9.0, aLum * 1.6 + s * s * 4.5);
    float r = length(aGrid);
    float wave = exp(-pow((r - uShock * 2.2) * 5.0, 2.0)) * uShockAmp * exp(-uShock * 1.2);
    p.z += wave * 3.0 + sin(r * 7.0 - uTime * 1.5) * 0.25 * uLevel;

    vec3 sc = aScatter;
    float a = uTime * 0.25 + length(aScatter) * 0.02;
    sc.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * sc.xz;
    p = mix(p, sc, uMorph);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.75 + s * 1.2 + wave) / -mv.z;
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
    vGlow = 0.45 + s * 0.6 + wave * 0.8 + uBar * 0.1 + uMorph * 0.4;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(vColor * vGlow, 1.0);
  }
`;

export class AlbumScene {
  name = 'Album Cosmos';
  blurb = 'The cover art as a living relief. Each colour sings at its own frequency, beats send shockwaves through it, and new tracks shatter and rebuild it.';

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030208);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

    const grid = new Float32Array(N * 2);
    const scatter = new Float32Array(N * 3);
    const dir = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const x = i % ART_SIZE;
      const y = Math.floor(i / ART_SIZE);
      grid[i * 2] = (x / (ART_SIZE - 1)) * 2 - 1;
      grid[i * 2 + 1] = 1 - (y / (ART_SIZE - 1)) * 2;
      dir.randomDirection().multiplyScalar(16 + Math.random() * 26);
      dir.y *= 0.35; // flatten into a disc-like nebula
      dir.toArray(scatter, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute('aGrid', new THREE.BufferAttribute(grid, 2));
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute('aBand', new THREE.BufferAttribute(new Float32Array(N), 1));
    geo.setAttribute('aLum', new THREE.BufferAttribute(new Float32Array(N), 1));
    this.geo = geo;

    this.specData = new Uint8Array(BINS);
    this.specTex = new THREE.DataTexture(this.specData, BINS, 1, THREE.RedFormat, THREE.UnsignedByteType);
    this.specTex.magFilter = this.specTex.minFilter = THREE.LinearFilter;

    this.uniforms = {
      uSpec: { value: this.specTex },
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uShock: { value: 10 },
      uShockAmp: { value: 0 },
      uLevel: { value: 0 },
      uBar: { value: 0 },
      uSize: { value: 150 },
    };
    const points = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader, fragmentShader }));
    points.frustumCulled = false;
    this.scene.add(points);

    this.morph = 0;
    this.phase = 'idle';
    this.pending = null;
    this.hasArt = false;
  }

  setPixelRatio(ratio) {
    this.uniforms.uSize.value = 150 * ratio;
  }

  setPalette() {}

  setArtwork(art) {
    if (!this.hasArt) {
      this.#applyArt(art);
      this.hasArt = true;
    } else {
      this.pending = art;
      this.phase = 'out';
    }
  }

  #applyArt({ pixels }) {
    const color = this.geo.attributes.aColor;
    const band = this.geo.attributes.aBand;
    const lum = this.geo.attributes.aLum;
    const c = new THREE.Color();
    const hsl = {};
    for (let i = 0; i < N; i++) {
      c.setRGB(pixels[i * 4] / 255, pixels[i * 4 + 1] / 255, pixels[i * 4 + 2] / 255, THREE.SRGBColorSpace);
      c.toArray(color.array, i * 3);
      c.getHSL(hsl);
      // Hue → frequency (red = bass … violet = treble). Greys sit in the mids.
      const hueBand = (hsl.h + 0.04) % 1;
      band.array[i] = hueBand * hsl.s + (0.3 + hsl.l * 0.3) * (1 - hsl.s);
      lum.array[i] = hsl.l;
    }
    color.needsUpdate = band.needsUpdate = lum.needsUpdate = true;
  }

  update(f, dt, t) {
    if (this.phase === 'out') {
      this.morph += dt / 1.1;
      if (this.morph >= 1) {
        this.morph = 1;
        this.#applyArt(this.pending);
        this.phase = 'in';
      }
    } else if (this.phase === 'in') {
      this.morph -= dt / 2;
      if (this.morph <= 0) {
        this.morph = 0;
        this.phase = 'idle';
      }
    }
    const u = this.uniforms;
    u.uMorph.value = this.morph * this.morph * (3 - 2 * this.morph);
    if (f.isBeat) {
      u.uShock.value = 0;
      u.uShockAmp.value = 0.4 + f.bass;
    }
    u.uShock.value += dt;
    u.uTime.value = t;
    u.uLevel.value = f.level;
    u.uBar.value = f.bar;
    for (let i = 0; i < BINS; i++) this.specData[i] = f.spectrum[i] * 255;
    this.specTex.needsUpdate = true;

    const angle = Math.sin(t * 0.15) * 0.6;
    const radius = 24 - f.bar * 1.2;
    this.camera.position.set(Math.sin(angle) * radius, Math.cos(t * 0.1) * 4, Math.cos(angle) * radius);
    this.camera.lookAt(0, 0, 1);
  }
}
