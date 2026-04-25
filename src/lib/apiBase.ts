/**
 * Backend API origin (no /api suffix).
 * - Docker Desktop on Windows: "localhost" often resolves to IPv6 ::1 while the API listens on IPv4 → use 127.0.0.1.
 * - Opening the app via LAN IP (http://192.168.x.x:3000) while the build points at localhost → use same host, port 8000.
 */

export function normalizeApiBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
}

function mapLocalhostToIpv4(url: string): string {
  return url.replace(/localhost/gi, '127.0.0.1');
}

function pageIsLocalLoopback(): boolean {
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

/** Default API base: same host as the SPA, port 8000 (local Docker backend). */
function defaultApiBaseFromLocation(): string {
  const host = window.location.hostname;
  const h = pageIsLocalLoopback() ? '127.0.0.1' : host;
  const useTls = window.location.protocol === 'https:';
  return `${useTls ? 'https' : 'http'}://${h}:8000`;
}

export function getApiBaseUrl(): string {
  const raw = process.env.REACT_APP_API_URL;
  if (raw) {
    let u = normalizeApiBaseUrl(raw);
    const pageHost = window.location.hostname;
    const bakedPointsToLoopback = /localhost|127\.0\.0\.1/.test(u);
    if (pageHost !== 'localhost' && pageHost !== '127.0.0.1' && bakedPointsToLoopback) {
      return defaultApiBaseFromLocation();
    }
    if (pageIsLocalLoopback() && u.includes('localhost')) {
      u = mapLocalhostToIpv4(u);
    }
    return u;
  }
  return defaultApiBaseFromLocation();
}

export function getWsUrl(): string {
  const raw = process.env.REACT_APP_WS_URL?.trim();
  if (raw) {
    let w = raw;
    const pageHost = window.location.hostname;
    const bakedPointsToLoopback = /localhost|127\.0\.0\.1/.test(w);
    if (pageHost !== 'localhost' && pageHost !== '127.0.0.1' && bakedPointsToLoopback) {
      const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      return `${scheme}://${pageHost}:8000/ws`;
    }
    if (pageIsLocalLoopback() && w.includes('localhost')) {
      w = mapLocalhostToIpv4(w);
    }
    return w;
  }
  const host = window.location.hostname;
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const h = pageIsLocalLoopback() ? '127.0.0.1' : host;
  return `${scheme}://${h}:8000/ws`;
}

export function resolveApiAssetUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
