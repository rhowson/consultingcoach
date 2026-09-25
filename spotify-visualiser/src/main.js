import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { AnalysisSource, DemoSource, LiveSource, clearEvents, createFrame } from './audio.js';
import { Spotify } from './spotify.js';
import { analyseArtwork, loadImage, proceduralArtwork } from './palette.js';
import { TerrainScene } from './scenes/terrain.js';
import { AlbumScene } from './scenes/album.js';
import { HarmonicScene } from './scenes/harmonic.js';

const $ = (id) => document.getElementById(id);
const AUTO_CYCLE_MIN_SECONDS = 20;

// --- Rendering -------------------------------------------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const pixelRatio = Math.min(devicePixelRatio, 2);
renderer.setPixelRatio(pixelRatio);
$('stage').appendChild(renderer.domElement);

const scenes = [new TerrainScene(), new AlbumScene(), new HarmonicScene()];
scenes[1].setPixelRatio(pixelRatio);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scenes[0].scene, scenes[0].camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 0.3);
composer.addPass(renderPass);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  for (const s of scenes) {
    s.camera.aspect = w / h;
    s.camera.updateProjectionMatrix();
  }
}
addEventListener('resize', resize);
resize();

// --- State -----------------------------------------------------------------

const spotify = new Spotify();
const live = new LiveSource();
const demo = new DemoSource();
const frame = createFrame();
const state = {
  scene: 0,
  lastSwitch: 0,
  autoCycle: true,
  analysis: null, // AnalysisSource for the current Spotify track
  playback: null, // { id, progress, at, playing }
};

function spotifyPosition() {
  const p = state.playback;
  if (!p) return 0;
  return p.progress + (p.playing ? (performance.now() - p.at) / 1000 : 0);
}

// Which source drives beats / bars / sections / chroma this frame.
function timeline() {
  if (state.analysis && state.playback?.playing) return state.analysis;
  if (live.active) return null;
  return demo;
}

function applyArtwork(art) {
  for (const s of scenes) {
    s.setPalette(art.colors);
    s.setArtwork?.(art);
  }
  const accent = `#${art.colors[0].getHexString()}`;
  document.documentElement.style.setProperty('--accent', accent);
}
applyArtwork(proceduralArtwork());

// --- Scenes & HUD ----------------------------------------------------------

function showScene(i, now = performance.now() / 1000) {
  state.scene = (i + scenes.length) % scenes.length;
  state.lastSwitch = now;
  const s = scenes[state.scene];
  const fade = $('fade');
  fade.classList.add('on');
  setTimeout(() => {
    renderPass.scene = s.scene;
    renderPass.camera = s.camera;
    fade.classList.remove('on');
  }, 220);
  $('scene-name').textContent = s.name;
  $('scene-blurb').textContent = s.blurb;
  const caption = $('caption');
  caption.classList.remove('show');
  void caption.offsetWidth;
  caption.classList.add('show');
  document.querySelectorAll('[data-scene]').forEach((b) => b.classList.toggle('active', Number(b.dataset.scene) === state.scene));
}

function updateSourceLabel() {
  const tl = timeline();
  const parts = [];
  if (state.playback) parts.push('Spotify');
  if (tl === state.analysis && tl) parts.push('beat-synced analysis');
  if (live.active) parts.push(live.kind);
  if (tl === demo) parts.push(state.playback ? 'simulated (add live audio)' : 'demo signal');
  $('source').textContent = parts.join(' · ');
}

function setMessage(text) {
  $('message').textContent = text || '';
  $('message').hidden = !text;
}

// --- Spotify polling -------------------------------------------------------

async function onTrackChange(item) {
  state.analysis = null;
  $('track-title').textContent = item.name;
  $('track-artist').textContent = (item.artists || []).map((a) => a.name).join(', ');
  const images = item.album?.images || [];
  const art = images[1] || images[0];
  $('track-art').src = art?.url || '';
  $('track').hidden = false;

  if (art) {
    try {
      applyArtwork(analyseArtwork(await loadImage(art.url)));
    } catch {
      /* CORS or network issue: keep the current palette */
    }
  }
  if (item.type === 'track') {
    const analysis = await spotify.audioAnalysis(item.id);
    if (state.playback?.id !== item.id) return; // track changed while loading
    state.analysis = analysis ? new AnalysisSource(analysis) : null;
    if (!analysis && spotify.analysisBlocked && !live.active) {
      setMessage('This Spotify app cannot use audio-analysis. Add live audio (capture the Spotify tab, or the mic) so the visuals follow the real sound.');
    }
  }
}

async function pollSpotify() {
  let delay = 2500;
  try {
    const data = await spotify.currentlyPlaying();
    if (!data?.item) {
      state.playback = null;
      $('track').hidden = true;
    } else {
      const changed = state.playback?.id !== data.item.id;
      state.playback = { id: data.item.id, progress: data.progress_ms / 1000, at: performance.now(), playing: data.is_playing };
      if (changed) onTrackChange(data.item);
    }
  } catch (err) {
    if (err.status === 429) delay = 10000;
    else if (err.status === 403)
      setMessage('Spotify refused access. In development mode your account must be added under User Management in the Spotify Developer Dashboard.');
    else setMessage(err.message);
    if (!spotify.loggedIn) return updateSpotifyUi();
  }
  setTimeout(pollSpotify, delay);
}

function updateSpotifyUi() {
  $('client-id').value = spotify.clientId;
  $('redirect-uri').textContent = spotify.redirectUri;
  $('connect').textContent = spotify.loggedIn ? 'Disconnect Spotify' : 'Connect Spotify';
  $('spotify-setup').hidden = spotify.loggedIn;
}

// --- Controls --------------------------------------------------------------

function closePanel() {
  $('panel').hidden = true;
}

$('connect').onclick = () => {
  if (spotify.loggedIn) {
    spotify.logout();
    state.playback = state.analysis = null;
    $('track').hidden = true;
    return updateSpotifyUi();
  }
  const id = $('client-id').value.trim();
  if (!id) return setMessage('Paste your Spotify app Client ID first.');
  spotify.login(id);
};

async function startLive(fn) {
  try {
    await fn();
    setMessage('');
    closePanel();
  } catch (err) {
    setMessage(err.message || String(err));
  }
}
$('use-capture').onclick = () => startLive(() => live.useCapture());
$('use-mic').onclick = () => startLive(() => live.useMic());
$('file').onchange = (e) => e.target.files[0] && startLive(() => live.useFile(e.target.files[0]));
$('use-demo').onclick = () => {
  live.stop();
  closePanel();
};
$('open-panel').onclick = () => ($('panel').hidden = false);
$('close-panel').onclick = closePanel;

document.querySelectorAll('[data-scene]').forEach((b) => (b.onclick = () => showScene(Number(b.dataset.scene))));
$('auto').onclick = () => {
  state.autoCycle = !state.autoCycle;
  $('auto').classList.toggle('active', state.autoCycle);
};

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key >= '1' && e.key <= String(scenes.length)) showScene(Number(e.key) - 1);
  else if (e.key === 'ArrowRight' || e.key === ' ') showScene(state.scene + 1);
  else if (e.key === 'ArrowLeft') showScene(state.scene - 1);
  else if (e.key === 'a') $('auto').click();
  else if (e.key === 'h') document.body.classList.toggle('hide-hud');
  else if (e.key === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});

// --- Main loop -------------------------------------------------------------

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  const now = performance.now() / 1000;

  clearEvents(frame);
  const tl = timeline();
  const pos = tl === demo ? t : spotifyPosition();
  tl?.apply(frame, pos);
  if (live.active) live.apply(frame, dt, now, !tl);

  if (state.autoCycle && frame.sectionChanged && now - state.lastSwitch > AUTO_CYCLE_MIN_SECONDS) showScene(state.scene + 1, now);

  const active = scenes[state.scene];
  active.update(frame, dt, t, tl, pos);
  bloom.strength = 0.45 + frame.level * 0.4 + frame.beat * 0.3;
  composer.render(dt);

  $('beat').style.transform = `scale(${1 + frame.beat * 0.8})`;
  requestAnimationFrame(tick);
}

// Refresh the source label twice a second rather than every frame.
setInterval(updateSourceLabel, 500);

async function init() {
  updateSpotifyUi();
  try {
    await spotify.handleRedirect();
  } catch (err) {
    setMessage(err.message);
  }
  updateSpotifyUi();
  if (spotify.loggedIn) pollSpotify();
  showScene(0);
  requestAnimationFrame(tick);
}
init();
