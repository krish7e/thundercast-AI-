// ─── ALERTS — warning operations console ─────────────────────────────────
import React, { useMemo, useState } from 'react';
import { BellRing, CheckCheck, ShieldCheck, RotateCcw, Inbox, Filter } from 'lucide-react';
import type { AlertItem } from '../types';
import { useApp } from '../state/AppContext';
import { pct } from '../utils/format';

const SEVS: (AlertItem['severity'] | 'all')[] = ['all', 'severe', 'moderate', 'minor', 'watch'];
const STATUSES: (AlertItem['status'] | 'history' | 'all')[] = ['all', 'active', 'acknowledged', 'resolved', 'history'];

const sevColor: Record<AlertItem['severity'], string> = {
  severe: 'var(--red)', moderate: 'var(--orange)', minor: 'var(--yellow)', watch: 'var(--blue)',
};

export default function AlertsPage() {
  const { alerts, ackAlert, resolveAlert, reopenAlert, simulateIncoming } = useApp();
  const [sev, setSev] = useState<(typeof SEVS)[number]>('all');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => alerts.filter((a) => {
    if (sev !== 'all' && a.severity !== sev) return false;
    if (status === 'history') { if (a.status !== 'resolved') return false; }
    else if (status !== 'all' && a.status !== status) return false;
    if (q && !(a.title + a.region + a.message + a.id).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [alerts, sev, status, q]);

  const counts = {
    active: alerts.filter((a) => a.status === 'active').length,
    ack: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
    severe: alerts.filter((a) => a.severity === 'severe' && a.status !== 'resolved').length,
  };

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* summary */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        {[
          { label: 'Active Warnings', v: counts.active, c: 'var(--red)' },
          { label: 'Acknowledged', v: counts.ack, c: 'var(--blue)' },
          { label: 'Severe In Effect', v: counts.severe, c: 'var(--orange)' },
          { label: 'Resolved (History)', v: counts.resolved, c: 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="card metric-card">
            <div className="metric-label">{s.label}</div>
            <div className="metric-value" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="card fade-in" style={{ padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} className="glow-cyan" />
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 800 }}>SEVERITY:</span>
        {SEVS.map((s) => (
          <button key={s} className={`btn sm ${sev === s ? 'on' : ''}`} onClick={() => setSev(s)}
            style={s !== 'all' && sev === s ? { borderColor: sevColor[s as AlertItem['severity']], color: sevColor[s as AlertItem['severity']] } : {}}>
            {s.toUpperCase()}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 800, marginLeft: 8 }}>STATUS:</span>
        {STATUSES.map((s) => (
          <button key={s} className={`btn sm ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>{s.toUpperCase()}</button>
        ))}
        <input className="inp" style={{ marginLeft: 'auto', width: 210 }} placeholder="Search title / region / ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn sm primary" onClick={simulateIncoming}><Inbox size={12} /> Simulate incoming</button>
      </div>

      {/* list */}
      <div className="fade-in">
        {!filtered.length && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
            <BellRing size={26} style={{ opacity: 0.4 }} /><br />No alerts match the current filters.
          </div>
        )}
        {filtered.map((a) => (
          <div key={a.id} className="alert-row fade-in" style={{ opacity: a.status === 'resolved' ? 0.65 : 1 }}>
            <div className="alert-sev-bar" style={{ background: sevColor[a.severity] }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`chip ${a.severity}`}>{a.severity.toUpperCase()}</span>
                <b style={{ fontSize: 13.5 }}>{a.title}</b>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{a.id}</span>
                <span className={`chip ${a.status}`} style={{ marginLeft: 'auto' }}>{a.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 5, lineHeight: 1.5 }}>{a.message}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 7, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', flexWrap: 'wrap' }}>
                <span>📍 {a.region}</span>
                <span>Issued {new Date(a.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Arrival: {a.arrivalMinutes > 0 ? `T+${a.arrivalMinutes} min` : a.arrivalMinutes < 0 ? `${-a.arrivalMinutes} min ago` : 'ongoing'}</span>
                <span>AI confidence: {pct(a.confidence)}</span>
                {a.stormId && <span>Cell: {a.stormId}</span>}
              </div>
              <div className="progress" style={{ marginTop: 7 }}>
                <div style={{ width: pct(a.confidence), background: sevColor[a.severity] }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 128 }}>
              {a.status === 'active' && (
                <button className="btn sm" onClick={() => ackAlert(a.id)}><ShieldCheck size={12} /> Acknowledge</button>
              )}
              {(a.status === 'active' || a.status === 'acknowledged') && (
                <button className="btn sm success" onClick={() => resolveAlert(a.id)}><CheckCheck size={12} /> Resolve</button>
              )}
              {a.status === 'resolved' && (
                <button className="btn sm danger" onClick={() => reopenAlert(a.id)}><RotateCcw size={12} /> Reopen</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
