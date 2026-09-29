// ─── radarService ──────────────────────────────────────────────────────
// Mock implementation. To integrate a real backend, replace the body of
// getFrames() with a fetch to your tile/WMS endpoint returning RadarFrame[].
import type { RadarFrame, StormCell } from '../types';
import { STORM_CELLS, MAP_BOUNDS } from '../data/mockData';
import { mulberry32 } from '../utils/format';

const GRID = 64;
const rand = mulberry32(987123);

/** Precompute a smooth convective echo field for each timeline frame. */
function buildGrid(tMin: number): number[][] {
  const { minLat, maxLat, minLng, maxLng } = MAP_BOUNDS;
  const cells = shiftCells(STORM_CELLS, tMin);
  const grid: number[][] = [];
  for (let r = 0; r < GRID; r++) {
    const lat = maxLat - ((r + 0.5) / GRID) * (maxLat - minLat);
    const row: number[] = [];
    for (let c = 0; c < GRID; c++) {
      const lng = minLng + ((c + 0.5) / GRID) * (maxLng - minLng);
      let dbz = 4 + 3 * noise(r, c, Math.floor(tMin / 15));
      for (const cell of cells) {
        const dlat = (cell.position.lat - lat) * 111;
        const dlng = (cell.position.lng - lng) * 98;
        const d = Math.sqrt(dlat * dlat + dlng * dlng);
        const radius = 14 + cell.reflectivityDbz * 0.55;
        if (d < radius) {
          const core = cell.reflectivityDbz * Math.exp(-(d * d) / (2 * (radius * 0.42) ** 2));
          // elongated leading edge
          dbz = Math.max(dbz, core);
        }
      }
      row.push(Math.min(70, dbz));
    }
    grid.push(row);
  }
  return grid;
}

function noise(r: number, c: number, seed: number) {
  const x = Math.sin(r * 12.9898 + c * 78.233 + seed * 37.71) * 43758.5453;
  return x - Math.floor(x);
}

function shiftCells(cells: StormCell[], tMin: number): StormCell[] {
  return cells.map((cell) => {
    const idx = Math.max(0, Math.min(cell.track.length - 1, Math.round(tMin / 15)));
    const frac = Math.max(0, Math.min(1, tMin / 15 / (cell.track.length - 1)));
    const i = Math.floor(frac * (cell.track.length - 1));
    const j = Math.min(cell.track.length - 1, i + 1);
    const f = frac * (cell.track.length - 1) - i;
    const pos = {
      lat: cell.track[i].pos.lat + (cell.track[j].pos.lat - cell.track[i].pos.lat) * f,
      lng: cell.track[i].pos.lng + (cell.track[j].pos.lng - cell.track[i].pos.lng) * f,
    };
    const decay = cell.status === 'dissipating' ? Math.max(0.3, 1 - tMin / 90) : cell.status === 'developing' ? Math.min(1.25, 1 + tMin / 140) : 1;
    return { ...cell, position: pos, reflectivityDbz: cell.reflectivityDbz * decay };
  });
}

let cache: Map<number, RadarFrame> | null = null;

export const radarService = {
  /** Frames at Now, +15 … +120 min */
  async getFrames(): Promise<RadarFrame[]> {
    if (!cache) {
      cache = new Map();
      for (const t of [0, 15, 30, 45, 60, 120]) cache.set(t, { t, grid: buildGrid(t) });
    }
    return [...cache.values()];
  },
  async getFrame(t: number): Promise<RadarFrame> {
    const frames = await this.getFrames();
    return frames.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a), frames[0]);
  },
  async getStormCellsAt(t: number): Promise<StormCell[]> {
    return shiftCells(STORM_CELLS, t);
  },
};
