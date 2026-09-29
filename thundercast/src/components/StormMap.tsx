// ─── StormMap: interactive radar/satellite/lightning map (the centerpiece)
// Reusable across Overview (compact) and Live Map (full-screen).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer, TileLayer, Polygon, CircleMarker, Marker, Tooltip, Polyline, Circle, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LightningStrike, MapLayerVisibility, NowcastPoint, RegionImpact, StormCell } from '../types';
import { CENTER, MAP_BOUNDS } from '../data/mockData';
import { dbzColor, compass, fmtKmh, pct, destPoint } from '../utils/format';
import { satelliteService } from '../services/satelliteService';
import { radarService } from '../services/radarService';
import { weatherModelService } from '../services/weatherModelService';

interface Props {
  height: number | string;
  tMin: number; // selected forecast minute
  layers: MapLayerVisibility;
  cells: StormCell[];
  strikes: LightningStrike[];
  nowcast?: NowcastPoint;
  selectedStormId?: string | null;
  onSelectStorm?: (id: string | null) => void;
  showControls?: boolean;
  controlsSlot?: React.ReactNode; // rendered top-left overlay by parent
  animateFrameMs?: number;
}

/** shared helper: render dBZ grid → SVG data URL */
function gridToSvgUrl(grid: number[][]): string {
  const n = grid.length;
  let rects = '';
  const cellSz = 100 / n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const v = grid[r][c];
    if (v < 6) continue;
    rects += `<rect x="${(c * cellSz).toFixed(2)}" y="${(r * cellSz).toFixed(2)}" width="${(cellSz + 0.05).toFixed(2)}" height="${(cellSz + 0.05).toFixed(2)}" fill="${dbzColor(v)}" opacity="${Math.min(0.95, 0.3 + v / 70).toFixed(2)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="crispEdges">${rects}</svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function SatelliteLayer({ tMin }: { tMin: number }) {
  const [tops, setTops] = useState<{ pos: { lat: number; lng: number }; radiusKm: number; tempC: number }[]>([]);
  useEffect(() => { satelliteService.getCloudTops(tMin).then(setTops); }, [tMin]);
  return (
    <>
      {tops.map((ct, i) => (
        <Circle key={i} center={[ct.pos.lat, ct.pos.lng]} radius={ct.radiusKm * 1000}
          pathOptions={{ color: '#8b9dc3', weight: 1, fillColor: '#aab8d0', fillOpacity: 0.14 }} interactive={false} />
      ))}
    </>
  );
}

function conePolygon(cell: StormCell): [number, number][] {
  // build cone: left side out, right side back
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  cell.track.forEach((p, i) => {
    const r = cell.coneRadiiKm[i] ?? 5;
    const nxt = cell.track[Math.min(i + 1, cell.track.length - 1)].pos;
    const dx = nxt.lng - p.pos.lng, dy = nxt.lat - p.pos.lat;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (r / 111), ny = (dx / len) * (r / 98);
    left.push([p.pos.lat + ny, p.pos.lng + nx]);
    right.unshift([p.pos.lat - ny, p.pos.lng - nx]);
  });
  return [...left, ...right];
}

export default function StormMap({
  height, tMin, layers, cells, strikes, nowcast, selectedStormId, onSelectStorm, showControls = true,
}: Props) {
  const [regions, setRegions] = useState<RegionImpact[]>([]);
  useEffect(() => { weatherModelService.getRegions().then(setRegions); }, []);

  const visibleStrikes = useMemo(
    () => strikes.filter((s) => s.timeOffsetMin <= tMin && s.timeOffsetMin >= tMin - 30),
    [strikes, tMin],
  );

  // rainfall derived from nowcast intensity
  const rainMmH = nowcast?.rainfallMmH ?? 0;

  const handleBgClick = () => onSelectStorm?.(null);

  return (
    <div className="map-wrap fade-in" style={{ height }}>
      <MapContainer
        center={[CENTER.lat, CENTER.lng]} zoom={showControls ? 9 : 8} minZoom={7} maxZoom={13}
        zoomControl preferCanvas scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" pane="shadowPane" />

        <MapClickCatcher onBackgroundClick={handleBgClick} />

        {layers.radar && <RadarGridLoader tMin={tMin} />}
        {layers.satellite && <SatelliteLayer tMin={tMin} />}

        {layers.radarCoverage &&
          [{ pos: { lat: 28.9, lng: 76.7 }, name: 'RAD-A' }, { pos: { lat: 28.3, lng: 77.5 }, name: 'RAD-B' },
           { pos: { lat: 29.2, lng: 77.6 }, name: 'RAD-C' }, { pos: { lat: 27.9, lng: 76.6 }, name: 'RAD-D' }].map((r) => (
            <React.Fragment key={r.name}>
              <Circle center={[r.pos.lat, r.pos.lng]} radius={95000}
                pathOptions={{ color: '#22d3ee', weight: 1, dashArray: '6 4', fillColor: '#22d3ee', fillOpacity: 0.05 }} interactive={false} />
              <Marker position={[r.pos.lat, r.pos.lng]} icon={L.divIcon({ className: '', html: `<div style="color:#22d3ee;font-size:10px;font-weight:800;text-align:center;width:60px;margin-left:-30px">📡 ${r.name}</div>`, iconSize: [60, 14] })} />
            </React.Fragment>
          ))}

        {layers.rainfall && nowcast && tMin >= 0 && (
          <RainField rainMmH={rainMmH} cells={cells} />
        )}

        {layers.wind && <WindField cells={cells} />}

        {layers.modelForecast && regions.map((r) => (
          <Circle key={'mf' + r.name} center={[r.position.lat, r.position.lng]} radius={Math.max(r.arrivalMin, 10) * 750}
            pathOptions={{ color: '#a78bfa', weight: 1.5, dashArray: '3 5', fillColor: '#a78bfa', fillOpacity: 0.06 }} interactive={false} />
        ))}

        {layers.regions && regions.map((r) => (
          <Marker key={r.name} position={[r.position.lat, r.position.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="white-space:nowrap;font-size:10px;font-weight:700;color:${r.impactLevel === 'high' ? '#fda4af' : r.impactLevel === 'moderate' ? '#fdba74' : '#93c5fd'};text-shadow:0 0 8px rgba(0,0,0,.9)">◈ ${r.name}<br/><span style="font-family:JetBrains Mono,monospace;color:#9db0d5">ETA ${r.arrivalMin}m · ${pct(r.thunderProb)}</span></div>`,
              iconSize: [130, 30], iconAnchor: [0, 8],
            })}
            interactive={false} />
        ))}

        {layers.predictedTrack && cells.map((cell) => {
          const sel = cell.id === selectedStormId;
          return (
            <React.Fragment key={'cone' + cell.id}>
              <Polygon positions={conePolygon(cell)} pathOptions={{ color: '#22d3ee', weight: sel ? 2 : 1, opacity: sel ? 0.9 : 0.35, fillColor: '#22d3ee', fillOpacity: sel ? 0.14 : 0.05 }} interactive={false} />
              <Polyline positions={cell.track.map((p) => [p.pos.lat, p.pos.lng])} pathOptions={{ color: '#22d3ee', weight: sel ? 2.5 : 1.5, opacity: sel ? 1 : 0.45, dashArray: '8 6' }} interactive={false} />
              {cell.track.map((p, i) => (
                <CircleMarker key={i} center={[p.pos.lat, p.pos.lng]} radius={sel ? 3.5 : 2.5}
                  pathOptions={{ color: '#0e1834', fillColor: '#22d3ee', fillOpacity: 1, weight: 1.5, opacity: sel ? 1 : 0.5 }} interactive={false} />
              ))}
            </React.Fragment>
          );
        })}

        {layers.lightning && visibleStrikes.map((s) => (
          <CircleMarker key={s.id} center={[s.pos.lat, s.pos.lng]} radius={s.polarity === 'IC' ? 2 : 3}
            pathOptions={{ stroke: false, fillColor: s.polarity === 'CG+' ? '#facc15' : s.polarity === 'CG-' ? '#fb923c' : '#a78bfa', fillOpacity: s.timeOffsetMin > 0 ? 0.55 : 0.95 }}
            interactive={false} />
        ))}

        {layers.stormCells && cells.map((cell) => {
          const sel = cell.id === selectedStormId;
          const col = dbzColor(cell.reflectivityDbz);
          return (
            <CircleMarker key={cell.id} center={[cell.position.lat, cell.position.lng]}
              radius={8 + cell.reflectivityDbz / 8}
              pathOptions={{ color: sel ? '#fff' : col, weight: sel ? 2.5 : 1.5, fillColor: col, fillOpacity: 0.4 }}
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e as unknown as Event); onSelectStorm?.(cell.id); } }}>
              <Tooltip className="tc-tooltip" direction="top" offset={[0, -12]}>
                <b>{cell.name}</b> ({cell.id})<br />
                {cell.reflectivityDbz} dBZ · {fmtKmh(cell.movementSpeedKmh)} → {compass(cell.movementDirDeg)}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {selectedStormId && (() => {
          const cell = cells.find((c) => c.id === selectedStormId);
          if (!cell) return null;
          return (
            <Marker position={[cell.position.lat, cell.position.lng]}
              icon={L.divIcon({ className: 'storm-marker', html: `<div class="storm-ring" style="width:44px;height:44px;border:2px solid #22d3ee;border-radius:50%;box-shadow:0 0 18px rgba(34,211,238,.6);animation:none"></div><div style="position:absolute;inset:-10px;border:1.5px dashed rgba(34,211,238,.7);border-radius:50%;animation:ringPulse 2.2s ease-out infinite"></div>`, iconSize: [44, 44], iconAnchor: [22, 22] })}
              interactive={false} />
          );
        })()}
      </MapContainer>
    </div>
  );
}

function RadarGridLoader({ tMin }: { tMin: number }) {
  const [grid, setGrid] = useState<number[][] | null>(null);
  useEffect(() => {
    let live = true;
    radarService.getFrame(tMin).then((f) => { if (live) setGrid(f.grid); });
    return () => { live = false; };
  }, [tMin]);
  const map = useMap();
  useEffect(() => {
    if (!grid) return;
    const url = gridToSvgUrl(grid);
    const bounds = L.latLngBounds([MAP_BOUNDS.minLat, MAP_BOUNDS.minLng], [MAP_BOUNDS.maxLat, MAP_BOUNDS.maxLng]);
    const layer = L.imageOverlay(url, bounds, { opacity: 0.88, interactive: false }).addTo(map);
    return () => { layer.remove(); };
  }, [grid, map]);
  return null;
}

function RainField({ rainMmH, cells }: { rainMmH: number; cells: StormCell[] }) {
  const scale = Math.min(1, rainMmH / 45);
  return (
    <>
      {cells.map((c) => (
        <Circle key={'rn' + c.id} center={[c.position.lat, c.position.lng]} radius={(20 + c.reflectivityDbz) * 1000 * (0.6 + scale)}
          pathOptions={{ stroke: false, fillColor: '#3b82f6', fillOpacity: 0.1 + scale * 0.2 }} interactive={false} />
      ))}
    </>
  );
}

function WindField({ cells }: { cells: StormCell[] }) {
  return (
    <>
      {cells.map((c) => {
        const end = destPoint(c.position, c.movementDirDeg, c.movementSpeedKmh * 0.35);
        return (
          <Polyline key={'wd' + c.id} positions={[[c.position.lat, c.position.lng], [end.lat, end.lng]]}
            pathOptions={{ color: '#34d399', weight: 2, opacity: 0.8 }} interactive={false}>
            <Tooltip permanent className="tc-tooltip" direction="right">{fmtKmh(c.movementSpeedKmh)}</Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}

/** closes storm popup when clicking empty map area */
function MapClickCatcher({ onBackgroundClick }: { onBackgroundClick: () => void }) {
  const map = useMap();
  useEffect(() => {
    const h = () => onBackgroundClick();
    map.on('click', h);
    return () => { map.off('click', h); };
  }, [map, onBackgroundClick]);
  return null;
}

export { gridToSvgUrl };
