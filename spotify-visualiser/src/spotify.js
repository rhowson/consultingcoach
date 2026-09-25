// Minimal Spotify Web API client using Authorization Code + PKCE, so it runs
// entirely in the browser: no client secret and no backend.

const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';
const SCOPES = 'user-read-currently-playing user-read-playback-state';
const STORE = 'sv.spotify';

export class SpotifyError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class Spotify {
  constructor() {
    this.state = JSON.parse(localStorage.getItem(STORE) || '{}');
    this.analysisBlocked = false;
    this.analysisCache = new Map();
  }

  get redirectUri() {
    return location.origin + location.pathname;
  }

  get clientId() {
    return this.state.clientId || '';
  }

  get loggedIn() {
    return !!this.state.refreshToken;
  }

  #save() {
    localStorage.setItem(STORE, JSON.stringify(this.state));
  }

  async login(clientId) {
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    this.state = { clientId, verifier };
    this.#save();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: this.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    location.assign(`${AUTH_URL}?${params}`);
  }

  logout() {
    this.state = { clientId: this.state.clientId };
    this.#save();
  }

  // Call on page load; completes the login if we are returning from Spotify.
  async handleRedirect() {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (!code && !error) return;
    history.replaceState(null, '', this.redirectUri);
    if (error) throw new SpotifyError(0, `Spotify login failed: ${error}`);
    await this.#token({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      code_verifier: this.state.verifier,
    });
  }

  async #token(body) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientId, ...body }),
    });
    const json = await res.json();
    if (!res.ok) {
      this.logout();
      throw new SpotifyError(res.status, json.error_description || json.error || 'Token request failed');
    }
    this.state = {
      clientId: this.clientId,
      accessToken: json.access_token,
      refreshToken: json.refresh_token || this.state.refreshToken,
      expiresAt: Date.now() + (json.expires_in - 60) * 1000,
    };
    this.#save();
  }

  async #accessToken() {
    if (!this.state.accessToken || Date.now() > this.state.expiresAt) {
      await this.#token({ grant_type: 'refresh_token', refresh_token: this.state.refreshToken });
    }
    return this.state.accessToken;
  }

  async api(path, retried = false) {
    const res = await fetch(API + path, { headers: { Authorization: `Bearer ${await this.#accessToken()}` } });
    if (res.status === 204) return null;
    if (res.status === 401 && !retried) {
      this.state.expiresAt = 0;
      return this.api(path, true);
    }
    if (res.status === 429) {
      const wait = Number(res.headers.get('Retry-After') || 5);
      throw new SpotifyError(429, `Rate limited — retrying in ${wait}s`);
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new SpotifyError(res.status, json.error?.message || res.statusText);
    }
    return res.json();
  }

  currentlyPlaying() {
    return this.api('/me/player/currently-playing');
  }

  // Spotify restricted audio-analysis for apps created after Nov 2024, so a
  // 403 here is expected for most new apps. Remember it and stop asking.
  async audioAnalysis(trackId) {
    if (this.analysisBlocked) return null;
    if (this.analysisCache.has(trackId)) return this.analysisCache.get(trackId);
    try {
      const analysis = await this.api(`/audio-analysis/${trackId}`);
      this.analysisCache.set(trackId, analysis);
      return analysis;
    } catch (err) {
      if (err.status === 403 || err.status === 404) this.analysisBlocked = err.status === 403;
      return null;
    }
  }
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
