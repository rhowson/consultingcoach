// Audio feature extraction.
//
// Every source writes into one shared "frame" object, so scenes never care
// where the music data came from:
//   - AnalysisSource: Spotify's audio-analysis (beats / bars / sections /
//     segments) played back against the Spotify playback clock.
//   - LiveSource: real-time FFT from the mic, a captured tab, or a local file.
//   - DemoSource: a synthetic song so the visuals work with nothing connected.
//
// "Timeline" sources (analysis + demo) can also answer spectrumAt(time), which
// lets scenes look *ahead* in the song — something a live FFT can never do.

export const BINS = 64;
const F_MIN = 30;
const F_MAX = 16000;

// Centre frequency and pitch class of each log-spaced spectrum bin.
export const BIN_FREQ = Float32Array.from({ length: BINS }, (_, i) =>
  F_MIN * Math.pow(F_MAX / F_MIN, (i + 0.5) / BINS),
);
const BIN_PC = Int8Array.from(BIN_FREQ, (f) => pitchClass(f));
const BASS_END = BIN_FREQ.findIndex((f) => f > 150);
const MID_END = BIN_FREQ.findIndex((f) => f > 2000);

function pitchClass(freq) {
  return (((Math.round(12 * Math.log2(freq / 440) + 69)) % 12) + 12) % 12;
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function createFrame() {
  return {
    spectrum: new Float32Array(BINS), // 0..1, low → high frequency
    bass: 0,
    mid: 0,
    treble: 0,
    level: 0,
    beat: 0, // pulse: 1 on a beat, decays towards 0
    bar: 0, // pulse: 1 on a downbeat, decays towards 0
    beatPhase: 0, // 0..1 progress through the current beat
    barPhase: 0, // 0..1 progress through the current bar
    isBeat: false, // true for exactly one frame per beat
    isBar: false,
    sectionChanged: false,
    beatCount: 0,
    section: 0,
    chroma: new Float32Array(12), // pitch-class energy, index 0 = C
    tempo: 120,
  };
}

export function clearEvents(frame) {
  frame.isBeat = frame.isBar = frame.sectionChanged = false;
}

function mean(arr, from, to) {
  let s = 0;
  for (let i = from; i < to; i++) s += arr[i];
  return s / Math.max(1, to - from);
}

function bandsFromSpectrum(frame) {
  const s = frame.spectrum;
  frame.bass = mean(s, 0, BASS_END);
  frame.mid = mean(s, BASS_END, MID_END);
  frame.treble = mean(s, MID_END, BINS);
  frame.level = frame.bass * 0.45 + frame.mid * 0.4 + frame.treble * 0.15;
}

// Last index i with arr[i].start <= t, or -1.
function indexAt(arr, t) {
  let lo = 0;
  let hi = arr.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

// ---------------------------------------------------------------------------
// Spotify audio-analysis

export class AnalysisSource {
  constructor(analysis) {
    this.beats = analysis.beats ?? [];
    this.bars = analysis.bars ?? [];
    this.sections = analysis.sections ?? [];
    this.segments = analysis.segments ?? [];
    this.tempo = analysis.track?.tempo || 120;
    this.beatIdx = -1;
    this.barIdx = -1;
    this.sectionIdx = -1;
  }

  apply(frame, t) {
    const bi = indexAt(this.beats, t);
    if (bi !== this.beatIdx && bi >= 0) {
      frame.isBeat = true;
      frame.beatCount++;
    }
    this.beatIdx = bi;
    if (bi >= 0) {
      const b = this.beats[bi];
      frame.beat = Math.exp(-(t - b.start) * 7);
      frame.beatPhase = clamp01((t - b.start) / b.duration);
    }

    const ri = indexAt(this.bars, t);
    if (ri !== this.barIdx && ri >= 0) frame.isBar = true;
    this.barIdx = ri;
    if (ri >= 0) {
      const r = this.bars[ri];
      frame.bar = Math.exp(-(t - r.start) * 3);
      frame.barPhase = clamp01((t - r.start) / r.duration);
    }

    const si = indexAt(this.sections, t);
    if (si !== this.sectionIdx && this.sectionIdx !== -1) frame.sectionChanged = true;
    this.sectionIdx = si;
    frame.section = Math.max(0, si);
    frame.tempo = this.sections[si]?.tempo || this.tempo;

    const seg = this.segments[indexAt(this.segments, t)];
    if (seg?.pitches) {
      for (let i = 0; i < 12; i++) frame.chroma[i] += (seg.pitches[i] - frame.chroma[i]) * 0.3;
    }

    this.spectrumAt(t, frame.spectrum);
    bandsFromSpectrum(frame);
  }

  // Analysis has no real spectrum, so synthesise one from the segment's
  // loudness envelope, timbre (brightness) and pitch content.
  spectrumAt(t, out) {
    const si = indexAt(this.segments, t);
    if (si < 0) return out.fill(0);
    const seg = this.segments[si];
    const loud = segmentLoudness(seg, t);
    const timbre = seg.timbre ?? [];
    const pitches = seg.pitches ?? new Array(12).fill(0.5);
    const brightness = Math.min(0.85, Math.max(0.1, 0.32 + (timbre[1] || 0) / 320));

    const bi = indexAt(this.beats, t);
    const kick = bi >= 0 ? Math.exp(-(t - this.beats[bi].start) * 10) : 0;

    for (let b = 0; b < BINS; b++) {
      const x = b / (BINS - 1);
      const env = Math.exp(-((x - brightness) ** 2) / 0.065) * 0.75 + (1 - x) * 0.35;
      const tonal = 0.5 + 0.5 * pitches[BIN_PC[b]];
      const kickB = x < 0.16 ? kick * (1 - x / 0.16) * 0.7 : 0;
      out[b] = clamp01(loud * (env * tonal + kickB));
    }
    return out;
  }
}

function segmentLoudness(seg, t) {
  const dt = t - seg.start;
  const peakAt = Math.max(seg.loudness_max_time || 0, 1e-3);
  const end = seg.loudness_end ?? seg.loudness_start;
  const db =
    dt < peakAt
      ? seg.loudness_start + (seg.loudness_max - seg.loudness_start) * (dt / peakAt)
      : seg.loudness_max + (end - seg.loudness_max) * clamp01((dt - peakAt) / Math.max(seg.duration - peakAt, 1e-3));
  return clamp01((db + 42) / 42);
}

// ---------------------------------------------------------------------------
// Live audio (mic / tab capture / local file)

export class LiveSource {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.kind = null;
  }

  get active() {
    return !!this.analyser;
  }

  #context() {
    this.ctx ??= new AudioContext();
    this.ctx.resume();
    return this.ctx;
  }

  async useMic() {
    const ctx = this.#context();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.#attach(ctx.createMediaStreamSource(stream), 'Microphone', false, { stream });
  }

  // Chrome/Edge: pick the tab playing Spotify (open.spotify.com) and tick
  // "Share tab audio" — or share the whole screen with system audio.
  async useCapture() {
    const ctx = this.#context();
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const audio = stream.getAudioTracks();
    if (!audio.length) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error('No audio was shared — tick "Share tab audio" / "Share system audio".');
    }
    stream.getVideoTracks().forEach((t) => t.stop());
    const audioOnly = new MediaStream(audio);
    this.#attach(ctx.createMediaStreamSource(audioOnly), 'Captured audio', false, { stream: audioOnly });
  }

  async useFile(file) {
    const ctx = this.#context();
    const el = new Audio(URL.createObjectURL(file));
    el.loop = true;
    await el.play();
    this.#attach(ctx.createMediaElementSource(el), `File: ${file.name}`, true, { el });
  }

  #attach(node, kind, audible, handles) {
    this.stop();
    const an = this.ctx.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0.55;
    an.minDecibels = -85;
    an.maxDecibels = -20;
    node.connect(an);
    if (audible) an.connect(this.ctx.destination);

    Object.assign(this, { node, analyser: an, kind, handles });
    this.bytes = new Uint8Array(an.frequencyBinCount);
    this.spec = new Float32Array(BINS);
    this.prev = new Float32Array(BINS);
    this.chromaTmp = new Float32Array(12);
    this.flux = [];
    this.intervals = [];
    this.peak = 0.3;
    this.lastBeat = 0;
    this.lastBar = 0;
    this.beats = 0;
    this.fast = 0;
    this.slow = 0;
    this.lastSection = performance.now() / 1000;

    // Map each FFT bin onto our log-spaced bins and onto a pitch class.
    const hz = this.ctx.sampleRate / an.fftSize;
    this.ranges = Array.from({ length: BINS }, (_, i) => {
      const lo = Math.floor((F_MIN * Math.pow(F_MAX / F_MIN, i / BINS)) / hz);
      const hi = Math.ceil((F_MIN * Math.pow(F_MAX / F_MIN, (i + 1) / BINS)) / hz);
      return [Math.max(1, lo), Math.max(lo + 1, hi)];
    });
    this.fftPc = Int8Array.from({ length: an.frequencyBinCount }, (_, k) => {
      const f = k * hz;
      return f >= 65 && f <= 2100 ? pitchClass(f) : -1;
    });
  }

  stop() {
    if (!this.analyser) return;
    this.node.disconnect();
    this.analyser.disconnect();
    this.handles.stream?.getTracks().forEach((t) => t.stop());
    if (this.handles.el) {
      this.handles.el.pause();
      URL.revokeObjectURL(this.handles.el.src);
    }
    this.analyser = null;
    this.kind = null;
  }

  // `structure`: also derive beats / bars / sections / chroma (only when no
  // timeline source is providing them).
  apply(frame, dt, now, structure) {
    const { analyser, bytes, spec, prev } = this;
    analyser.getByteFrequencyData(bytes);

    let framePeak = 0;
    for (let i = 0; i < BINS; i++) {
      const [lo, hi] = this.ranges[i];
      let s = 0;
      for (let k = lo; k < hi; k++) s += bytes[k];
      spec[i] = s / ((hi - lo) * 255);
      framePeak = Math.max(framePeak, spec[i]);
    }
    // Automatic gain: mic and capture levels vary wildly.
    this.peak = Math.max(framePeak, this.peak - dt * 0.04, 0.2);
    for (let i = 0; i < BINS; i++) frame.spectrum[i] = clamp01(spec[i] / this.peak);
    bandsFromSpectrum(frame);

    if (!structure) return;

    // Onset detection: spectral flux over the low/mid range vs an adaptive threshold.
    let flux = 0;
    for (let i = 0; i < MID_END; i++) flux += Math.max(0, frame.spectrum[i] - prev[i]);
    prev.set(frame.spectrum);
    const hist = this.flux;
    const avg = hist.reduce((a, b) => a + b, 0) / (hist.length || 1);
    const sd = Math.sqrt(hist.reduce((a, b) => a + (b - avg) ** 2, 0) / (hist.length || 1));
    hist.push(flux);
    if (hist.length > 45) hist.shift();

    if (flux > avg + 1.4 * sd && flux > 0.12 && now - this.lastBeat > 0.28) {
      const gap = now - this.lastBeat;
      if (gap < 1.5) {
        this.intervals.push(gap);
        if (this.intervals.length > 16) this.intervals.shift();
        const sorted = [...this.intervals].sort((a, b) => a - b);
        frame.tempo = 60 / sorted[sorted.length >> 1];
      }
      this.lastBeat = now;
      this.beats++;
      frame.beatCount++;
      frame.isBeat = true;
      if (this.beats % 4 === 0) {
        frame.isBar = true;
        this.lastBar = now;
      }
    }
    const period = 60 / frame.tempo;
    frame.beat = Math.exp(-(now - this.lastBeat) * 7);
    frame.bar = Math.exp(-(now - this.lastBar) * 3);
    frame.beatPhase = clamp01((now - this.lastBeat) / period);
    frame.barPhase = ((this.beats % 4) + frame.beatPhase) / 4;

    // Chroma straight from the FFT.
    const tmp = this.chromaTmp.fill(0);
    for (let k = 0; k < bytes.length; k++) {
      const pc = this.fftPc[k];
      if (pc >= 0) tmp[pc] += (bytes[k] / 255) ** 2;
    }
    const max = Math.max(...tmp, 1e-6);
    for (let i = 0; i < 12; i++) frame.chroma[i] += (tmp[i] / max - frame.chroma[i]) * 0.2;

    // Crude section detection: short-term energy departs from the long-term trend.
    this.fast += (frame.level - this.fast) * Math.min(1, dt / 2);
    this.slow += (frame.level - this.slow) * Math.min(1, dt / 12);
    if (now - this.lastSection > 14 && Math.abs(this.fast - this.slow) > this.slow * 0.35 + 0.03) {
      this.lastSection = now;
      frame.section++;
      frame.sectionChanged = true;
    }
  }
}

// ---------------------------------------------------------------------------
// Synthetic song: 118 bpm, C–Am–F–G, a new "section" every 16 bars.

const CHORDS = [
  [0, 4, 7],
  [9, 0, 4],
  [5, 9, 0],
  [7, 11, 2],
];
const INTENSITY = [0.55, 0.8, 0.65, 1];

export class DemoSource {
  tempo = 118;
  #beat = -1;

  apply(frame, t) {
    const spb = 60 / this.tempo;
    const beatF = t / spb;
    const bi = Math.floor(beatF);
    if (bi !== this.#beat) {
      frame.isBeat = true;
      frame.beatCount++;
      if (bi % 4 === 0) frame.isBar = true;
      if (bi % 64 === 0 && bi > 0) frame.sectionChanged = true;
      this.#beat = bi;
    }
    frame.section = Math.floor(bi / 64);
    frame.tempo = this.tempo;
    frame.beatPhase = beatF - bi;
    frame.beat = Math.exp(-frame.beatPhase * spb * 7);
    frame.barPhase = ((bi % 4) + frame.beatPhase) / 4;
    frame.bar = Math.exp(-frame.barPhase * 4 * spb * 3);

    const chord = CHORDS[Math.floor(bi / 4) % 4];
    for (let i = 0; i < 12; i++) {
      const target = i === chord[0] ? 1 : chord.includes(i) ? 0.75 : 0.08;
      frame.chroma[i] += (target - frame.chroma[i]) * 0.15;
    }
    this.spectrumAt(t, frame.spectrum);
    bandsFromSpectrum(frame);
  }

  spectrumAt(t, out) {
    const spb = 60 / this.tempo;
    const bi = Math.floor(t / spb);
    const kick = Math.exp(-(t % spb) * 9);
    const hat = Math.exp(-(t % (spb / 2)) * 28);
    const chord = CHORDS[Math.floor(bi / 4) % 4];
    const energy = INTENSITY[Math.floor(bi / 64) % 4];
    for (let b = 0; b < BINS; b++) {
      const x = b / (BINS - 1);
      const f = BIN_FREQ[b];
      let v = 0.12 + 0.05 * Math.sin(t * 3 + b * 0.7);
      if (x < 0.18) v += kick * (1 - x / 0.18);
      if (f > 90 && f < 2500 && chord.includes(BIN_PC[b])) v += 0.45 + 0.15 * Math.sin(t * 2 + b);
      if (x > 0.72) v += hat * 0.5 * (x - 0.6);
      out[b] = clamp01(v * energy);
    }
    return out;
  }
}
