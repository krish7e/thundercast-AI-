// ─── satelliteService ──────────────────────────────────────────────────
// Mock IR cloud-top product. Real integration: WMTS/TMS tile URL template.
import type { LatLng } from '../types';
import { STORM_CELLS } from '../data/mockData';

export interface CloudTopCell { pos: LatLng; radiusKm: number; tempC: number }

export const satelliteService = {
  /** Cold cloud tops (IR brightness temperature) — colder = deeper convection */
  async getCloudTops(tMin: number): Promise<CloudTopCell[]> {
    return STORM_CELLS.map((cell) => {
      const i = Math.min(cell.track.length - 1, Math.round(tMin / 15));
      const cooling = cell.status === 'dissipating' ? tMin / 300 : -tMin / 400;
      return {
        pos: cell.track[i].pos,
        radiusKm: 22 + cell.reflectivityDbz * 0.6,
        tempC: -56 - cell.reflectivityDbz * 0.5 + cooling * 30,
      };
    });
  },
};
