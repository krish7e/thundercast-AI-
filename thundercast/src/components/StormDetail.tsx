// ─── Selected-storm detail panel (Live Map / Overview) ──────────────────
import React from 'react';
import { X, Zap, Wind, Gauge, Timer, CloudLightning, Activity } from 'lucide-react';
import type { StormCell } from '../types';
import { compass, fmtKmh, pct, fmtMin } from '../utils/format';

const statusChip: Record<string, string> = { developing: 'watch', mature: 'severe', dissipating: 'resolved' };

export default function StormDetail({ cell, onClose }: { cell: StormCell; onClose: () => void }) {
  const last = cell.track[cell.track.length - 1];
  return (
    <div className="card storm-pop fade-in" style={{ width: 320 }}>
      <div className="card-h">
        <div className="accent" />
        <h3 style={{ color: '#fff', textTransform: 'none', letterSpacing: 0 }}>{cell.name}</h3>
        <span className={`chip ${statusChip[cell.status]}`}>{cell.status.toUpperCase()}</span>
        <button className="icon-btn" style={{ marginLeft: 'auto', width: 26, height: 26 }} onClick={onClose}><X size={14} /></button>
      </div>
      <div className="card-body" style={{ display: 'grid', gap: 3 }}>
        <div className="kv"><span>Cell ID</span><b>{cell.id}</b></div>
        <div className="kv"><span><Gauge size={12} style={{verticalAlign:-2}}/> Peak intensity</span><b className="glow-red">{cell.reflectivityDbz} dBZ</b></div>
        <div className="kv"><span><Zap size={12} style={{verticalAlign:-2}}/> Lightning (1h)</span><b className="glow-orange">{cell.lightningCount} strikes · {cell.strikeDensity}/100km²</b></div>
        <div className="kv"><span><Wind size={12} style={{verticalAlign:-2}}/> Movement</span><b className="glow-green">{fmtKmh(cell.movementSpeedKmh)} → {compass(cell.movementDirDeg)} ({cell.movementDirDeg}°)</b></div>
        <div className="kv"><span><CloudLightning size={12} style={{verticalAlign:-2}}/> Echo tops</span><b>{cell.topsHeightKm.toFixed(1)} km</b></div>
        <div className="kv"><span><Activity size={12} style={{verticalAlign:-2}}/> Coverage</span><b>{cell.areaKm2} km²</b></div>
        <div className="kv"><span><Timer size={12} style={{verticalAlign:-2}}/> ETA {cell.targetRegion}</span><b className={cell.etaMinutes <= 45 ? 'glow-red' : 'glow-yellow'}>{cell.etaMinutes < 0 ? 'impacting now' : fmtMin(cell.etaMinutes)}</b></div>
        <div className="kv"><span>AI track confidence</span><b className="glow-cyan">{pct(cell.confidence)}</b></div>
        <div style={{ marginTop: 8 }}>
          <div className="metric-label" style={{ marginBottom: 4 }}>Predicted path · +120 min endpoint</div>
          <div className="progress"><div style={{ width: pct(cell.confidence), background: 'linear-gradient(90deg,#22d3ee,#3b82f6)' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--mono)' }}>
            {last.pos.lat.toFixed(3)}, {last.pos.lng.toFixed(3)} · cone ±{Math.round(cell.coneRadiiKm[cell.coneRadiiKm.length - 1])} km
          </div>
        </div>
      </div>
    </div>
  );
}
