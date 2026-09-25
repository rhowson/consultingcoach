# Spotify 3D Visualiser

A three.js music visualiser that connects to your Spotify account. It needs no build step and no backend: it's static HTML plus ES modules.

| Spectral Terrain | Album Cosmos | Harmonic Orbit |
| --- | --- | --- |
| ![](docs/terrain.png) | ![](docs/album.png) | ![](docs/harmonic.png) |

## Run it

```bash
cd spotify-visualiser
python3 -m http.server 8888 --bind 127.0.0.1
# open http://127.0.0.1:8888/
```

Click **Just show me the demo** to see it straight away with a synthetic song.

### Connect Spotify

1. Create an app at <https://developer.spotify.com/dashboard> and choose "Web API".
2. Add the redirect URI `http://127.0.0.1:8888/`. Spotify no longer accepts `localhost`; use the loopback IP or HTTPS.
3. While the app is in development mode, add your Spotify account under **User Management**.
4. Paste the Client ID into the Sources panel and click **Connect**. Login uses PKCE, so no client secret is needed.

### Add live audio (recommended)

Spotify streams are DRM-protected, so no web page can read the audio. The visualiser therefore uses Spotify for *what* is playing and listens to the sound separately:

- **Capture tab / system audio**: play Spotify at open.spotify.com in another Chrome/Edge tab, click Capture, pick that tab and tick "Share tab audio". This gives the best fidelity with zero latency.
- **Microphone**: works with any speaker, including your phone or a hi-fi.
- **Local file**: drop in an audio file.

## How it works

```
Spotify API ──► track, artwork ──► palette + particle art
            ──► playback clock ─┐
            ──► audio-analysis ─┴► AnalysisSource ─┐
Live audio  ──► FFT ──────────────► LiveSource ────┼─► frame {spectrum, bass/mid/treble,
Nothing     ──────────────────────► DemoSource ────┘    beat/bar pulses, chroma, sections}
                                                             │
                                          Terrain · Album · Harmonic scenes + bloom
```

Every source writes into the same `frame`, so the scenes don't care where the data came from. *Timeline* sources (Spotify analysis and the demo) can also answer "what will the spectrum be at time *t*?", which the terrain uses to show the future.

> **Note on audio-analysis:** Spotify restricted `audio-analysis` and `audio-features` for apps created after 27 Nov 2024. The app tries it once, and on a 403 falls back to live audio. Older apps, or apps with extended quota access, get exact beat, bar and section sync.

## What makes it different from a normal visualiser

Most visualisers are a 2D bar graph or a pulsing circle, reacting only to loudness *right now*. This one uses the third dimension for **time**, **harmony** and **the album itself**:

1. **The song as a place (Spectral Terrain).** Spectrum history becomes geography. Bass forms the valley walls you fly through and treble forms the distant peaks. With analysis data, rows are sampled ~6.6 s ahead of playback, so **the mountains on the horizon are the music that's about to play**. You see the drop coming before you hear it.
2. **Seeing harmony, not just volume (Harmonic Orbit).** Pitch classes stand on the circle of fifths, so related keys sit next to each other. The strongest notes form a glowing chord shape that is named live ("Am", "G"). Major and minor triads are mirror-image triangles, so key changes and chord progressions become *shapes you can recognise*.
3. **The album cover comes alive (Album Cosmos).** The cover is rebuilt from 16k particles as a relief sculpture. Each pixel reacts to the frequency matching its colour: reds pump with the kick and blues shimmer with the hi-hats. Beats send shockwaves across the art, and on a track change the cover shatters into a nebula and re-forms as the next one.
4. **Song structure drives the camera and the scene.** Scenes switch automatically on section changes (verse → chorus). The camera breathes on bars and pushes in on beats, and the terrain fly-over rolls gently. It feels directed rather than twitchy.
5. **The whole world takes its colour from the artwork.** Each track's palette is extracted from its cover and pushed toward neon for bloom, so every album gets its own lighting.

### Concept renders (not built yet)

| Sound Sculpture | Drop: the build | Drop: the release | Listening-History Galaxy |
| --- | --- | --- | --- |
| ![](docs/concepts/sculpture.png) | ![](docs/concepts/build.png) | ![](docs/concepts/drop.png) | ![](docs/concepts/galaxy.png) |

### More ideas to build next

- **Walk-through playlist**: each track is a room or planet in a 3D gallery, laid out by the playlist's harmonic key and tempo.
- **Lyrics in space**: synced lyrics (e.g. LRCLIB) as 3D type flying past the terrain on the beat.
- **Stereo field**: split the L/R channels so instruments sit left or right in 3D space.
- **Timbre creatures**: Spotify's 12-D timbre vectors drive the shape of a morphing organism.
- **WebXR mode**: stand inside the Harmonic Orbit in a VR headset.
- **Shared rooms**: friends' "now playing" as orbiting moons, via a small WebSocket relay.

## Controls

`1`–`3` scenes · `←`/`→` or `Space` cycle · `A` auto-switch on sections · `H` hide HUD · `F` fullscreen

## Files

```
index.html, style.css     UI shell; three.js is loaded from jsDelivr through an import map
src/main.js               renderer, bloom, source selection, Spotify polling, HUD
src/spotify.js            PKCE auth and Web API client
src/audio.js              LiveSource (FFT, onsets, chroma), AnalysisSource, DemoSource
src/palette.js            album-art palette and pixel extraction
src/scenes/*.js           the three scenes
```
