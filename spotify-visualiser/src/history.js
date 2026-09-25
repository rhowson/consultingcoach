// Listening history, stored in the browser (IndexedDB).
//
// Spotify's API has no play counts, so we build our own from three sources:
//   - live:   a play is counted while the visualiser is open (after 30 s)
//   - recent: /me/player/recently-played (last 50 plays) fills gaps on launch
//   - import: Spotify's downloadable streaming history, for years of plays
// Top tracks (4 weeks / 6 months / 12 months) seed the galaxy on day one.

import { classify } from './genres.js';

const MIN_PLAY_MS = 30000;
const DAY = 86400000;

export const RANGES = {
  '4w': { days: 28, term: 'short_term', label: '4 weeks' },
  '6m': { days: 182, term: 'medium_term', label: '6 months' },
  '12m': { days: 365, term: 'long_term', label: '12 months' },
  all: { days: Infinity, term: 'long_term', label: 'All time' },
};

const request = (r) =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
const complete = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function trackFromSpotify(item) {
  const images = item.album?.images || [];
  return {
    id: item.id,
    name: item.name,
    artists: (item.artists || []).map((a) => a.name),
    artistId: item.artists?.[0]?.id || null,
    album: item.album?.name || '',
    art: (images[1] || images[0])?.url || '',
    durationMs: item.duration_ms || 0,
    spotify: true,
  };
}

export class History {
  async open() {
    const r = indexedDB.open('sv-history', 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore('tracks', { keyPath: 'id' });
      db.createObjectStore('plays', { keyPath: 'key' }).createIndex('trackId', 'trackId');
      db.createObjectStore('artists', { keyPath: 'key' });
    };
    this.db = await request(r);
  }

  #store(name, mode = 'readonly') {
    return this.db.transaction(name, mode).objectStore(name);
  }

  #get(store, key) {
    return request(this.#store(store).get(key));
  }

  #put(store, value) {
    return request(this.#store(store, 'readwrite').put(value));
  }

  #all(store) {
    return request(this.#store(store).getAll());
  }

  // Everything the galaxy needs for one time range.
  // `includeId`: always include this track (the one playing now), even with no plays yet.
  async load(range = 'all', includeId = null) {
    const [tracks, plays] = await Promise.all([this.#all('tracks'), this.#all('plays')]);
    const { days, term } = RANGES[range];
    const since = Date.now() - days * DAY;
    const counts = new Map();
    let totalPlays = 0;
    for (const p of plays) {
      let c = counts.get(p.trackId);
      if (!c) counts.set(p.trackId, (c = { inRange: 0, all: 0, last: 0 }));
      c.all++;
      c.last = Math.max(c.last, p.playedAt);
      if (p.playedAt >= since) {
        c.inRange++;
        totalPlays++;
      }
    }
    const out = [];
    for (const t of tracks) {
      const c = counts.get(t.id);
      const rank = t.top?.[term] || 0;
      if (!c?.inRange && !rank && t.id !== includeId) continue;
      out.push({ ...t, plays: c?.inRange || 0, allPlays: c?.all || 0, lastPlayed: c?.last || 0, rank, term });
    }
    return { tracks: out, totalPlays, range, pending: tracks.filter((t) => !t.resolved).length };
  }

  async stats() {
    const [tracks, plays] = await Promise.all([request(this.#store('tracks').count()), request(this.#store('plays').count())]);
    return { tracks, plays };
  }

  // --- genres ----------------------------------------------------------------

  async #artistGenres(spotify, id, name) {
    const key = id ? `id:${id}` : `name:${name.toLowerCase()}`;
    const cached = await this.#get('artists', key);
    if (cached) return cached.genres;
    const artist = id ? await spotify.artist(id) : await spotify.searchArtist(name);
    const genres = artist?.genres || [];
    await this.#put('artists', { key, id: artist?.id || id, name, genres });
    return genres;
  }

  async #resolve(spotify, t) {
    const genres = await this.#artistGenres(spotify, t.artistId, t.artists[0] || '');
    Object.assign(t, classify(genres), { genres: genres.slice(0, 4), resolved: true });
  }

  // Find genres for tracks we haven't placed yet, most-played first, so the
  // brightest stars leave the Uncharted rim first. Rate-limit friendly.
  async resolvePending(spotify, onProgress) {
    if (this.resolving) return;
    this.resolving = true;
    try {
      const { tracks } = await this.load('all');
      const all = await this.#all('tracks');
      const weight = new Map(tracks.map((t) => [t.id, t.allPlays + (t.rank ? 50 - t.rank : 0)]));
      const pending = all.filter((t) => !t.resolved).sort((a, b) => (weight.get(b.id) || 0) - (weight.get(a.id) || 0));
      let done = 0;
      for (const t of pending) {
        try {
          await this.#resolve(spotify, t);
        } catch (err) {
          if (err.status === 429) {
            await sleep((err.retryAfter || 5) * 1000);
            continue;
          }
          if (!err.status) break; // offline: try again next launch
          Object.assign(t, { cluster: 'uncharted', micro: '', resolved: true });
        }
        await this.#put('tracks', t);
        done++;
        if (done % 15 === 0) onProgress?.(pending.length - done);
        await sleep(120);
      }
      onProgress?.(0);
    } finally {
      this.resolving = false;
    }
  }

  // --- recording -------------------------------------------------------------

  async #upsert(item, top) {
    const existing = await this.#get('tracks', item.id);
    const t = { cluster: 'uncharted', micro: '', ...existing, ...trackFromSpotify(item), top: { ...existing?.top, ...top } };
    await this.#put('tracks', t);
    return t;
  }

  // The track that just started: make sure it exists and has a genre.
  async trackStarted(spotify, item) {
    const t = await this.#upsert(item);
    if (!t.resolved) {
      try {
        await this.#resolve(spotify, t);
        await this.#put('tracks', t);
      } catch {
        /* stays Uncharted for now */
      }
    }
    return t;
  }

  // Returns false when the play is already known (same listen from another source).
  async recordPlay(trackId, playedAt, source, durationMs = 240000) {
    const key = `${trackId}@${playedAt}`;
    const existing = await request(this.#store('plays').index('trackId').getAll(trackId));
    const window = durationMs + 180000;
    if (existing.some((p) => p.key === key || (p.source !== source && Math.abs(p.playedAt - playedAt) < window))) return false;
    await this.#put('plays', { key, trackId, playedAt, source });
    return true;
  }

  async syncRecent(spotify) {
    const res = await spotify.recentlyPlayed();
    let added = 0;
    for (const it of res?.items || []) {
      if (!it.track?.id) continue;
      await this.#upsert(it.track);
      if (await this.recordPlay(it.track.id, Date.parse(it.played_at), 'recent', it.track.duration_ms)) added++;
    }
    return added;
  }

  async syncTop(spotify) {
    for (const term of ['short_term', 'medium_term', 'long_term']) {
      const res = await spotify.topTracks(term);
      const ranked = new Map((res?.items || []).map((item, i) => [item.id, i + 1]));
      // Clear stale ranks for this term, then apply the new ones.
      for (const t of await this.#all('tracks')) {
        if (t.top?.[term] && !ranked.has(t.id)) {
          delete t.top[term];
          await this.#put('tracks', t);
        }
      }
      for (const item of res?.items || []) await this.#upsert(item, { [term]: ranked.get(item.id) });
    }
  }

  // Spotify account → Privacy → "Download your data". Accepts both the
  // "Extended streaming history" files (ts, spotify_track_uri, …) and the
  // basic "Account data" StreamingHistory files (endTime, artistName, …).
  async importFiles(files) {
    const rows = [];
    for (const f of files) {
      const data = JSON.parse(await f.text());
      if (Array.isArray(data)) rows.push(...data);
    }
    const known = new Set((await this.#all('tracks')).map((t) => t.id));
    const seen = new Map();
    for (const p of await this.#all('plays')) {
      if (!seen.has(p.trackId)) seen.set(p.trackId, []);
      seen.get(p.trackId).push(p.playedAt);
    }
    const newTracks = new Map();
    const newPlays = [];
    for (const r of rows) {
      const name = r.master_metadata_track_name ?? r.trackName;
      const artist = r.master_metadata_album_artist_name ?? r.artistName;
      const ms = r.ms_played ?? r.msPlayed ?? 0;
      const ts = r.ts ? Date.parse(r.ts) : r.endTime ? Date.parse(`${r.endTime.replace(' ', 'T')}Z`) : NaN;
      if (!name || !artist || ms < MIN_PLAY_MS || !ts) continue;
      const uri = r.spotify_track_uri || '';
      const id = uri.startsWith('spotify:track:') ? uri.slice(14) : `local:${artist.toLowerCase()}|${name.toLowerCase()}`;
      if (!known.has(id) && !newTracks.has(id)) {
        newTracks.set(id, {
          id,
          name,
          artists: [artist],
          artistId: null,
          album: r.master_metadata_album_album_name || '',
          art: '',
          durationMs: 0,
          spotify: !id.startsWith('local:'),
          cluster: 'uncharted',
          micro: '',
          top: {},
        });
      }
      const prior = seen.get(id) || [];
      if (prior.some((p) => Math.abs(p - ts) < 6 * 60000)) continue; // already counted
      prior.push(ts);
      seen.set(id, prior);
      newPlays.push({ key: `${id}@${ts}`, trackId: id, playedAt: ts, source: 'import' });
    }
    const tx = this.db.transaction(['tracks', 'plays'], 'readwrite');
    newTracks.forEach((t) => tx.objectStore('tracks').put(t));
    newPlays.forEach((p) => tx.objectStore('plays').put(p));
    await complete(tx);
    return { tracks: newTracks.size, plays: newPlays.length };
  }

  // Fill in album art etc. for a star that came from an import.
  async enrich(spotify, t) {
    if (!t.spotify || t.art) return t;
    const item = await spotify.track(t.id);
    const stored = await this.#get('tracks', t.id);
    const updated = { ...stored, ...trackFromSpotify(item) };
    await this.#put('tracks', updated);
    return { ...t, ...trackFromSpotify(item) };
  }

  async clear() {
    const tx = this.db.transaction(['tracks', 'plays', 'artists'], 'readwrite');
    ['tracks', 'plays', 'artists'].forEach((s) => tx.objectStore(s).clear());
    await complete(tx);
  }
}

// ---------------------------------------------------------------------------
// A made-up library so the galaxy works before Spotify is connected.

const MICROS = {
  pop: ['dance pop', 'synth-pop', 'art pop', 'k-pop'],
  indie: ['indie rock', 'bedroom pop', 'dream pop', 'indie folk'],
  rock: ['classic rock', 'alt rock', 'punk', 'garage rock'],
  metal: ['metalcore', 'doom metal', 'thrash metal'],
  folk: ['country', 'americana', 'folk'],
  classical: ['baroque', 'minimalism', 'film score'],
  hiphop: ['uk drill', 'boom bap', 'trap', 'conscious hip hop'],
  rnb: ['neo soul', 'alternative r&b', 'funk'],
  electronic: ['uk garage', 'techno', 'deep house', 'drum and bass', 'ambient'],
  latin: ['reggaeton', 'latin pop', 'bossa nova'],
  world: ['afrobeats', 'reggae', 'amapiano'],
  jazz: ['bebop', 'jazz fusion', 'blues'],
};
const TASTE = { electronic: 1, indie: 0.8, hiphop: 0.7, pop: 0.5, rnb: 0.4, rock: 0.35, jazz: 0.3, folk: 0.15, classical: 0.15, latin: 0.15, world: 0.2, metal: 0.1 };
const WORDS_A = ['Midnight', 'Neon', 'Golden', 'Paper', 'Velvet', 'Electric', 'Silver', 'Hollow', 'Crystal', 'Ocean', 'Static', 'Lunar', 'Wild', 'Quiet', 'Burning', 'Northern'];
const WORDS_B = ['Drive', 'Hearts', 'Coast', 'Signals', 'Rain', 'Echoes', 'Gardens', 'Lights', 'Machines', 'Waves', 'Summer', 'Ghosts', 'Satellites', 'Dreams', 'Motion', 'Fire'];

export function demoLibrary() {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const clusters = Object.keys(TASTE);
  const total = clusters.reduce((a, c) => a + TASTE[c], 0);
  const artists = Array.from({ length: 140 }, (_, i) => {
    let x = rand() * total;
    const cluster = clusters.find((c) => (x -= TASTE[c]) <= 0) || 'pop';
    return { name: `${pick(WORDS_A)} ${pick(WORDS_B)}${i % 3 ? '' : ' Club'}`, cluster, micro: pick(MICROS[cluster]) };
  });
  const tracks = Array.from({ length: 700 }, (_, i) => {
    const a = artists[Math.floor(Math.pow(rand(), 1.4) * artists.length)];
    const plays = Math.floor(1 + 140 * Math.pow(rand(), 5));
    return {
      id: `demo:${i}`,
      name: `${pick(WORDS_A)} ${pick(WORDS_B)}`,
      artists: [a.name],
      album: `${pick(WORDS_B)} (Deluxe)`,
      art: '',
      cluster: a.cluster,
      micro: a.micro,
      genres: [a.micro],
      plays,
      allPlays: plays,
      lastPlayed: Date.now() - rand() * 300 * DAY,
      rank: 0,
      demo: true,
    };
  });
  return { tracks, totalPlays: tracks.reduce((a, t) => a + t.plays, 0), range: '12m', pending: 0, demo: true };
}

