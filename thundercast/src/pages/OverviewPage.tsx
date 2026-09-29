// ─── OVERVIEW — mission-control dashboard (reference layout) ─────────────
import React, { useEffect, useMemo, useState } from 'react';
import { Gauge, Zap, Navigation, Timer, AlertTriangle, CloudRain, Play, Pause, MapPin } from 'lucide-react';
import type { PageId, RadarFrame, NowcastPoint } from '../types';
import { useApp } from '../state/AppContext';
import { radarService } from '../services/radarService';
import { lightningService } from '../services/lightningService';
import { nowcastService } from '../services/nowcastService';
import StormMap from '../components/StormMap';
import Timeline, { TIMELINE_STEPS } from '../components/Timeline';
import AlertsPanel from '../components/AlertsPanel';
import AiInsights from '../components/AiInsights';
import SourceCards from '../components/SourceCards';
import StormDetail from '../components/StormDetail';
import { REGIONS } from '../data/mockData';
import { pct, compass, fmtKmh, dbzColor } from '../utils/format';

export default function OverviewPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { settings, alerts } = useApp();
  const [tMin, setTMin] = useState(0);
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [selectedStorm, setSelectedStorm] = useState<string | null>('SC-038');
  const [playing, setPlaying] = useState(false);
  const [nowcast, setNowcast] = useState<NowcastPoint[]>([]);

  const cells = useMemo(() => nowcastService.getCells(), []);
  const strikes = useMemo(() => lightningService.totalRecentHour() && [], []); // preload no-op
  const allStrikes = useAllStrikes();
  const conf = useMemo(() => Math.max(...cells.map((c) => c.confidence)) * 0.96, [cells]);

  useEffect(() => { radarService.getFrames().then(setFrames); }, []);
  useEffect(() => { nowcastService.predict(settings.forecastDurationMin).then((r) => setNowcast(r.series)); }, [settings.forecastDurationMin]);

  // timeline auto-animation
  useEffect(() => {
    if (!playing || settings.display.reduceMotion) return;
    const iv = setInterval(() => {
      setTMin((t) => {
        const i = TIMELINE_STEPS.indexOf(t);
        return TIMELINE_STEPS[(i + 1) % TIMELINE_STEPS.length];
      });
    }, 1400 / settings.animationSpeed);
    return () => clearInterval(iv);
  }, [playing, settings.animationSpeed, settings.display.reduceMotion]);

  const at = (m: number) => nowcast.find((p) => p.minute === m) ?? nowcast.reduce((a, b) => (Math.abs(b.minute - m) < Math.abs(a.minute - m) ? b : a), nowcast[0] as NowcastPoint);
  const np = at(tMin);
  const dominant = cells.reduce((a, b) => (a.reflectivityDbz > b.reflectivityDbz ? a : b));
  const earliest = [...cells].filter((c) => c.etaMinutes > 0).sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
  const totalLightning = allStrikes.filter((s) => s.timeOffsetMin <= 0).length;

  const metrics = [
    { icon: Gauge, label: 'Peak Reflectivity', value: `${dominant.reflectivityDbz}`, unit: 'dBZ', color: 'var(--red)', sub: `${dominant.name} core · extreme`, spark: [20, 28, 35, 44, 52, 58, 63] },
    { icon: Zap, label: 'Lightning Count', value: `${totalLightning}`, unit: 'strikes/h', color: 'var(--orange)', sub: `CG density ${dominant.strikeDensity}/100km²`, spark: [12, 18, 30, 42, 55, 61, 70] },
    { icon: Navigation, label: 'Storm Motion', value: `${Math.round(dominant.movementSpeedKmh)}`, unit: 'km/h', color: 'var(--green)', sub: `→ ${compass(dominant.movementDirDeg)} (${dominant.movementDirDeg}°)`, spark: [38, 40, 41, 44, 45, 46, 46] },
    { icon: Timer, label: 'First Arrival', value: `${earliest?.etaMinutes ?? 0}`, unit: 'min', color: 'var(--cyan)', sub: `${earliest?.targetRegion ?? ''} · ${earliest?.name ?? ''}`, spark: [90, 75, 62, 50, 42, 38, 30] },
    { icon: CloudRain, label: 'Rain Rate @ +' + tMin + 'm', value: `${np.rainfallMmH.toFixed(0)}`, unit: 'mm/h', color: 'var(--blue)', sub: `TS prob ${pct(np.thunderstormProb)} · LT ${pct(np.lightningProb)}`, spark: [4, 9, 16, 24, 31, 38, 42] },
    { icon: AlertTriangle, label: 'Active Warnings', value: `${alerts.filter((a) => a.status !== 'resolved').length}`, unit: '', color: 'var(--yellow)', sub: `${alerts.filter((a) => a.severity === 'severe' && a.status !== 'resolved').length} severe-level in effect`, spark: [1, 2, 2, 3, 4, 5, 5] },
  ];

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 14 }}>
      {/* metrics row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        {metrics.map((m) => (
          <div key={m.label} className="card metric-card fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <m.icon size={14} style={{ color: m.color }} />
              <div className="metric-label">{m.label}</div>
            </div>
            <div className="metric-value" style={{ color: m.color }}>
              {m.value}<span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 5 }}>{m.unit}</span>
            </div>
            <div className="metric-sub">{m.sub}</div>
            <Spark data={m.spark} color={m.color} />
          </div>
        ))}
      </div>

      {/* map + right column */}
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,2.2fr) minmax(300px,1fr)', alignItems: 'start' }}>
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="accent" style={{ width: 4, height: 16, borderRadius: 3, background: 'linear-gradient(180deg,var(--cyan),var(--blue))' }} />
            <h3 style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
              Radar · Satellite · Lightning Composite
            </h3>
            <span className="chip watch" style={{ fontFamily: 'var(--mono)' }}>T+{tMin} MIN</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn sm" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause size={12} /> : <Play size={12} />} {playing ? 'Pause' : 'Animate'}
              </button>
              <button className="btn sm primary" onClick={() => onNavigate('live-map')}>Open Live Map</button>
            </div>
          </div>

          <StormMap height={430} tMin={tMin} layers={settings.layers} cells={cells} strikes={allStrikes}
            nowcast={np} selectedStormId={selectedStorm} onSelectStorm={setSelectedStorm} />

          <div style={{ marginTop: 10 }}>
            <Timeline frames={frames} selected={tMin} onSelect={(t) => { setTMin(t); setPlaying(false); }} />
          </div>
          <DbzLegend />
        </div>

        <div className="grid" style={{ gap: 14 }}>
          <AlertsPanel alerts={alerts} onNavigate={onNavigate} />
          {selectedStorm && (() => {
            const cell = cells.find((c) => c.id === selectedStorm);
            return cell ? <StormDetail cell={cell} onClose={() => setSelectedStorm(null)} /> : null;
          })()}
          <div className="card fade-in">
            <div className="card-h">
              <div className="accent" style={{ background: 'linear-gradient(180deg,var(--orange),var(--red))' }} />
              <h3>Affected Regions</h3><MapPin size={14} className="glow-orange" style={{ marginLeft: 4 }} />
            </div>
            <div className="card-body">
              {REGIONS.map((r) => (
                <div key={r.name} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <b>{r.name}</b>
                    <span style={{ color: r.impactLevel === 'high' ? 'var(--red)' : r.impactLevel === 'moderate' ? 'var(--orange)' : 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                      ETA {r.arrivalMin}m · {r.populationM}M pop
                    </span>
                  </div>
                  <div className="progress" style={{ marginTop: 3 }}>
                    <div style={{
                      width: pct(r.thunderProb),
                      background: r.impactLevel === 'high' ? 'linear-gradient(90deg,#f43f5e,#fb923c)' : r.impactLevel === 'moderate' ? 'linear-gradient(90deg,#fb923c,#facc15)' : 'linear-gradient(90deg,#3b82f6,#22d3ee)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SourceCards cells={cells} strikes={allStrikes} nowcast={np} tMin={tMin} />
      <AiInsights confidence={conf} />
    </div>
  );
}

function useAllStrikes() {
  const [s, setS] = useState<import('../types').LightningStrike[]>([]);
  useEffect(() => { lightningService.getStrikes().then(setS); }, []);
  return s;
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" style={{ width: '100%', height: 26, marginTop: 2 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.85} />
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity={0.08} stroke="none" />
    </svg>
  );
}

function DbzLegend() {
  const levels = [10, 20, 30, 40, 47, 52, 57, 62, 67];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>dBZ</span>
      <div className="legend-scale" style={{ flex: 1 }}>
        {levels.map((l) => <div key={l} style={{ flex: 1, background: dbzColor(l) }} />)}
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>5 → 65+</span>
    </div>
  );
}
