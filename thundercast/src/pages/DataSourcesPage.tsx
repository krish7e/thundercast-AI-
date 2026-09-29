// ─── DATA SOURCES — ingestion telemetry & health ─────────────────────────
import React, { useEffect, useState } from 'react';
import { Radar, SatelliteDish, Zap, CloudRain, BrainCircuit, RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react';
import type { DataSourceStatus } from '../types';
import { weatherModelService } from '../services/weatherModelService';
import { useApp } from '../state/AppContext';
import { fmtMin } from '../utils/format';

const ICONS = { radar: Radar, satellite: SatelliteDish, lightning: Zap, observations: CloudRain, model: BrainCircuit };
const COLORS = { online: 'var(--green)', degraded: 'var(--orange)', offline: 'var(--red)' };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [polling, setPolling] = useState(true);
  const [lastPoll, setLastPoll] = useState<Date>(new Date());
  const { settings, notify } = useApp();

  const refresh = () => weatherModelService.getDataSources().then((d) => { setSources(d); setLastPoll(new Date()); });
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!polling) return;
    const iv = setInterval(refresh, Math.max(5000, settings.updateIntervalSec * 1000));
    return () => clearInterval(iv);
  }, [polling, settings.updateIntervalSec]);

  const overall = sources.length ? (sources.every((s) => s.status === 'online') ? 'ALL SYSTEMS NOMINAL' : sources.some((s) => s.status === 'offline') ? 'DEGRADED FEED' : 'PARTIAL DEGRADATION') : 'CONNECTING…';

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card fade-in" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Activity size={17} className="glow-cyan" />
        <b style={{ fontSize: 14 }}>Ingestion Telemetry</b>
        <span className={`chip ${overall.includes('NOMINAL') ? 'active' : 'moderate'}`} style={{ fontFamily: 'var(--mono)' }}>{overall}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginLeft: 6 }}>
          last poll {lastPoll.toLocaleTimeString()} · interval {fmtMin(settings.updateIntervalSec / 60)}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={`btn sm ${polling ? 'on' : ''}`} onClick={() => setPolling((p) => !p)}>
            {polling ? <Wifi size={12} /> : <WifiOff size={12} />} Auto-refresh {polling ? 'ON' : 'OFF'}
          </button>
          <button className="btn sm primary" onClick={() => { refresh(); notify('Feed status refreshed'); }}><RefreshCw size={12} /> Poll now</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))' }}>
        {sources.map((s) => {
          const Icon = ICONS[s.id];
          return (
            <div key={s.id} className="card fade-in" style={{ padding: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(34,211,238,.08)', border: '1px solid var(--stroke)' }}>
                  <Icon size={19} style={{ color: COLORS[s.status] }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 13.5 }}>{s.name}</b>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.provider}</div>
                </div>
                <span className="chip" style={{ marginLeft: 'auto', color: COLORS[s.status], borderColor: COLORS[s.status], background: 'transparent' }}>
                  <span className={`dot ${s.status === 'online' ? 'green' : s.status === 'degraded' ? 'orange' : 'red'} pulse`} /> {s.status.toUpperCase()}
                </span>
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--text-2)', margin: '10px 0', lineHeight: 1.5 }}>{s.description}</p>

              <div className="kv"><span>Last update</span><b className="src-status">{new Date(s.lastUpdateISO).toLocaleTimeString()}</b></div>
              <div className="kv"><span>Data latency</span><b className="src-status" style={{ color: s.latencySec > 120 ? 'var(--orange)' : 'var(--green)' }}>{s.latencySec}s</b></div>
              <div className="kv"><span>Update interval</span><b className="src-status">{s.updateIntervalSec >= 3600 ? `${s.updateIntervalSec / 3600}h` : `${s.updateIntervalSec / 60}m`}</b></div>
              <div className="kv"><span>Ingest rate</span><b className="src-status">{s.dataRateMbps} Mbps</b></div>
              {s.stationCount && <div className="kv"><span>Stations reporting</span><b className="src-status">{s.stationCount}</b></div>}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3 }}>
                  <span>Coverage of sector</span><span style={{ fontFamily: 'var(--mono)' }}>{s.coveragePct}%</span>
                </div>
                <div className="progress"><div style={{ width: `${s.coveragePct}%`, background: 'linear-gradient(90deg,#22d3ee,#3b82f6)' }} /></div>
              </div>
            </div>
          );
        })}
        {!sources.length && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card" style={{ height: 220, opacity: 0.4 }} />
        ))}
      </div>
    </div>
  );
}
