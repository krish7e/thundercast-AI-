// ─── weatherModelService ───────────────────────────────────────────────
import type { DataSourceStatus, RegionImpact } from '../types';
import { DATA_SOURCES, REGIONS } from '../data/mockData';

export const weatherModelService = {
  async getRegions(): Promise<RegionImpact[]> {
    return REGIONS;
  },
  async getDataSources(): Promise<DataSourceStatus[]> {
    // simulate live latency jitter on poll
    return DATA_SOURCES.map((d) => ({
      ...d,
      lastUpdateISO: new Date().toISOString(),
      latencySec: Math.max(2, Math.round(d.latencySec * (0.85 + Math.random() * 0.3))),
    }));
  },
  /** Model forecast probability field summary per region (blend of NWP + ML) */
  getModelBlend(regionName: string) {
    const r = REGIONS.find((x) => x.name === regionName) ?? REGIONS[0];
    return { thunder: r.thunderProb * 0.9, lightning: r.lightningProb * 0.85, precip: r.rainfallMmH * 0.8 };
  },
};
