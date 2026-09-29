// ─── FORECAST — interactive 0–120 min AI nowcast charts + explainability ─
import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { BrainCircuit, HelpCircle, Sparkles, ChevronDown } from 'lucide-react';
import type { NowcastResult } from '../types';
import { useApp } from '../state/AppContext';
import { nowcastService } from '../services/nowcastService';
import { pct } from '../utils/format';

const ttStyle = { background: '#0c1530', border: '1px solid rgba(94,148,255,.4)', borderRadius: 10, fontSize: 12, color: '#e8f0ff' };

export default function ForecastPage() {
  const { settings } = useApp();
  const [res, setRes] = useState<NowcastResult | null>(null);
  const [focus, setFocus] = useState<number | null>(null); // hovered minute
  const [showWhy, setShowWhy] = useState(true);
  const [stormId, setStormId] = useState<string>('');

  useEffect(() => {
    nowcastService.predict(settings.forecastDurationMin, stormId || undefined).then(setRes);
  }, [settings.forecastDurationMin, stormId]);

  const data = useMemo(
    () => res?.series.map((p) => ({
      min: p.minute,
      thunder: +(p.thunderstormProb * 100).toFixed(1),
      lightning: +(p.lightningProb * 100).toFixed(1),
      rain: +p.rainfallMmH.toFixed(1),
      dbz: +p.intensityDbz.toFixed(1),
      conf: +(p.confidence * 100).toFixed(1),
    })) ?? [],
    [res],
  );

  if (!res) return <div style={{ padding: 40, color: 'var(--text-3)' }}>Running inference…</div>;

  const peak = data.reduce((a, b) => (b.thunder > a.thunder ? b : a), data[0]);
  const focusPt = focus != null ? data.find((d) => d.min === focus) : null;

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* header controls */}
      <div className="card fade-in" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Sparkles size={17} className="glow-purple" />
        <b style={{ fontSize: 14 }}>AI Nowcast · 0–{settings.forecastDurationMin} minutes</b>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{res.aiModel}</span>
        <select className="inp" style={{ marginLeft: 'auto' }} value={stormId} onChange={(e) => setStormId(e.target.value)}>
          <option value="">Sector composite (all cells)</option>
          {nowcastService.getCells().map((c) => <option key={c.id} value={c.id}>Focus: {c.name} ({c.id})</option>)}
        </select>
        <div className="chip active">Peak TS prob {pct(peak.thunder / 100)} @ +{peak.min}m</div>
        <div className="chip watch">Overall confidence {pct(res.overallConfidence)}</div>
      </div>

      {/* probability chart */}
      <div className="card fade-in">
        <div className="card-h"><div className="accent" /><h3>Thunderstorm & Lightning Probability</h3></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} onMouseMove={(st) => setFocus(typeof st?.activeLabel === 'number' ? st.activeLabel : null)} onMouseLeave={() => setFocus(null)}>
              <defs>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity={0.5} /><stop offset="100%" stopColor="#fb923c" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(76,120,200,.12)" strokeDasharray="4 4" />
              <XAxis dataKey="min" tick={{ fill: '#5a6f98', fontSize: 11 }} axisLine={{ stroke: 'rgba(76,120,200,.3)' }} tickFormatter={(v) => `+${v}m`} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5a6f98', fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={44} />
              <Tooltip contentStyle={ttStyle} formatter={(val: number, name: string) => [`${val}%`, name]} labelFormatter={(l) => `Forecast +${l} min`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine x={focusPt?.min} stroke="#22d3ee" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="thunder" name="Thunderstorm probability" stroke="#a78bfa" strokeWidth={2.5} fill="url(#gT)" />
              <Area type="monotone" dataKey="lightning" name="Lightning probability" stroke="#fb923c" strokeWidth={2.5} fill="url(#gL)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* rainfall + intensity, confidence */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
        <div className="card fade-in">
          <div className="card-h"><div className="accent" style={{ background: 'linear-gradient(180deg,#3b82f6,#22d3ee)' }} /><h3>Rainfall Rate</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(76,120,200,.12)" strokeDasharray="4 4" />
                <XAxis dataKey="min" tick={{ fill: '#5a6f98', fontSize: 11 }} tickFormatter={(v) => `+${v}m`} />
                <YAxis tick={{ fill: '#5a6f98', fontSize: 11 }} width={40} tickFormatter={(v) => `${v}`} label={{ value: 'mm/h', angle: -90, fill: '#5a6f98', fontSize: 11, position: 'insideLeft' }} />
                <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v} mm/h`]} labelFormatter={(l) => `+${l} min`} />
                <Area type="monotone" dataKey="rain" name="Rain rate" stroke="#22d3ee" strokeWidth={2} fill="url(#gR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card fade-in">
          <div className="card-h"><div className="accent" style={{ background: 'linear-gradient(180deg,#f43f5e,#fb923c)' }} /><h3>Storm Intensity (dBZ) & Confidence</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(76,120,200,.12)" strokeDasharray="4 4" />
                <XAxis dataKey="min" tick={{ fill: '#5a6f98', fontSize: 11 }} tickFormatter={(v) => `+${v}m`} />
                <YAxis yAxisId="l" tick={{ fill: '#5a6f98', fontSize: 11 }} width={40} domain={[0, 70]} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: '#5a6f98', fontSize: 11 }} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={ttStyle} labelFormatter={(l) => `+${l} min`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="l" type="monotone" dataKey="dbz" name="Peak dBZ" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="conf" name="AI confidence" stroke="#34d399" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* per-region bar chart */}
      <div className="card fade-in">
        <div className="card-h"><div className="accent" style={{ background: 'linear-gradient(180deg,#34d399,#22d3ee)' }} /><h3>Regional Impact at Peak Convection (+{peak.min} min)</h3></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data.length ? REGION_SNAPSHOT : []}>
              <CartesianGrid stroke="rgba(76,120,200,.12)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#9db0d5', fontSize: 11 }} interval={0} />
              <YAxis tick={{ fill: '#5a6f98', fontSize: 11 }} width={36} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v}%`]} cursor={{ fill: 'rgba(34,211,238,.06)' }} />
              <Bar dataKey="prob" name="Thunderstorm probability" radius={[6, 6, 0, 0]}>
                {REGION_SNAPSHOT.map((r, i) => <Cell key={i} fill={r.prob > 75 ? '#f43f5e' : r.prob > 55 ? '#fb923c' : '#3b82f6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Why is AI predicting this */}
      <div className="card fade-in">
        <div className="card-h" style={{ cursor: 'pointer' }} onClick={() => setShowWhy((v) => !v)}>
          <div className="accent" style={{ background: 'linear-gradient(180deg,var(--purple),var(--cyan))' }} />
          <BrainCircuit size={15} className="glow-purple" />
          <h3 style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, color: '#fff' }}>Why is AI predicting this?</h3>
          <HelpCircle size={14} className="glow-cyan" style={{ marginLeft: 4 }} />
          <ChevronDown size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)', transform: showWhy ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
        </div>
        {showWhy && (
          <div className="card-body">
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.55 }}>
              ThunderCast-Net attributes the forecast peak of <b className="glow-purple">{pct(peak.thunder / 100)} thunderstorm probability at +{peak.min} min</b> to the following
              input drivers (SHAP-style signed contributions, normalized −1…+1):
            </p>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 10 }}>
              {res.factors.map((f) => (
                <div key={f.label} style={{ background: 'rgba(13,22,46,.6)', border: '1px solid var(--stroke)', borderRadius: 10, padding: '9px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <b>{f.label}</b><span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{f.value}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, position: 'relative', height: 6, background: '#16234a', borderRadius: 6 }}>
                      <div style={{
                        position: 'absolute', top: 0, bottom: 0, borderRadius: 6,
                        left: f.contribution >= 0 ? '50%' : `${50 + f.contribution * 50}%`,
                        width: `${Math.abs(f.contribution) * 50}%`,
                        background: f.contribution >= 0 ? 'linear-gradient(90deg,#22d3ee,#34d399)' : 'linear-gradient(90deg,#f43f5e,#fb923c)',
                      }} />
                      <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--text-3)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, width: 44, textAlign: 'right', color: f.contribution >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {f.contribution >= 0 ? '+' : ''}{(f.contribution * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { REGIONS } from '../data/mockData';
const REGION_SNAPSHOT = REGIONS.map((r) => ({ name: r.name.replace(' District', '').replace(' Metro', ''), prob: Math.round(r.thunderProb * 100) }));
