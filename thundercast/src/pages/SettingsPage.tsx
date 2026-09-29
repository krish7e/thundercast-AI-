// ─── SETTINGS — persisted operational configuration ──────────────────────
import React from 'react';
import { Save, RotateCcw, SlidersHorizontal, Map as MapIcon, BellRing, Gauge, Monitor } from 'lucide-react';
import type { AppSettings, MapLayerVisibility } from '../types';
import { useApp } from '../state/AppContext';
import { DEFAULT_SETTINGS } from '../utils/storage';

const LAYER_LABELS: Record<keyof MapLayerVisibility, string> = {
  radar: 'Radar Reflectivity', satellite: 'Satellite IR', lightning: 'Lightning Strikes',
  stormCells: 'Storm Cells', predictedTrack: 'Predicted Track & Cone', radarCoverage: 'Radar Coverage',
  rainfall: 'Rainfall Rate', wind: 'Wind Vectors', modelForecast: 'Model Forecast Zones', regions: 'Affected Regions',
};

export default function SettingsPage() {
  const { settings, setSettings, resetSettings, notify } = useApp();
  const s = settings;
  const upd = (patch: Partial<AppSettings>) => setSettings({ ...s, ...patch });

  return (
    <div className="grid" style={{ gap: 14, maxWidth: 980 }}>
      <div className="card fade-in" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SlidersHorizontal size={16} className="glow-cyan" />
        <b style={{ fontSize: 14 }}>System Configuration</b>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>All changes are saved to this workstation automatically</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn sm" onClick={() => { resetSettings(); notify('Settings restored to defaults'); }}><RotateCcw size={12} /> Restore defaults</button>
          <button className="btn sm primary" onClick={() => notify('Settings saved locally ✓')}><Save size={12} /> Saved ✓</button>
        </div>
      </div>

      {/* map layers */}
      <div className="card fade-in">
        <div className="card-h"><MapIcon size={14} className="glow-cyan" /><h3>Default Map Layers</h3></div>
        <div className="card-body grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {(Object.keys(LAYER_LABELS) as (keyof MapLayerVisibility)[]).map((k) => (
            <div key={k} className="layer-row" onClick={() => upd({ layers: { ...s.layers, [k]: !s.layers[k] } })}>
              {LAYER_LABELS[k]}
              <span className={`switch ${s.layers[k] ? 'on' : ''}`} style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        {/* forecast + refresh */}
        <div className="card fade-in">
          <div className="card-h"><Gauge size={14} className="glow-green" /><h3>Forecast & Refresh</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 14 }}>
            <Field label="Nowcast duration horizon">
              <select className="inp" value={s.forecastDurationMin} onChange={(e) => upd({ forecastDurationMin: +e.target.value })}>
                {[60, 90, 120].map((v) => <option key={v} value={v}>0 – {v} minutes</option>)}
              </select>
            </Field>
            <Field label="Data update interval">
              <select className="inp" value={s.updateIntervalSec} onChange={(e) => upd({ updateIntervalSec: +e.target.value })}>
                {[30, 60, 120, 300].map((v) => <option key={v} value={v}>{v < 60 ? `${v}s` : `${v / 60}m`}</option>)}
              </select>
            </Field>
            <Field label={`Timeline animation speed — ${s.animationSpeed}×`}>
              <input type="range" min={0} max={3} step={1} value={[0.5, 1, 2, 4].indexOf(s.animationSpeed)}
                onChange={(e) => upd({ animationSpeed: [0.5, 1, 2, 4][+e.target.value] })} style={{ width: 180, accentColor: '#22d3ee' }} />
            </Field>
          </div>
        </div>

        {/* alert thresholds */}
        <div className="card fade-in">
          <div className="card-h"><BellRing size={14} className="glow-orange" /><h3>Alert Thresholds</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 14 }}>
            <Field label={`Severe warning ≥ ${s.alertThresholds.severeDbz} dBZ`}>
              <input type="range" min={45} max={70} value={s.alertThresholds.severeDbz}
                onChange={(e) => upd({ alertThresholds: { ...s.alertThresholds, severeDbz: +e.target.value } })} style={{ width: 180, accentColor: '#f43f5e' }} />
            </Field>
            <Field label={`Moderate ≥ ${s.alertThresholds.moderateDbz} dBZ`}>
              <input type="range" min={35} max={60} value={s.alertThresholds.moderateDbz}
                onChange={(e) => upd({ alertThresholds: { ...s.alertThresholds, moderateDbz: +e.target.value } })} style={{ width: 180, accentColor: '#fb923c' }} />
            </Field>
            <Field label={`Minor ≥ ${s.alertThresholds.minorDbz} dBZ`}>
              <input type="range" min={20} max={50} value={s.alertThresholds.minorDbz}
                onChange={(e) => upd({ alertThresholds: { ...s.alertThresholds, minorDbz: +e.target.value } })} style={{ width: 180, accentColor: '#facc15' }} />
            </Field>
            <Field label={`Lightning trigger ≥ ${s.alertThresholds.lightningStrikesPerHour} strikes/h`}>
              <input type="range" min={20} max={200} step={10} value={s.alertThresholds.lightningStrikesPerHour}
                onChange={(e) => upd({ alertThresholds: { ...s.alertThresholds, lightningStrikesPerHour: +e.target.value } })} style={{ width: 180, accentColor: '#a78bfa' }} />
            </Field>
            <Field label={`Minimum AI probability to warn — ${Math.round(s.alertThresholds.minProbability * 100)}%`}>
              <input type="range" min={10} max={90} step={5} value={s.alertThresholds.minProbability * 100}
                onChange={(e) => upd({ alertThresholds: { ...s.alertThresholds, minProbability: +e.target.value / 100 } })} style={{ width: 180, accentColor: '#22d3ee' }} />
            </Field>
          </div>
        </div>

        {/* display preferences */}
        <div className="card fade-in">
          <div className="card-h"><Monitor size={14} className="glow-purple" /><h3>Display Preferences</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 8 }}>
            <Field label="Units">
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn sm ${s.display.units === 'metric' ? 'on' : ''}`} onClick={() => upd({ display: { ...s.display, units: 'metric' } })}>Metric (km/h, mm)</button>
                <button className={`btn sm ${s.display.units === 'imperial' ? 'on' : ''}`} onClick={() => upd({ display: { ...s.display, units: 'imperial' } })}>Imperial</button>
              </div>
            </Field>
            <ToggleRow label="Show coordinate grid" v={s.display.showGrid} onV={() => upd({ display: { ...s.display, showGrid: !s.display.showGrid } })} />
            <ToggleRow label="Show map labels" v={s.display.showLabels} onV={() => upd({ display: { ...s.display, showLabels: !s.display.showLabels } })} />
            <ToggleRow label="Reduce motion (disable auto-animation)" v={s.display.reduceMotion} onV={() => upd({ display: { ...s.display, reduceMotion: !s.display.reduceMotion } })} />
            <ToggleRow label="24-hour clock" v={s.display.clock24h} onV={() => upd({ display: { ...s.display, clock24h: !s.display.clock24h } })} />
          </div>
        </div>

        {/* API integration notes */}
        <div className="card fade-in">
          <div className="card-h"><SlidersHorizontal size={14} className="glow-blue" /><h3>Backend Integration</h3></div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>
              The UI consumes typed service contracts (<code style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>radarService · satelliteService · lightningService · weatherModelService · nowcastService</code>).
              Point these at live endpoints when available — no component changes required:
            </p>
            <table className="dt">
              <thead><tr><th>Service</th><th>Mock source</th><th>Production swap</th></tr></thead>
              <tbody>
                <tr><td>radarService</td><td>synthetic dBZ grid</td><td>WMS / NetCDF tiles</td></tr>
                <tr><td>satelliteService</td><td>IR cloud-top model</td><td>INSAT/EUMETSAT feed</td></tr>
                <tr><td>lightningService</td><td>ETN replay file</td><td>LLS websocket stream</td></tr>
                <tr><td>weatherModelService</td><td>static blend fields</td><td>NWP API (HRRR/ECMWF)</td></tr>
                <tr><td>nowcastService</td><td>curve generator</td><td>ML inference REST/gRPC</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
              Defaults: {JSON.stringify(DEFAULT_SETTINGS.forecastDurationMin)}m horizon · thresholds editable above persist in <code style={{ fontFamily: 'var(--mono)' }}>localStorage</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="metric-label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, v, onV }: { label: string; v: boolean; onV: () => void }) {
  return (
    <div className="layer-row" onClick={onV}>
      {label}
      <span className={`switch ${v ? 'on' : ''}`} style={{ marginLeft: 'auto' }} />
    </div>
  );
}
