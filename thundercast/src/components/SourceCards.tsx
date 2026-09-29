// ─── Multi-Radar / Satellite / Lightning / Model summary cards ───────────
import React from 'react';
import { Radar, Satellite, Zap, BrainCircuit } from 'lucide-react';
import type { StormCell, LightningStrike, NowcastPoint } from '../types';
import { pct, fmtKmh, compass } from '../utils/format';

interface Props { cells: StormCell[]; strikes: LightningStrike[]; nowcast?: NowcastPoint; tMin: number }

export default function SourceCards({ cells, strikes, nowcast, tMin }: Props) {
  const maxDbz = Math.max(...cells.map((c) => c.reflectivityDbz));
  const dominant = cells.reduce((a, b) => (a.reflectivityDbz > b.reflectivityDbz ? a : b));
  const recent = strikes.filter((s) => s.timeOffsetMin <= 0).length;
  const predicted = strikes.filter((s) => s.timeOffsetMin > 0 && s.timeOffsetMin <= tMin + 60).length;
  const coldest = Math.min(...cells.map((c) => -56 - c.reflectivityDbz * 0.5));

  const items = [
    { icon: Radar, color: 'var(--cyan)', name: 'Multi-Radar', main: `${maxDbz.toFixed(0)} dBZ`, sub: `Peak · ${cells.length} tracked cells`, det: `Dominant: ${dominant.name} → ${compass(dominant.movementDirDeg)} ${fmtKmh(dominant.movementSpeedKmh)}`, ok: true },
    { icon: Satellite, color: 'var(--blue)', name: 'Satellite IR', main: `${coldest.toFixed(0)}°C`, sub: 'Coldest cloud top', det: 'INSAT-3D · 16-band · convective initiation ×2', ok: true },
    { icon: Zap, color: 'var(--orange)', name: 'Lightning Network', main: `${recent}`, sub: `CG strikes past hour`, det: `+${predicted} predicted in window`, ok: true },
    { icon: BrainCircuit, color: 'var(--purple)', name: 'Model Forecast', main: nowcast ? pct(nowcast.thunderstormProb) : '—', sub: `TS prob @ +${tMin}m`, det: nowcast ? `Blend HRRR + ML · conf ${pct(nowcast.confidence)}` : '', ok: true },
  ];

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
      {items.map((it) => (
        <div key={it.name} className="card metric-card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <it.icon size={16} style={{ color: it.color }} />
            <div className="metric-label">{it.name}</div>
            <span className="dot green pulse" style={{ marginLeft: 'auto' }} />
          </div>
          <div className="metric-value" style={{ color: it.color }}>{it.main}</div>
          <div className="metric-sub">{it.sub}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{it.det}</div>
        </div>
      ))}
    </div>
  );
}
