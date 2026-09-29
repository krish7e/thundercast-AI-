// ─── LIVE MAP — full-screen geospatial analyzer ──────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Search, Layers, Maximize2 } from 'lucide-react';
import type { MapLayerVisibility, NowcastPoint, RadarFrame } from '../types';
import { useApp } from '../state/AppContext';
import { radarService } from '../services/radarService';
import { lightningService } from '../services/lightningService';
import { nowcastService } from '../services/nowcastService';
import StormMap from '../components/StormMap';
import StormDetail from '../components/StormDetail';
import Timeline, { TIMELINE_STEPS } from '../components/Timeline';
import { REGIONS, STORM_CELLS } from '../data/mockData';
import { pct, dbzColor } from '../utils/format';

const LAYER_META: { key: keyof MapLayerVisibility; label: string; color: string }[] = [
  { key: 'radar', label: 'Radar Reflectivity', color: '#ef4134' },
  { key: 'satellite', label: 'Satellite IR', color: '#8b9dc3' },
  { key: 'lightning', label: 'Lightning Strikes', color: '#fb923c' },
  { key: 'stormCells', label: 'Storm Cells', color: '#f7d417' },
  { key: 'predictedTrack', label: 'Predicted Track', color: '#22d3ee' },
  { key: 'radarCoverage', label: 'Radar Coverage', color: '#22d3ee' },
  { key: 'rainfall', label: 'Rainfall Rate', color: '#3b82f6' },
  { key: 'wind', label: 'Wind Vectors', color: '#34d399' },
  { key: 'modelForecast', label: 'Model Forecast', color: '#a78bfa' },
  { key: 'regions', label: 'Affected Regions', color: '#fda4af' },
];

export default function LiveMapPage() {
  const { settings, toggleLayer } = useApp();
  const [tMin, setTMin] = useState(0);
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [query, setQuery] = useState('');
  const strikes = useStrikes();
  const cells = useMemo(() => nowcastService.getCells(), []);
  const [nowcast, setNowcast] = useState<NowcastPoint[]>([]);
  const mapBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { radarService.getFrames().then(setFrames); }, []);
  useEffect(() => { nowcastService.predict(settings.forecastDurationMin).then((r) => setNowcast(r.series)); }, [settings.forecastDurationMin]);

  const np = nowcast.find((p) => p.minute === tMin) ?? nowcast[Math.min(nowcast.length - 1, Math.round(tMin / 5))];

  useEffect(() => {
    if (!playing || settings.display.reduceMotion) return;
    const iv = setInterval(() => {
      setTMin((t) => {
        const i = TIMELINE_STEPS.indexOf(t);
        return TIMELINE_STEPS[(i + 1) % TIMELINE_STEPS.length];
      });
    }, 1800 / settings.animationSpeed);
    return () => clearInterval(iv);
  }, [playing, settings.animationSpeed, settings.display.reduceMotion]);

  const searchHits = query.trim()
    ? [
        ...REGIONS.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())).map((r) => ({ name: r.name, pos: r.position, kind: 'Region' })),
        ...STORM_CELLS.filter((c) => (c.name + ' ' + c.id).toLowerCase().includes(query.toLowerCase())).map((c) => ({ name: `${c.name} (${c.id})`, pos: c.position, kind: 'Storm cell', id: c.id })),
      ]
    : [];

  const goFullscreen = () => {
    const el = mapBoxRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div ref={mapBoxRef} style={{ position: 'relative', height: 'calc(100vh - 58px - 42px)', margin: '-16px -18px -26px', background: 'var(--bg-0)' }}>
      <StormMap height="100%" tMin={tMin} layers={settings.layers} cells={cells} strikes={strikes}
        nowcast={np} selectedStormId={selected} onSelectStorm={(id) => { setSelected(id); setPlaying(false); }} />

      {/* top bar: search + title */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 600, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, width: 270 }}>
          <span className="dot red pulse" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800 }}>Geospatial Analyzer</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>SECTOR 04 · C-BAND MOSAIC</div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px', height: 38, width: 240 }}>
            <Search size={14} className="glow-cyan" />
            <input className="inp" style={{ border: 'none', background: 'transparent', width: '100%', padding: 0 }} placeholder="Search regions or storm cells…"
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {!!searchHits.length && (
            <div className="search-drop">
              {searchHits.map((h, i) => (
                <div key={i} onClick={() => { if ('id' in h && typeof h.id === 'string') setSelected(h.id); setQuery(''); }}>
                  <b style={{ color: 'var(--cyan)' }}>{h.name}</b> · <span style={{ color: 'var(--text-3)' }}>{h.kind}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* layer panel */}
      <div className="layer-panel" style={{ display: showLayers ? 'block' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <Layers size={13} className="glow-cyan" />
          <b style={{ fontSize: 11.5, marginLeft: 6, letterSpacing: 0.6 }}>MAP LAYERS</b>
          <button className="icon-btn" style={{ marginLeft: 'auto', width: 24, height: 24 }} onClick={() => setShowLayers(false)}>×</button>
        </div>
        {LAYER_META.map((l) => (
          <div key={l.key} className="layer-row" onClick={() => toggleLayer(l.key)}>
            <span className="layer-swatch" style={{ background: l.color }} />
            {l.label}
            <span className={`switch ${settings.layers[l.key] ? 'on' : ''}`} style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
      {!showLayers && (
        <button className="btn sm" style={{ position: 'absolute', top: 12, right: 12, zIndex: 600 }} onClick={() => setShowLayers(true)}>
          <Layers size={12} /> Layers
        </button>
      )}

      {/* bottom controls */}
      <div className="map-overlay-bottom">
        <div className="card" style={{ padding: 12, backdropFilter: 'blur(10px)', background: 'rgba(9,17,39,.88)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <button className="btn sm" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={12} /> : <Play size={12} />}{playing ? ' Pause' : ' Play'}</button>
            <button className="btn sm" onClick={() => setTMin(TIMELINE_STEPS[Math.max(0, TIMELINE_STEPS.indexOf(tMin) - 1)])}><SkipBack size={12} /></button>
            <button className="btn sm" onClick={() => setTMin(TIMELINE_STEPS[Math.min(TIMELINE_STEPS.length - 1, TIMELINE_STEPS.indexOf(tMin) + 1)])}><SkipForward size={12} /></button>
            <span className="chip watch" style={{ fontFamily: 'var(--mono)' }}>FORECAST T+{tMin} MIN</span>
            {np && (
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
                TS {pct(np.thunderstormProb)} · LT {pct(np.lightningProb)} · Rain {np.rainfallMmH.toFixed(0)} mm/h · Conf {pct(np.confidence)}
              </span>
            )}
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={goFullscreen}><Maximize2 size={12} /> Fullscreen</button>
          </div>
          <Timeline frames={frames} selected={tMin} onSelect={(t) => { setTMin(t); setPlaying(false); }} />
        </div>
      </div>

      {/* storm detail */}
      {selected && (() => {
        const cell = cells.find((c) => c.id === selected);
        return cell ? (
          <div style={{ position: 'absolute', left: 12, top: 70, zIndex: 600 }}>
            <StormDetail cell={cell} onClose={() => setSelected(null)} />
          </div>
        ) : null;
      })()}

      {/* legend */}
      <div className="card" style={{ position: 'absolute', right: 12, bottom: 130, zIndex: 550, padding: '8px 10px', width: 130 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', marginBottom: 5 }}>REFLECTIVITY</div>
        <div className="legend-scale">{[10, 20, 30, 40, 47, 52, 57, 62, 67].map((v) => <div key={v} style={{ flex: 1, background: dbzColor(v) }} />)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: 3 }}>
          <span>5</span><span>35</span><span>65+</span>
        </div>
      </div>
    </div>
  );
}

function useStrikes() {
  const [s, setS] = useState<import('../types').LightningStrike[]>([]);
  useEffect(() => { lightningService.getStrikes().then(setS); }, []);
  return s;
}
