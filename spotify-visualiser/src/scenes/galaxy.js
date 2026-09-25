// Your Galaxy: your listening history as a galaxy you can fly around.
//
// - Every song is a star. Where it sits = its genre (constellation) and
//   micro-genre (sub-cluster); how big it is = how often you've played it.
// - Zoom, orbit, hover and click to reveal the song; double-click to fly there.
// - When a song starts, its card appears, then the camera accelerates through
//   warp towards that star. On arrival the star becomes a pulsar: its beams
//   spin with the tempo and every sudden jump in loudness fires a ring whose
//   size and speed scale with the jump. Rings light up the stars they pass.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CLUSTERS, hash, microCenter, starPosition } from '../genres.js';
import { RANGES } from '../history.js';

const MAX_RINGS = 8;
const STREAKS = 450;
const OVERVIEW = { pos: new THREE.Vector3(0, 62, 78), look: new THREE.Vector3(0, -3, 4) };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function ago(ms) {
  if (!ms) return 'not yet';
  const d = (Date.now() - ms) / 86400000;
  if (d < 1 / 24) return 'just now';
  if (d < 1) return `${Math.round(d * 24)} h ago`;
  if (d < 60) return `${Math.round(d)} days ago`;
  return `${Math.round(d / 30)} months ago`;
}

function starSize(t) {
  // Top tracks with no tracked plays yet get a size from their rank.
  const weight = t.plays || (t.rank ? (51 - t.rank) / 6 : 0);
  return 0.3 + 0.36 * Math.log2(1 + weight);
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const starVertex = /* glsl */ `
  uniform float uScale, uTime;
  uniform vec3 uRingCenter;
  uniform float uRingR[${MAX_RINGS}];
  uniform float uRingS[${MAX_RINGS}];
  attribute vec3 aColor;
  attribute float aSize, aState, aTwinkle;
  varying vec3 vColor;
  varying float vBoost, vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float d = distance(position, uRingCenter);
    float boost = 0.0;
    for (int i = 0; i < ${MAX_RINGS}; i++) {
      float x = (d - uRingR[i]) * 0.6;
      boost += uRingS[i] * exp(-x * x);
    }
    vBoost = boost + aState;
    vColor = aColor * (0.85 + 0.15 * sin(uTime * 1.7 + aTwinkle * 6.28));
    float px = aSize * (1.0 + boost * 0.7 + aState * 0.6) * uScale / -mv.z;
    vFade = clamp(24.0 / px, 0.18, 1.0); // big close-up stars would blow out under additive blending
    gl_PointSize = clamp(px, 1.5, 300.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vBoost, vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float glow = pow(1.0 - d, 2.2);
    float core = pow(max(0.0, 1.0 - d * 2.4), 3.0);
    gl_FragColor = vec4((vColor * glow * (1.0 + vBoost * 1.6) + vec3(core * (0.55 + vBoost))) * vFade, 1.0);
  }
`;
const ringVertex = /* glsl */ `
  varying float vR;
  void main() {
    vR = length(position.xy);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ringFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vR;
  void main() {
    float edge = exp(-pow((vR - 0.975) / 0.018, 2.0));
    float wake = smoothstep(0.8, 1.0, vR) * 0.08;
    gl_FragColor = vec4(uColor * (edge + wake) * uAlpha, 1.0);
  }
`;
const beamVertex = /* glsl */ `
  varying float vV;
  void main() {
    vV = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vV;
  void main() { gl_FragColor = vec4(uColor * pow(1.0 - vV, 1.6) * uAlpha, 1.0); }
`;

export class GalaxyScene {
  name = 'Your Galaxy';
  blurb = 'Every song you have played is a star, placed by genre and sized by play count. Drag to orbit, scroll to zoom, click a star to reveal it.';
  interactive = true;

  constructor(canvas, ui, handlers = {}) {
    this.canvas = canvas;
    this.ui = ui;
    this.handlers = handlers;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030208);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1200);
    this.camera.position.copy(OVERVIEW.pos);
    this.camera.lookAt(OVERVIEW.look);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 1.5, maxDistance: 200, autoRotateSpeed: 0.35, enabled: false });
    this.controls.target.copy(OVERVIEW.look);
    this.controls.addEventListener('start', () => (this.controls.autoRotate = false));

    this.glowTex = glowTexture();
    this.#buildBackdrop();
    this.#buildPulsar();
    this.#buildWarp();
    this.#buildUi();

    this.tracks = [];
    this.byId = new Map();
    this.points = null;
    this.phase = 'overview';
    this.warp = 0;
    this.hovered = -1;
    this.selected = -1;
    this.playingId = null;
    this.fast = 0;
    this.slow = 0;
    this.cool = 0;
    this.range = '12m';
    this.#bindEvents();
  }

  // --- construction ----------------------------------------------------------

  #buildBackdrop() {
    let seed = 3;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
    const N = 26000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const r = Math.pow(rand(), 0.7) * 50 + 1.5;
      const a = (i % 2) * Math.PI + r * 0.11 + gauss() * 0.28;
      pos.set([Math.cos(a) * r + gauss() * 1.4, gauss() * (1.6 - r / 40), Math.sin(a) * r + gauss() * 1.4], i * 3);
      c.setHSL(0.72 - r / 170, 0.6, 0.25 + rand() * 0.25).multiplyScalar(0.4);
      c.toArray(col, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.35, map: this.glowTex, vertexColors: true, ...add })));

    const bulge = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: new THREE.Color('#ffe7c2').multiplyScalar(0.8), ...add }));
    bulge.scale.set(16, 16, 1);
    this.scene.add(bulge);

    // A faint nebula behind each constellation.
    for (const cl of Object.values(CLUSTERS)) {
      if (cl.halo) continue;
      const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: cl.color.clone().multiplyScalar(0.16), ...add }));
      neb.position.copy(cl.center);
      neb.scale.set(18, 18, 1);
      this.scene.add(neb);
    }
  }

  #buildPulsar() {
    const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
    const p = new THREE.Group();
    p.visible = false;
    this.pulsarCore = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.pulsarGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffffff, ...add }));
    this.beamUniforms = { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } };
    const beamGeo = new THREE.CylinderGeometry(0.55, 0.03, 18, 32, 1, true).translate(0, 9, 0);
    const beamMat = new THREE.ShaderMaterial({ uniforms: this.beamUniforms, vertexShader: beamVertex, fragmentShader: beamFragment, side: THREE.DoubleSide, ...add });
    const tilt = new THREE.Group();
    tilt.rotation.z = 0.5; // magnetic axis is off the spin axis, so beams sweep
    const down = new THREE.Mesh(beamGeo, beamMat);
    down.rotation.z = Math.PI;
    tilt.add(new THREE.Mesh(beamGeo, beamMat), down);
    this.spin = new THREE.Group();
    this.spin.add(tilt);
    p.add(this.pulsarCore, this.pulsarGlow, this.spin);
    this.pulsar = p;
    this.pulsarAppear = 0;
    this.scene.add(p);

    this.rings = Array.from({ length: MAX_RINGS }, () => {
      const uniforms = { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } };
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 1, 160, 1).rotateX(-Math.PI / 2),
        new THREE.ShaderMaterial({ uniforms, vertexShader: ringVertex, fragmentShader: ringFragment, side: THREE.DoubleSide, ...add }),
      );
      mesh.visible = false;
      this.scene.add(mesh);
      return { mesh, uniforms, age: 0, life: 0, speed: 0, strength: 0 };
    });
  }

  #buildWarp() {
    const pos = new Float32Array(STREAKS * 6);
    const col = new Float32Array(STREAKS * 6);
    this.streaks = Array.from({ length: STREAKS }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 11;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 120 };
    });
    for (let i = 0; i < STREAKS; i++) col.set([0.8, 0.85, 1, 0, 0, 0], i * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.warpLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.warpLines.frustumCulled = false;
    this.camera.add(this.warpLines);
  }

  #buildUi() {
    this.ui.innerHTML = `
      <div class="g-labels"></div>
      <div class="g-toolbar">
        <div class="g-ranges">${Object.entries(RANGES).map(([k, r]) => `<button data-range="${k}">${r.label}</button>`).join('')}</div>
        <div class="g-nav"><button data-nav="overview">Galaxy view</button><button data-nav="playing">Now playing</button></div>
        <div class="g-stats"></div>
      </div>
      <div class="g-tip" hidden></div>
      <div class="g-card" hidden></div>
      <div class="g-launch" hidden></div>`;
    const q = (s) => this.ui.querySelector(s);
    this.el = { labels: q('.g-labels'), stats: q('.g-stats'), tip: q('.g-tip'), card: q('.g-card'), launch: q('.g-launch') };
    this.ui.querySelectorAll('[data-range]').forEach((b) => (b.onclick = () => this.handlers.onRange?.(b.dataset.range)));
    q('[data-nav="overview"]').onclick = () => this.#flyOverview();
    q('[data-nav="playing"]').onclick = () => {
      const i = this.byId.get(this.playingId);
      if (i !== undefined) this.#flyTo(i, false);
    };
    this.el.card.addEventListener('click', (e) => {
      const action = e.target.closest('[data-act]')?.dataset.act;
      if (action === 'close') this.#select(-1);
      if (action === 'fly' && this.selected >= 0) this.#flyTo(this.selected, false);
    });
  }

  #bindEvents() {
    this.pointer = null;
    let down = null;
    this.canvas.addEventListener('pointermove', (e) => (this.pointer = { x: e.clientX, y: e.clientY }));
    this.canvas.addEventListener('pointerleave', () => (this.pointer = null));
    this.canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
    this.canvas.addEventListener('pointerup', (e) => {
      if (!this.active || !down || this.#busy()) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) this.#select(this.#pick(e.clientX, e.clientY));
      down = null;
    });
    this.canvas.addEventListener('dblclick', (e) => {
      if (!this.active || this.#busy()) return;
      const i = this.#pick(e.clientX, e.clientY);
      if (i >= 0) this.#flyTo(i, false);
    });
    addEventListener('keydown', (e) => e.key === 'Escape' && this.active && this.#select(-1));
  }

  // --- public API --------------------------------------------------------------

  setActive(active) {
    this.active = active;
    this.ui.hidden = !active;
    this.controls.enabled = active && !this.#busy();
  }

  setPalette() {}

  setLibrary(lib) {
    const prev = new Map(this.tracks.map((t, i) => [t.id, this.positions.subarray(i * 3, i * 3 + 3).slice()]));
    const selectedId = this.tracks[this.selected]?.id;
    this.tracks = lib.tracks;
    this.range = lib.range;
    this.byId = new Map(this.tracks.map((t, i) => [t.id, i]));
    const n = this.tracks.length;
    this.positions = new Float32Array(n * 3);
    this.from = new Float32Array(n * 3);
    this.to = new Float32Array(n * 3);
    this.sizes = new Float32Array(n);
    const colors = new Float32Array(n * 3);
    const twinkle = new Float32Array(n);
    const c = new THREE.Color();
    this.tracks.forEach((t, i) => {
      const target = starPosition(t.id, t.cluster, t.micro);
      target.toArray(this.to, i * 3);
      (prev.get(t.id) || target.toArray()).forEach((v, k) => (this.from[i * 3 + k] = v)); // stars glide to new homes
      this.sizes[i] = starSize(t);
      const cl = CLUSTERS[t.cluster] || CLUSTERS.uncharted;
      c.copy(cl.color).offsetHSL(((hash(t.micro || '') % 100) / 100 - 0.5) * 0.06, 0, 0);
      c.multiplyScalar(0.45 + Math.min(0.9, 0.12 * Math.log2(1 + t.plays + (t.rank ? 5 : 0))));
      c.toArray(colors, i * 3);
      twinkle[i] = (hash(t.id) % 1000) / 1000;
    });
    this.positions.set(this.from);
    this.morph = 0;

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    g.setAttribute('aState', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkle, 1));
    if (!this.points) {
      this.starUniforms = {
        uScale: { value: 1 },
        uTime: { value: 0 },
        uRingCenter: { value: new THREE.Vector3() },
        uRingR: { value: new Array(MAX_RINGS).fill(0) },
        uRingS: { value: new Array(MAX_RINGS).fill(0) },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: this.starUniforms,
        vertexShader: starVertex,
        fragmentShader: starFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.points = new THREE.Points(g, mat);
      this.points.frustumCulled = false;
      this.scene.add(this.points);
    } else {
      this.points.geometry.dispose();
      this.points.geometry = g;
    }
    this.hovered = -1;
    this.selected = selectedId ? (this.byId.get(selectedId) ?? -1) : -1;
    if (this.selected < 0) this.el.card.hidden = true;
    else this.#setState(this.selected, 1.2);
    this.#buildLabels();

    this.ui.querySelectorAll('[data-range]').forEach((b) => b.classList.toggle('active', b.dataset.range === lib.range));
    const label = lib.demo ? 'Demo library' : `Last ${RANGES[lib.range].label.toLowerCase()}`.replace('Last all time', 'All time');
    const pending = lib.pending ? ` · placing ${lib.pending.toLocaleString()} in genres…` : '';
    this.el.stats.textContent = `${n.toLocaleString()} songs · ${lib.totalPlays.toLocaleString()} plays · ${label}${pending}`;
    this.ui.classList.toggle('demo', !!lib.demo);
  }

  // A new song started: show it, then fly to its star.
  play(track) {
    this.playingId = track.id;
    const i = this.byId.get(track.id);
    const cl = CLUSTERS[track.cluster] || CLUSTERS.uncharted;
    const art = track.art ? `<img src="${esc(track.art)}" alt="">` : `<div class="g-art" style="--c:#${cl.color.getHexString()}">${esc((track.name || '?')[0])}</div>`;
    this.el.launch.innerHTML = `${art}<div class="g-kicker">Now playing</div><div class="g-title">${esc(track.name)}</div>
      <div class="g-artist">${esc(track.artists?.join(', '))}</div>
      <div class="g-dest" style="color:#${cl.color.getHexString()}">→ ${esc(cl.name)}${track.micro ? ` · ${esc(track.micro)}` : ''}</div>`;
    this.el.launch.hidden = false;
    this.el.launch.className = 'g-launch show';
    this.pulsarAppear = 0;
    this.pulsar.visible = false;
    if (i === undefined) {
      setTimeout(() => this.phase !== 'launch' && (this.el.launch.hidden = true), 3000);
      return;
    }
    this.pendingId = track.id;
    this.phase = 'launch';
    this.phaseT = 0;
    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  // --- flight ------------------------------------------------------------------

  #busy() {
    return this.phase === 'launch' || this.phase === 'flight';
  }

  #starPos(i) {
    return new THREE.Vector3().fromArray(this.to, i * 3);
  }

  // Where a star is right now (it may be gliding to a new genre).
  #currentPos(id) {
    const i = this.byId.get(id);
    return i === undefined ? null : new THREE.Vector3().fromArray(this.positions, i * 3);
  }

  #flyTo(i, isPlay) {
    const star = this.#starPos(i);
    const size = this.sizes[i];
    const outward = star.clone().setY(0);
    if (outward.lengthSq() < 1) outward.set(1, 0, 0);
    outward.normalize();
    const dist = 5 + size * 3;
    const offset = outward.multiplyScalar(dist * 0.85).add(new THREE.Vector3(0, dist * 0.5, 0));
    this.#startFlight(star.clone().add(offset), star, isPlay ? i : -1, { id: this.tracks[i].id, offset });
  }

  #flyOverview() {
    if (this.#busy()) return;
    this.#startFlight(OVERVIEW.pos.clone(), OVERVIEW.look.clone(), -1, null);
  }

  #startFlight(to, look, playIndex, focus) {
    this.focusId = focus?.id ?? null;
    const from = this.camera.position.clone();
    const travel = from.distanceTo(to);
    const side = new THREE.Vector3().subVectors(to, from).cross(new THREE.Vector3(0, 1, 0)).normalize();
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 6 + travel * 0.12, 0)).addScaledVector(side, travel * 0.12);
    this.flight = {
      curve: new THREE.QuadraticBezierCurve3(from, mid, to),
      fromLook: this.controls.target.clone(),
      look,
      duration: THREE.MathUtils.clamp(2.4 + travel / 45, 2.6, 6),
      playIndex,
      offset: focus?.offset,
      prev: from.clone(),
    };
    this.phase = 'flight';
    this.phaseT = 0;
    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  #updateFlight(dt) {
    const f = this.flight;
    const target = this.focusId && this.#currentPos(this.focusId);
    if (target) {
      f.look.copy(target);
      f.curve.v2.copy(target).add(f.offset);
    }
    const p = Math.min(1, this.phaseT / f.duration);
    // Hard acceleration, cruise at warp, then brake into orbit.
    const u = p < 0.6 ? 0.5 * Math.pow(p / 0.6, 3) : 0.5 + 0.5 * (1 - Math.pow(1 - (p - 0.6) / 0.4, 3));
    const pos = f.curve.getPoint(u);
    const speed = pos.distanceTo(f.prev) / Math.max(dt, 1e-3);
    f.prev.copy(pos);
    this.warp += (THREE.MathUtils.clamp(speed / 70, 0, 1) - this.warp) * Math.min(1, dt * 6);
    const lookT = THREE.MathUtils.smoothstep(Math.min(1, p * 1.7), 0, 1);
    this.camera.position.copy(pos);
    this.camera.lookAt(f.fromLook.clone().lerp(f.look, lookT));
    if (p >= 1) {
      this.phase = 'orbit';
      this.controls.target.copy(f.look);
      this.controls.enabled = this.active;
      this.controls.autoRotate = true;
      if (f.playIndex >= 0) this.#arrive(this.byId.get(this.focusId) ?? f.playIndex);
    }
  }

  #arrive(i) {
    const cl = CLUSTERS[this.tracks[i].cluster] || CLUSTERS.uncharted;
    this.pulsar.visible = true;
    this.pulsarColor = cl.color.clone();
    this.pulsarSize = this.sizes[i];
    this.pulsarAppear = 0.001;
    this.#emitRing(1.4);
  }

  // --- pulsar rings ---------------------------------------------------------------

  #emitRing(strength) {
    if (!this.pulsar.visible) return;
    const ring = this.rings.reduce((a, b) => (a.strength * (1 - a.age / (a.life || 1)) < b.strength * (1 - b.age / (b.life || 1)) ? a : b));
    Object.assign(ring, { age: 0, strength, speed: 5 + 22 * strength, life: 1.1 + 2.4 * strength });
    ring.mesh.visible = true;
    ring.mesh.position.copy(this.pulsar.position);
    ring.mesh.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
    ring.uniforms.uColor.value.copy(this.pulsarColor).lerp(new THREE.Color(1, 1, 1), 0.35 * Math.min(1, strength));
  }

  #updatePulsar(f, dt) {
    // Large sound differentials = short-term energy jumping above the recent trend.
    const e = f.level * 0.6 + f.bass * 0.4;
    this.fast += (e - this.fast) * Math.min(1, dt / 0.06);
    this.slow += (e - this.slow) * Math.min(1, dt / 2.2);
    const diff = this.fast - this.slow;
    this.cool -= dt;
    if (this.phase === 'orbit' || this.phase === 'overview') {
      if (f.sectionChanged && diff > 0) this.#emitRing(1.6);
      else if (this.cool <= 0 && diff > 0.05) {
        this.#emitRing(Math.min(1.6, (diff - 0.03) * 6));
        this.cool = 0.18;
      }
    }

    const R = this.starUniforms?.uRingR.value;
    const S = this.starUniforms?.uRingS.value;
    this.rings.forEach((r, k) => {
      if (!r.mesh.visible) return R && (S[k] = 0);
      r.age += dt;
      const life = 1 - r.age / r.life;
      if (life <= 0) {
        r.mesh.visible = false;
        if (S) S[k] = 0;
        return;
      }
      const radius = r.speed * r.age;
      r.mesh.scale.setScalar(Math.max(0.01, radius));
      r.uniforms.uAlpha.value = Math.pow(life, 1.5) * Math.min(1.2, 0.35 + r.strength);
      if (R) {
        R[k] = radius;
        S[k] = Math.pow(life, 1.5) * r.strength * 0.9;
      }
    });
    if (this.starUniforms) this.starUniforms.uRingCenter.value.copy(this.pulsar.position);

    if (!this.pulsar.visible) return;
    if (this.pulsarAppear < 1) this.pulsarAppear = Math.min(1, this.pulsarAppear + dt / 1.2);
    const a = this.pulsarAppear * this.pulsarAppear * (3 - 2 * this.pulsarAppear);
    const s = (0.6 + this.pulsarSize * 0.45) * a;
    this.pulsar.scale.setScalar(Math.max(0.001, s));
    this.pulsarCore.scale.setScalar(0.45 * (1 + f.beat * 0.5 + f.level * 0.3));
    this.pulsarCore.material.color.copy(this.pulsarColor).lerp(new THREE.Color(1, 1, 1), 0.6).multiplyScalar(1.5);
    this.pulsarGlow.material.color.copy(this.pulsarColor).multiplyScalar(0.6 + f.level);
    this.pulsarGlow.scale.setScalar(3.5 * (1 + f.bass * 0.8 + f.beat * 0.4));
    this.spin.rotation.y += ((f.tempo || 120) / 60) * Math.PI * dt; // half a turn per beat
    this.beamUniforms.uColor.value.copy(this.pulsarColor).lerp(new THREE.Color(1, 1, 1), 0.3);
    this.beamUniforms.uAlpha.value = (0.12 + f.beat * 0.35 + f.level * 0.25) * a;
  }

  // --- picking, labels, card --------------------------------------------------------

  #pick(px, py) {
    if (!this.tracks.length) return -1;
    this.camera.updateMatrixWorld();
    const m = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse).elements;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const scale = H / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
    let best = -1;
    let bestScore = Infinity;
    const P = this.positions;
    for (let i = 0; i < this.tracks.length; i++) {
      const x = P[i * 3];
      const y = P[i * 3 + 1];
      const z = P[i * 3 + 2];
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (w <= 0.1) continue;
      const sx = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w) * 0.5 + 0.5;
      const sy = (-(m[1] * x + m[5] * y + m[9] * z + m[13]) / w) * 0.5 + 0.5;
      const radius = Math.max(7, (this.sizes[i] * scale) / w / 3);
      const d = Math.hypot(sx * W - px, sy * H - py);
      if (d < radius && d / radius + w * 0.002 < bestScore) {
        best = i;
        bestScore = d / radius + w * 0.002;
      }
    }
    return best;
  }

  #setState(i, v) {
    if (i < 0 || !this.points) return;
    const a = this.points.geometry.attributes.aState;
    a.array[i] = v;
    a.needsUpdate = true;
  }

  #select(i) {
    this.#setState(this.selected, 0);
    this.selected = i;
    this.#setState(i, 1.2);
    if (i < 0) {
      this.el.card.hidden = true;
      return;
    }
    this.#renderCard(this.tracks[i]);
    const t = this.tracks[i];
    if (!t.art && t.spotify && this.handlers.onDetails) {
      this.handlers.onDetails(t).then((full) => {
        if (!full || this.tracks[this.selected]?.id !== t.id) return;
        Object.assign(t, full);
        this.#renderCard(t);
      }, () => {});
    }
  }

  #renderCard(t) {
    const cl = CLUSTERS[t.cluster] || CLUSTERS.uncharted;
    const hex = `#${cl.color.getHexString()}`;
    const art = t.art ? `<img src="${esc(t.art)}" alt="">` : `<div class="g-art" style="--c:${hex}">${esc((t.name || '?')[0])}</div>`;
    const rangeLabel = RANGES[this.range]?.label.toLowerCase() || '';
    const termLabel = { short_term: '4 weeks', medium_term: '6 months', long_term: '12 months' }[t.term];
    const link = t.spotify ? `<a class="g-btn" href="https://open.spotify.com/track/${esc(t.id)}" target="_blank" rel="noopener">Open in Spotify ↗</a>` : '';
    this.el.card.innerHTML = `
      <button class="g-close" data-act="close" aria-label="Close">×</button>
      ${art}
      <div class="g-title">${esc(t.name)}${t.id === this.playingId ? ' <span class="g-live">▶ playing</span>' : ''}</div>
      <div class="g-artist">${esc(t.artists?.join(', '))}${t.album ? ` · ${esc(t.album)}` : ''}</div>
      <div class="g-chips"><span style="border-color:${hex};color:${hex}">${esc(cl.name)}</span>${(t.genres || [t.micro]).filter(Boolean).slice(0, 3).map((g) => `<span>${esc(g)}</span>`).join('')}</div>
      <dl>
        <dt>Plays (${esc(rangeLabel === 'all time' ? 'all time' : `last ${rangeLabel}`)})</dt><dd>${t.plays.toLocaleString()}</dd>
        <dt>All tracked plays</dt><dd>${(t.allPlays || t.plays).toLocaleString()}</dd>
        <dt>Last played</dt><dd>${ago(t.lastPlayed)}</dd>
        ${t.rank ? `<dt>Your top tracks</dt><dd>#${t.rank} (${termLabel})</dd>` : ''}
      </dl>
      <div class="g-actions"><button class="g-btn" data-act="fly">Fly here</button>${link}</div>`;
    this.el.card.hidden = false;
  }

  #buildLabels() {
    const groups = new Map();
    this.tracks.forEach((t) => {
      const key = `${t.cluster}/${t.micro}`;
      const g = groups.get(key) || { cluster: t.cluster, micro: t.micro, n: 0 };
      g.n++;
      groups.set(key, g);
    });
    const clusters = new Set(this.tracks.map((t) => t.cluster));
    this.labels = [];
    for (const id of clusters) {
      const cl = CLUSTERS[id] || CLUSTERS.uncharted;
      const pos = cl.halo ? new THREE.Vector3(0, 2, 58) : cl.center.clone().add(new THREE.Vector3(0, 0, 5.5));
      this.labels.push({ pos, text: cl.name, kind: 'cluster', color: cl.color });
    }
    [...groups.values()]
      .filter((g) => g.micro && g.n >= 3 && g.cluster !== 'uncharted')
      .sort((a, b) => b.n - a.n)
      .slice(0, 60)
      .forEach((g) => this.labels.push({ pos: microCenter(g.cluster, g.micro).add(new THREE.Vector3(0, 1.6, 0)), text: g.micro, kind: 'micro' }));
    this.el.labels.innerHTML = this.labels
      .map((l) => `<div class="g-label ${l.kind}" ${l.color ? `style="color:#${l.color.getHexString()}"` : ''}>${esc(l.text)}</div>`)
      .join('');
    this.labels.forEach((l, i) => (l.el = this.el.labels.children[i]));
  }

  #updateLabels() {
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const v = new THREE.Vector3();
    for (const l of this.labels || []) {
      v.copy(l.pos).project(this.camera);
      const dist = this.camera.position.distanceTo(l.pos);
      const opacity =
        v.z > 1 ? 0 : l.kind === 'cluster' ? THREE.MathUtils.clamp((dist - 8) / 14, 0, 0.9) : THREE.MathUtils.clamp((26 - dist) / 8, 0, 0.85);
      l.el.style.opacity = opacity;
      if (opacity > 0) l.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px) translate(-50%, -50%)`;
    }
  }

  #updateHover() {
    if (!this.pointer || this.#busy()) {
      if (this.hovered >= 0) this.#setState(this.hovered, this.hovered === this.selected ? 1.2 : 0);
      this.hovered = -1;
      this.el.tip.hidden = true;
      this.canvas.style.cursor = '';
      return;
    }
    const i = this.#pick(this.pointer.x, this.pointer.y);
    if (i !== this.hovered) {
      if (this.hovered >= 0 && this.hovered !== this.selected) this.#setState(this.hovered, 0);
      this.hovered = i;
      if (i >= 0 && i !== this.selected) this.#setState(i, 0.7);
    }
    this.canvas.style.cursor = i >= 0 ? 'pointer' : '';
    if (i < 0) {
      this.el.tip.hidden = true;
      return;
    }
    const t = this.tracks[i];
    this.el.tip.hidden = false;
    this.el.tip.innerHTML = `<b>${esc(t.name)}</b> · ${esc(t.artists?.[0])}<span>${t.plays ? `${t.plays} plays` : t.rank ? `top #${t.rank}` : ''}</span>`;
    this.el.tip.style.transform = `translate(${this.pointer.x + 14}px, ${this.pointer.y + 14}px)`;
  }

  // --- frame -------------------------------------------------------------------------

  update(f, dt, t) {
    this.phaseT = (this.phaseT || 0) + dt;

    if (this.morph < 1 && this.positions) {
      this.morph = Math.min(1, this.morph + dt / 2.5);
      const k = this.morph * this.morph * (3 - 2 * this.morph);
      for (let i = 0; i < this.positions.length; i++) this.positions[i] = this.from[i] + (this.to[i] - this.from[i]) * k;
      this.points.geometry.attributes.position.needsUpdate = true;
    }

    if (this.phase === 'launch') {
      // Hold on the song card, easing back as if bracing for the jump.
      this.camera.position.lerp(this.controls.target, -dt * 0.03);
      this.camera.lookAt(this.controls.target);
      if (this.phaseT > 2.4) {
        this.el.launch.className = 'g-launch leave';
        const i = this.byId.get(this.pendingId);
        if (i !== undefined) this.#flyTo(i, true);
        else this.phase = 'orbit';
      }
    } else if (this.phase === 'flight') {
      this.#updateFlight(dt);
      if (this.phaseT > 1.2 && this.el.launch.classList.contains('leave')) this.el.launch.hidden = true;
    } else {
      const focus = this.phase === 'orbit' && this.focusId && this.#currentPos(this.focusId);
      if (focus) {
        const delta = focus.sub(this.controls.target);
        this.camera.position.add(delta);
        this.controls.target.add(delta);
      }
      this.warp += (0 - this.warp) * Math.min(1, dt * 3);
      if (this.controls.enabled) this.controls.update(dt);
    }

    const playingPos = this.#currentPos(this.playingId);
    if (playingPos) this.pulsar.position.copy(playingPos);
    this.#updateWarp(dt);
    this.#updatePulsar(f, dt);
    this.camera.fov = 55 + this.warp * 30;
    this.camera.updateProjectionMatrix();

    if (this.starUniforms) {
      this.starUniforms.uTime.value = t;
      this.starUniforms.uScale.value = this.canvas.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
    }
    if (this.active) {
      this.#updateHover();
      this.#updateLabels();
    }
  }

  #updateWarp(dt) {
    const w = this.warp;
    this.warpLines.material.opacity = w;
    this.warpLines.visible = w > 0.01;
    if (!this.warpLines.visible) return;
    const pos = this.warpLines.geometry.attributes.position.array;
    const len = 0.3 + w * 22;
    this.streaks.forEach((s, i) => {
      s.z += (20 + w * 520) * dt;
      if (s.z > -1) s.z -= 120;
      pos.set([s.x, s.y, s.z, s.x, s.y, s.z - len], i * 6);
    });
    this.warpLines.geometry.attributes.position.needsUpdate = true;
  }
}
