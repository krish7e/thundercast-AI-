// ─── Formatting & unit helpers ───────────────────────────────────────────
import type { AppSettings, LatLng } from '../types';

export const fmtKmh = (kmh: number, s?: AppSettings) =>
  s?.display.units === 'imperial' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;

export const fmtMm = (mm: number, s?: AppSettings) =>
  s?.display.units === 'imperial' ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;

export const fmtMin = (min: number) => {
  if (min < 0) return `${-min} min ago`;
  if (min === 0) return 'now';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const compass = (deg: number) => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
};

export const pct = (v: number) => `${Math.round(v * 100)}%`;

export function clockString(d: Date, h24: boolean) {
  return d.toLocaleTimeString('en-US', { hour12: !h24, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Great-circle destination point given start, bearing(deg), distance(km) */
export function destPoint(p: LatLng, bearingDeg: number, distKm: number): LatLng {
  const R = 6371;
  const br = (bearingDeg * Math.PI) / 180;
  const lat1 = (p.lat * Math.PI) / 180;
  const lng1 = (p.lng * Math.PI) / 180;
  const dr = distKm / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(br));
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(br) * Math.sin(dr) * Math.cos(lat1), Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180 };
}

/** Haversine distance in km */
export function distKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** dBZ → standard NWS-style radar color */
export function dbzColor(dbz: number): string {
  if (dbz < 5) return 'transparent';
  if (dbz < 15) return '#1e6f9f';
  if (dbz < 25) return '#2196c9';
  if (dbz < 35) return '#2bb673';
  if (dbz < 45) return '#7bc93f';
  if (dbz < 50) return '#f7d417';
  if (dbz < 55) return '#f79a1d';
  if (dbz < 60) return '#ef4134';
  if (dbz < 65) return '#c1157e';
  return '#7d3ff0';
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Deterministic PRNG so mock data is stable between renders */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
