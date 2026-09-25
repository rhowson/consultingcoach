// Harmonic Orbit: shows the music's harmony instead of its loudness.
//
// The 12 pitch classes stand on the circle of fifths, so related keys are
// neighbours and each chord makes its own shape: major and minor triads are
// mirror-image triangles. The active chord hangs from the tops of the pillars
// and is named in the middle. The ring of lights sweeps once per bar.

import * as THREE from 'three';

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
const R = 10;
const RING = 96;

const coreVertex = /* glsl */ `
  uniform float uTime, uLevel, uBass, uBeat;
  varying float vD;
  varying vec3 vN;
  void main() {
    vec3 n = normalize(position);
    float d = sin(n.x * 4.0 + uTime * 1.3) * sin(n.y * 5.0 - uTime * 0.9) * sin(n.z * 4.5 + uTime * 1.1);
    vec3 p = position + n * (d * (0.25 + uLevel * 1.4) + uBass * 0.6 + uBeat * 0.35);
    vD = d;
    vN = normalMatrix * n;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const coreFragment = /* glsl */ `
  uniform vec3 uColA, uColB;
  varying float vD;
  varying vec3 vN;
  void main() {
    float rim = pow(1.0 - abs(normalize(vN).z), 2.0);
    gl_FragColor = vec4(mix(uColA, uColB, vD * 0.5 + 0.5) * (0.15 + rim * 0.9), 1.0);
  }
`;

function textSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.userData.draw = (text, color = '#fff') => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 128);
    ctx.font = '600 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 64);
    texture.needsUpdate = true;
  };
  return sprite;
}

// Name a triad from the strongest pitch classes, if they form one.
function nameChord(pcs) {
  const set = new Set(pcs);
  for (const root of pcs) {
    if (set.has((root + 4) % 12) && set.has((root + 7) % 12)) return NAMES[root];
    if (set.has((root + 3) % 12) && set.has((root + 7) % 12)) return `${NAMES[root]}m`;
  }
  return '';
}

export class HarmonicScene {
  name = 'Harmonic Orbit';
  blurb = 'See the harmony. Notes are arranged on the circle of fifths, and the chord being played forms a glowing shape between them.';

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040309);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

    const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
    this.nodes = [];
    const pillarGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 12, 1, true).translate(0, 0.5, 0);
    const orbGeo = new THREE.SphereGeometry(0.55, 24, 16);
    for (let i = 0; i < 12; i++) {
      const pc = FIFTHS[i];
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const pos = new THREE.Vector3(Math.cos(angle) * R, 0, Math.sin(angle) * R);
      const base = new THREE.Color().setHSL(i / 12, 0.85, 0.55);
      const orb = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: base.clone() }));
      const pillar = new THREE.Mesh(pillarGeo, new THREE.MeshBasicMaterial({ color: base.clone(), opacity: 0.55, ...additive }));
      const label = textSprite();
      label.userData.draw(NAMES[pc], `#${base.getHexString()}`);
      label.scale.set(2.4, 1.2, 1);
      orb.position.copy(pos);
      pillar.position.copy(pos);
      label.position.copy(pos).multiplyScalar(1.28).setY(-0.6);
      this.scene.add(orb, pillar, label);
      this.nodes.push({ pc, pos, base, orb, pillar, value: 0 });
    }

    this.chordPositions = new Float32Array(9);
    const chordGeo = new THREE.BufferGeometry();
    chordGeo.setAttribute('position', new THREE.BufferAttribute(this.chordPositions, 3));
    this.chordFill = new THREE.Mesh(chordGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.1, side: THREE.DoubleSide, ...additive }));
    this.chordLine = new THREE.LineLoop(chordGeo, new THREE.LineBasicMaterial({ color: 0xffffff, ...additive }));
    this.chordFill.frustumCulled = this.chordLine.frustumCulled = false;
    this.scene.add(this.chordFill, this.chordLine);
    this.chordTarget = new Float32Array(9);
    this.chordAlpha = 0;

    this.chordLabel = textSprite();
    this.chordLabel.scale.set(6, 3, 1);
    this.chordLabel.position.set(0, 7.5, 0);
    this.scene.add(this.chordLabel);
    this.chordName = null;

    this.coreUniforms = {
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uBass: { value: 0 },
      uBeat: { value: 0 },
      uColA: { value: new THREE.Color() },
      uColB: { value: new THREE.Color() },
    };
    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 6),
      new THREE.ShaderMaterial({ uniforms: this.coreUniforms, vertexShader: coreVertex, fragmentShader: coreFragment }),
    );
    this.core.position.y = 2.5;
    this.scene.add(this.core);

    const ringPos = new Float32Array(RING * 3);
    for (let i = 0; i < RING; i++) {
      const a = (i / RING) * Math.PI * 2 - Math.PI / 2;
      ringPos.set([Math.cos(a) * 14, 0, Math.sin(a) * 14], i * 3);
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    ringGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(RING * 3), 3));
    this.ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, ...additive }));
    this.scene.add(this.ring);

    const floor = new THREE.PolarGridHelper(16, 12, 8, 96, 0x2a2440, 0x16122a);
    floor.position.y = -0.01;
    this.scene.add(floor);

    this.accent = new THREE.Color();
  }

  setPalette(colors) {
    this.coreUniforms.uColA.value.copy(colors[0]);
    this.coreUniforms.uColB.value.copy(colors[2]);
    this.accent.copy(colors[3]);
  }

  update(f, dt, t) {
    for (const n of this.nodes) {
      n.value += (f.chroma[n.pc] - n.value) * Math.min(1, dt * 10);
      const v = n.value;
      n.orb.scale.setScalar(0.6 + v * 1.3);
      n.orb.material.color.copy(n.base).multiplyScalar(0.25 + v * 1.1);
      n.pillar.scale.y = 0.05 + v * v * 7;
      n.pillar.material.color.copy(n.base).multiplyScalar(0.2 + v);
    }

    const top = [...this.nodes].sort((a, b) => b.value - a.value).slice(0, 3);
    const strong = top[2].value > 0.35 && top[2].value > f.chroma.reduce((a, b) => a + b, 0) / 12;
    top.forEach((n, i) => this.chordTarget.set([n.pos.x, 0.3 + n.value * n.value * 7, n.pos.z], i * 3));
    for (let i = 0; i < 9; i++) this.chordPositions[i] += (this.chordTarget[i] - this.chordPositions[i]) * Math.min(1, dt * 8);
    this.chordFill.geometry.attributes.position.needsUpdate = true;
    this.chordAlpha += ((strong ? 1 : 0) - this.chordAlpha) * Math.min(1, dt * 4);
    this.chordFill.material.opacity = this.chordAlpha * (0.06 + f.beat * 0.1);
    this.chordLine.material.opacity = this.chordAlpha;

    const name = strong ? nameChord(top.map((n) => n.pc)) : '';
    if (name !== this.chordName) {
      this.chordName = name;
      this.chordLabel.userData.draw(name, '#ffffff');
    }
    this.chordLabel.material.opacity = 0.35 + f.beat * 0.65;

    const cu = this.coreUniforms;
    cu.uTime.value = t;
    cu.uLevel.value = f.level;
    cu.uBass.value = f.bass;
    cu.uBeat.value = f.beat;
    this.core.rotation.y = t * 0.2;

    const colors = this.ring.geometry.attributes.color;
    for (let i = 0; i < RING; i++) {
      let d = Math.abs(i / RING - f.barPhase);
      d = Math.min(d, 1 - d);
      const v = Math.exp(-d * 40) * 1.6 + 0.08 + f.beat * 0.25;
      colors.setXYZ(i, this.accent.r * v, this.accent.g * v, this.accent.b * v);
    }
    colors.needsUpdate = true;

    const a = t * 0.08;
    const radius = 27 - f.bar;
    this.camera.position.set(Math.sin(a) * radius, 12 + Math.sin(t * 0.1) * 4, Math.cos(a) * radius);
    this.camera.lookAt(0, 2.5, 0);
  }
}
