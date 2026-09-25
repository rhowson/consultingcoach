// Album-art analysis: a glow-friendly colour palette plus raw pixels, which
// the Album Cosmos scene turns into particles.

import * as THREE from 'three';

export const ART_SIZE = 128;
export const DEFAULT_COLORS = ['#ff2e88', '#7b2ff7', '#00e5ff', '#ffd166'];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function analyseArtwork(source) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ART_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, ART_SIZE, ART_SIZE);
  const pixels = ctx.getImageData(0, 0, ART_SIZE, ART_SIZE).data;
  return { colors: extractPalette(pixels), pixels, size: ART_SIZE };
}

function extractPalette(pixels) {
  // Quantise to 4 bits per channel and score buckets by how common *and*
  // vivid they are: dull dominant colours make for dull visuals.
  const buckets = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    const key = ((pixels[i] >> 4) << 8) | ((pixels[i + 1] >> 4) << 4) | (pixels[i + 2] >> 4);
    const b = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    b.r += pixels[i];
    b.g += pixels[i + 1];
    b.b += pixels[i + 2];
    b.n++;
    buckets.set(key, b);
  }
  const hsl = {};
  const ranked = [...buckets.values()]
    .map((b) => {
      const c = new THREE.Color(b.r / b.n / 255, b.g / b.n / 255, b.b / b.n / 255);
      c.getHSL(hsl);
      return { c, score: b.n * (0.1 + hsl.s) * (0.15 + Math.min(hsl.l, 1 - hsl.l)) };
    })
    .sort((a, b) => b.score - a.score);

  const picked = [];
  for (const { c } of ranked) {
    if (picked.every((p) => colorDistance(p, c) > 0.3)) picked.push(c);
    if (picked.length === 4) break;
  }
  while (picked.length < 4) {
    const base = picked[0] || new THREE.Color(DEFAULT_COLORS[0]);
    picked.push(base.clone().offsetHSL(0.18 * picked.length, 0, 0));
  }
  // Boost towards neon so the colours read well under bloom.
  return picked.map((c) => {
    c.getHSL(hsl);
    return new THREE.Color().setHSL(hsl.h, Math.max(hsl.s, 0.6), Math.min(Math.max(hsl.l, 0.5), 0.65));
  });
}

function colorDistance(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

// Stand-in artwork for when nothing is playing on Spotify.
export function proceduralArtwork() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ART_SIZE;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, ART_SIZE, ART_SIZE);
  bg.addColorStop(0, '#12002b');
  bg.addColorStop(1, '#2b0033');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ART_SIZE, ART_SIZE);
  DEFAULT_COLORS.forEach((color, i) => {
    const r = ART_SIZE * (0.42 - i * 0.09);
    const g = ctx.createRadialGradient(64, 64, r * 0.6, 64, 64, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(64, 64, r, 0, Math.PI * 2);
    ctx.fill();
  });
  const art = analyseArtwork(canvas);
  art.colors = DEFAULT_COLORS.map((c) => new THREE.Color(c));
  return art;
}
