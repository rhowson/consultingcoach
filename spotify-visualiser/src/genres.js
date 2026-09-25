// Genre → place in the galaxy.
//
// Spotify tags artists with thousands of micro-genres ("uk garage",
// "bedroom pop"). We fold them into a dozen constellations laid out along two
// spiral arms, keep the micro-genre as a sub-cluster inside its
// constellation, and scatter each song around that using a hash of its id.
// Everything is deterministic, so a song's star never moves between sessions.

import * as THREE from 'three';

// Order matters: the first rule that matches a genre string wins
// ("latin pop" is Latin, "indie rock" is Indie, "metalcore" is Metal).
const RULES = [
  ['latin', /latin|reggaeton|salsa|bachata|cumbia|samba|brazil|mpb|corrido|urbano|tango|flamenco/],
  ['world', /reggae|dancehall|afro|amapiano|ska\b|\bdub\b|world|k-?indie|bollywood|desi|arab|celtic/],
  ['hiphop', /hip ?hop|rap|trap|drill|grime|boom bap/],
  ['rnb', /r&b|rnb|soul|funk|motown|gospel|quiet storm/],
  ['metal', /metal|core\b|djent|grindcore/],
  ['jazz', /jazz|blues|swing|bebop|bossa|big band/],
  ['classical', /classical|orchestr|baroque|opera|soundtrack|score|compositional|choral|romantic era|minimalism/],
  ['folk', /folk|country|americana|bluegrass|singer-songwriter|acoustic/],
  ['electronic', /house|techno|edm|electro|trance|dubstep|drum and bass|dnb|garage|ambient|idm|synth|dance|bass music|downtempo|breakbeat|hardstyle|chillwave|lo-?fi|jungle|disco/],
  ['indie', /indie|alternative|\balt\b|bedroom|dream pop|shoegaze|post-punk/],
  ['rock', /rock|punk|grunge|emo\b|britpop/],
  ['pop', /pop|boy band|girl group|idol|teen/],
];

// [id, display name, colour, arm, slot along the arm]
const LAYOUT = [
  ['pop', 'Pop', '#7cff9e', 0, 0],
  ['indie', 'Indie', '#ff8a5b', 0, 1],
  ['rock', 'Rock', '#ff2e88', 0, 2],
  ['metal', 'Metal', '#ff4d4d', 0, 3],
  ['folk', 'Folk & Country', '#e0b36a', 0, 4],
  ['classical', 'Classical', '#e8f0ff', 0, 5],
  ['hiphop', 'Hip hop', '#ffd166', 1, 0],
  ['rnb', 'R&B & Soul', '#c77dff', 1, 1],
  ['electronic', 'Electronic', '#00e5ff', 1, 2],
  ['latin', 'Latin', '#ff9f1c', 1, 3],
  ['world', 'Reggae & World', '#4ade80', 1, 4],
  ['jazz', 'Jazz & Blues', '#8b9cff', 1, 5],
];

export function armPoint(r, arm, offset = 0) {
  const a = arm * Math.PI + r * 0.11 + offset;
  return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
}

export const CLUSTERS = Object.fromEntries(
  LAYOUT.map(([id, name, color, arm, slot]) => [id, { id, name, color: new THREE.Color(color), center: armPoint(11 + slot * 6.6, arm) }]),
);
// Songs we can't place yet (no genre info) drift in a halo at the rim.
CLUSTERS.uncharted = { id: 'uncharted', name: 'Uncharted', color: new THREE.Color('#9aa3b8'), center: new THREE.Vector3(0, 0, 0), halo: true };

export function classify(genres = []) {
  const votes = new Map();
  const firstMicro = new Map();
  for (const g of genres) {
    const rule = RULES.find(([, re]) => re.test(g));
    if (!rule) continue;
    votes.set(rule[0], (votes.get(rule[0]) || 0) + 1);
    if (!firstMicro.has(rule[0])) firstMicro.set(rule[0], g);
  }
  if (!votes.size) return { cluster: genres.length ? 'world' : 'uncharted', micro: genres[0] || '' };
  const cluster = [...votes].sort((a, b) => b[1] - a[1])[0][0];
  return { cluster, micro: firstMicro.get(cluster) };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed) {
  let s = seed || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  return Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
}

export function microCenter(clusterId, micro) {
  const c = CLUSTERS[clusterId] || CLUSTERS.uncharted;
  const rand = seededRandom(hash(`${clusterId}/${micro}`));
  if (c.halo) {
    const a = rand() * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 56, (rand() - 0.5) * 6, Math.sin(a) * 56);
  }
  const a = rand() * Math.PI * 2;
  const r = micro ? 0.8 + rand() * 3 : 0;
  return c.center.clone().add(new THREE.Vector3(Math.cos(a) * r, (rand() - 0.5) * 1.2, Math.sin(a) * r));
}

export function starPosition(trackId, clusterId, micro) {
  const rand = seededRandom(hash(trackId));
  const uncharted = !CLUSTERS[clusterId] || clusterId === 'uncharted';
  const spread = uncharted ? 2 : 1.15;
  return microCenter(uncharted ? 'uncharted' : clusterId, uncharted ? trackId : micro).add(new THREE.Vector3(gaussian(rand) * spread, gaussian(rand) * 0.4, gaussian(rand) * spread));
}
