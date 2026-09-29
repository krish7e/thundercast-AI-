// ─── nowcastService ────────────────────────────────────────────────────
// The mock "ML model": deterministic curve generator. Replace predict()
// with an HTTP call to the inference endpoint returning NowcastResult.
import type { NowcastResult, StormCell } from '../types';
import { buildNowcastSeries, EXPLANATION_FACTORS, STORM_CELLS } from '../data/mockData';

export const nowcastService = {
  async predict(durationMin: number, focusStormId?: string): Promise<NowcastResult> {
    const shift = focusStormId
      ? (STORM_CELLS.find((c) => c.id === focusStormId)?.etaMinutes ?? 0) - 50
      : 0;
    const series = buildNowcastSeries(durationMin, shift);
    const overall = series[Math.min(series.length - 1, Math.floor(series.length / 2))].confidence + 0.02;
    return {
      series,
      overallConfidence: Math.min(0.96, overall),
      aiModel: 'ThunderCast-Net v3.2 (ConvLSTM + Graph Attention)',
      modelVersion: '3.2.1-mock',
      factors: EXPLANATION_FACTORS,
    };
  },
  getCells(): StormCell[] {
    return STORM_CELLS;
  },
};
