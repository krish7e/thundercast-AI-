// ─── Compact alert list used on Overview ─────────────────────────────────
import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { AlertItem, PageId } from '../types';
import { pct } from '../utils/format';

const sevColor: Record<AlertItem['severity'], string> = {
  severe: 'var(--red)', moderate: 'var(--orange)', minor: 'var(--yellow)', watch: 'var(--blue)',
};

export default function AlertsPanel({ alerts, onNavigate }: { alerts: AlertItem[]; onNavigate: (p: PageId) => void }) {
  const active = alerts.filter((a) => a.status !== 'resolved').slice(0, 5);
  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-h">
        <div className="accent" style={{ background: 'linear-gradient(180deg,var(--red),var(--orange))' }} />
        <h3>Active Alerts</h3>
        <span className="chip severe" style={{ marginLeft: 6 }}>{active.length}</span>
        <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => onNavigate('alerts')}>
          Manage <ChevronRight size={13} />
        </button>
      </div>
      <div className="card-body" style={{ overflowY: 'auto', maxHeight: 300 }}>
        {active.map((a) => (
          <div key={a.id} className="alert-row" style={{ cursor: 'pointer' }} onClick={() => onNavigate('alerts')}>
            <div className="alert-sev-bar" style={{ background: sevColor[a.severity] }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <span className={`chip ${a.severity}`}>{a.severity.toUpperCase()}</span>
                <b style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</b>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 4 }}>
                {a.region} · Arrival {a.arrivalMinutes > 0 ? `${a.arrivalMinutes} min` : 'ongoing'} · Conf {pct(a.confidence)}
              </div>
            </div>
          </div>
        ))}
        {!active.length && <div style={{ color: 'var(--text-3)', padding: 12, textAlign: 'center' }}>No active alerts 🎉</div>}
      </div>
    </div>
  );
}
