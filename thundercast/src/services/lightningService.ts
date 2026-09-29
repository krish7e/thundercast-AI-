// ─── lightningService ──────────────────────────────────────────────────
import type { LightningStrike } from '../types';
import { LIGHTNING_STRITES } from '../data/mockData';

export const lightningService = {
  async getStrikes(): Promise<LightningStrike[]> {
    return LIGHTNING_STRITES;
  },
  /** Strikes whose timeOffsetMin falls within [from,to] minutes of analysis time */
  async getStrikesInWindow(from: number, to: number): Promise<LightningStrike[]> {
    return LIGHTNING_STRITES.filter((s) => s.timeOffsetMin >= from && s.timeOffsetMin <= to);
  },
  totalRecentHour(): number {
    return LIGHTNING_STRITES.filter((s) => s.timeOffsetMin <= 0).length;
  },
};
