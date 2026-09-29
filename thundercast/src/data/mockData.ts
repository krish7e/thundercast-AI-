// ─── Realistic mock dataset ───────────────────────────────────────────────
// Everything here simulates what a live backend would stream. Services in
// src/services read from this module; replacing them with real API clients
// requires no UI changes.

import type {
  AlertItem, LightningStrike, NowcastPoint, NowcastExplanationFactor,
  RegionImpact, StormCell, DataSourceStatus, LatLng,
} from '../types';
import { destPoint, mulberry32 } from '../utils/format';

/** Map center — metro command area */
export const CENTER: LatLng = { lat: 28.6139, lng: 77.209 };
export const MAP_BOUNDS = { minLat: 27.4, maxLat: 29.6, minLng: 75.8, maxLng: 78.6 };

const rand = mulberry32(20260929);

// ── Storm cells ───────────────────────────────────────────────────────────
type Seed = Omit<StormCell, 'track' | 'coneRadiiKm'>;
const seeds: Seed[] = [
  { id: 'SC-041', name: 'Cell Alpha', position: { lat: 28.32, lng: 76.72 }, reflectivityDbz: 58, areaKm2: 340, lightningCount: 412, strikeDensity: 121, movementDirDeg: 52, movementSpeedKmh: 46, topsHeightKm: 15.8, status: 'mature', confidence: 0.93, etaMinutes: 38, targetRegion: 'Southwest District' },
  { id: 'SC-038', name: 'Cell Bravo', position: { lat: 28.05, lng: 76.98 }, reflectivityDbz: 63, areaKm2: 510, lightningCount: 688, strikeDensity: 135, movementDirDeg: 18, movementSpeedKmh: 39, topsHeightKm: 17.2, status: 'mature', confidence: 0.88, etaMinutes: 62, targetRegion: 'Central Metro' },
  { id: 'SC-035', name: 'Cell Charlie', position: { lat: 28.44, lng: 77.62 }, reflectivityDbz: 41, areaKm2: 180, lightningCount: 96, strikeDensity: 53, movementDirDeg: 248, movementSpeedKmh: 33, topsHeightKm: 12.4, status: 'developing', confidence: 0.74, etaMinutes: 84, targetRegion: 'East Riverside' },
  { id: 'SC-031', name: 'Cell Delta', position: { lat: 27.86, lng: 76.55 }, reflectivityDbz: 52, areaKm2: 260, lightningCount: 244, strikeDensity: 94, movementDirDeg: 61, movementSpeedKmh: 51, topsHeightKm: 14.1, status: 'mature', confidence: 0.81, etaMinutes: 47, targetRegion: 'Southwest District' },
  { id: 'SC-029', name: 'Cell Echo', position: { lat: 28.98, lng: 77.35 }, reflectivityDbz: 28, areaKm2: 95, lightningCount: 22, strikeDensity: 23, movementDirDeg: 205, movementSpeedKmh: 27, topsHeightKm: 9.6, status: 'dissipating', confidence: 0.58, etaMinutes: -12, targetRegion: 'North Highlands' },
  { id: 'SC-027', name: 'Cell Foxtrot', position: { lat: 28.72, lng: 76.34 }, reflectivityDbz: 47, areaKm2: 215, lightningCount: 158, strikeDensity: 73, movementDirDeg: 104, movementSpeedKmh: 42, topsHeightKm: 13.5, status: 'developing', confidence: 0.7, etaMinutes: 71, targetRegion: 'West Industrial' },
];

export const STORM_CELLS: StormCell[] = seeds.map((s) => {
  const track: { t: number; pos: LatLng }[] = [];
  const coneRadiiKm: number[] = [];
  const steps = Math.ceil(120 / 15);
  for (let i = 0; i <= steps; i++) {
    const t = i * 15;
    // slight right-shear curvature over time
    const bearing = s.movementDirDeg + i * 2.5;
    track.push({ t, pos: destPoint(s.position, bearing, (s.movementSpeedKmh * t) / 60) });
    coneRadiiKm.push(4 + i * 3.2 + (1 - s.confidence) * 10);
  }
  return { ...s, track, coneRadiiKm };
});

// ── Lightning strikes (past 60 min → next 60 min predicted) ──────────────
export const LIGHTNING_STRITES: LightningStrike[] = (() => {
  const out: LightningStrike[] = [];
  let n = 0;
  for (const cell of STORM_CELLS) {
    const count = Math.round(cell.lightningCount / 14);
    for (let i = 0; i < count; i++) {
      n++;
      const t = -60 + rand() * 120;
      const spread = 0.06 + (t > 0 ? t / 900 : 0);
      const dir = cell.movementDirDeg + (rand() - 0.5) * 90;
      const pos = destPoint(cell.position, dir, rand() * spread * 110);
      out.push({
        id: `LT-${String(n).padStart(4, '0')}`,
        timeOffsetMin: Math.round(t),
        pos,
        polarity: rand() > 0.92 ? 'CG+' : rand() > 0.25 ? 'CG-' : 'IC',
        peakCurrentKa: Math.round((5 + rand() * 120) * 10) / 10,
      });
    }
  }
  return out;
})();

// ── Affected regions ──────────────────────────────────────────────────────
export const REGIONS: RegionImpact[] = [
  { name: 'Central Metro', position: { lat: 28.63, lng: 77.22 }, populationM: 8.1, impactLevel: 'high', thunderProb: 0.86, lightningProb: 0.78, arrivalMin: 52, rainfallMmH: 34 },
  { name: 'Southwest District', position: { lat: 28.5, lng: 77.06 }, populationM: 4.6, impactLevel: 'high', thunderProb: 0.92, lightningProb: 0.84, arrivalMin: 38, rainfallMmH: 42 },
  { name: 'East Riverside', position: { lat: 28.62, lng: 77.42 }, populationM: 3.2, impactLevel: 'moderate', thunderProb: 0.61, lightningProb: 0.48, arrivalMin: 84, rainfallMmH: 21 },
  { name: 'North Highlands', position: { lat: 28.85, lng: 77.1 }, populationM: 2.4, impactLevel: 'low', thunderProb: 0.34, lightningProb: 0.22, arrivalMin: 110, rainfallMmH: 9 },
  { name: 'West Industrial', position: { lat: 28.57, lng: 76.92 }, populationM: 1.9, impactLevel: 'moderate', thunderProb: 0.67, lightningProb: 0.55, arrivalMin: 66, rainfallMmH: 26 },
  { name: 'Airport Zone', position: { lat: 28.556, lng: 77.1 }, populationM: 0.6, impactLevel: 'high', thunderProb: 0.79, lightningProb: 0.71, arrivalMin: 44, rainfallMmH: 31 },
];

// ── Alerts ────────────────────────────────────────────────────────────────
const nowISO = () => new Date().toISOString();
const minsAgoISO = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const INITIAL_ALERTS: AlertItem[] = [
  { id: 'AL-1042', severity: 'severe', title: 'Severe Thunderstorm Warning', message: 'Cell Bravo — 63 dBZ core, giant hail risk & damaging winds up to 85 km/h. Cloud-to-ground lightning rate exceeding 130 strikes/100km².', region: 'Central Metro', position: { lat: 28.42, lng: 77.12 }, issuedAt: minsAgoISO(8), arrivalMinutes: 52, confidence: 0.88, status: 'active', stormId: 'SC-038' },
  { id: 'AL-1041', severity: 'severe', title: 'Lightning Threat Alert', message: 'Cell Alpha approaching Southwest District with frequent CG lightning. Ground strike density 121/100km². Outdoor operations should cease.', region: 'Southwest District', position: { lat: 28.44, lng: 76.9 }, issuedAt: minsAgoISO(14), arrivalMinutes: 38, confidence: 0.93, status: 'active', stormId: 'SC-041' },
  { id: 'AL-1039', severity: 'moderate', title: 'Flash Flood Advisory', message: 'Rainfall rates of 42 mm/h expected over drainage basin. Urban flooding likely on underpasses and low-lying arterial roads.', region: 'Southwest District', position: { lat: 28.48, lng: 77.02 }, issuedAt: minsAgoISO(22), arrivalMinutes: 41, confidence: 0.76, status: 'active', stormId: 'SC-041' },
  { id: 'AL-1036', severity: 'moderate', title: 'Thunderstorm Watch — East Corridor', message: 'Cell Charlie developing along the eastern boundary. 61% probability of severe within 90 minutes.', region: 'East Riverside', position: { lat: 28.5, lng: 77.4 }, issuedAt: minsAgoISO(35), arrivalMinutes: 84, confidence: 0.7, status: 'acknowledged', stormId: 'SC-035' },
  { id: 'AL-1034', severity: 'minor', title: 'Gust Front Wind Advisory', message: 'Outflow boundaries from dying MCS producing 55–65 km/h gusts. Minor travel disruptions possible.', region: 'North Highlands', position: { lat: 28.9, lng: 77.2 }, issuedAt: minsAgoISO(48), arrivalMinutes: 0, confidence: 0.62, status: 'resolved', stormId: 'SC-029' },
  { id: 'AL-1030', severity: 'watch', title: 'Aviation Convection Watch', message: 'Convective SIGMET zone active SW of airport. CB tops 17.2 km. Approach delays expected after +45 min.', region: 'Airport Zone', position: { lat: 28.556, lng: 77.1 }, issuedAt: minsAgoISO(61), arrivalMinutes: 44, confidence: 0.85, status: 'active', stormId: 'SC-038' },
  { id: 'AL-1026', severity: 'moderate', title: 'Hail Report Confirmed', message: '2.0 cm hail reported by spotter network near Cell Delta. Damage risk to vehicles and crops.', region: 'West Industrial', position: { lat: 28.3, lng: 76.8 }, issuedAt: minsAgoISO(92), arrivalMinutes: -20, confidence: 0.9, status: 'resolved', stormId: 'SC-031' },
  { id: 'AL-1021', severity: 'minor', title: 'Rapidly Developing Cell Monitored', message: 'New convective initiation detected west of sector. Tracking for possible escalation.', region: 'West Industrial', position: { lat: 28.72, lng: 76.4 }, issuedAt: minsAgoISO(120), arrivalMinutes: 71, confidence: 0.55, status: 'resolved', stormId: 'SC-027' },
];

// ── Data sources ──────────────────────────────────────────────────────────
export const DATA_SOURCES: DataSourceStatus[] = [
  { id: 'radar', name: 'Multi-Radar Mosaic', provider: 'National Radar Network • C-BAND x4', status: 'online', lastUpdateISO: nowISO(), latencySec: 14, updateIntervalSec: 300, dataRateMbps: 48.2, stationCount: 4, coveragePct: 97, description: 'Composite reflectivity from 4 synchronized C-band Doppler radars, 250 m resolution, volume scan every 5 min.' },
  { id: 'satellite', name: 'Geostationary Satellite', provider: 'IMD / EUMETSAT INSAT-3D', status: 'online', lastUpdateISO: nowISO(), latencySec: 42, updateIntervalSec: 600, dataRateMbps: 22.7, coveragePct: 100, description: '16-band imagery at 0.5–4 km resolution. IR cloud-top cooling rate feeds convective initiation detection.' },
  { id: 'lightning', name: 'Lightning Detection Network', provider: 'BLIDS ETN • VLF/LF', status: 'online', lastUpdateISO: nowISO(), latencySec: 6, updateIntervalSec: 60, dataRateMbps: 3.1, stationCount: 38, coveragePct: 94, description: 'Time-of-arrival network detecting CG and intracloud discharges with ~450 m location accuracy.' },
  { id: 'observations', name: 'Atmospheric Observations', provider: 'Surface AWS + Upper-Air Sounding', status: 'degraded', lastUpdateISO: minsAgoISO(7), latencySec: 180, updateIntervalSec: 3600, dataRateMbps: 0.8, stationCount: 126, coveragePct: 88, description: '126 automatic weather stations plus 12-hourly radiosonde profiles (CAPE, wind shear, freezing level).' },
  { id: 'model', name: 'Numerical Weather Models', provider: 'HRRR-ML Blended Analysis', status: 'online', lastUpdateISO: nowISO(), latencySec: 95, updateIntervalSec: 3600, dataRateMbps: 112, coveragePct: 100, description: '1-km convection-allowing model cycle blended with the ThunderCast deep-learning nowcaster.' },
];

// ── Nowcast series generator (used by nowcastService) ────────────────────
export function buildNowcastSeries(durationMin: number, peakShift = 0): NowcastPoint[] {
  const pts: NowcastPoint[] = [];
  for (let m = 0; m <= durationMin; m += 5) {
    const g = (mu: number, sd: number) => Math.exp(-((m - mu - peakShift) ** 2) / (2 * sd * sd));
    const intensity = 18 + 46 * g(48, 34) + 12 * g(105, 28);
    const thunder = Math.min(0.99, 0.12 + 0.82 * g(50, 36) + 0.2 * g(108, 30));
    const lightning = Math.min(0.97, 0.06 + 0.72 * g(46, 30) + 0.16 * g(110, 26));
    const rain = Math.max(0, 2 + 40 * g(52, 32) + 14 * g(106, 28));
    const conf = Math.max(0.32, 0.95 - m / 260 - 0.06 * g(100, 40));
    pts.push({
      minute: m,
      thunderstormProb: thunder,
      lightningProb: lightning,
      rainfallMmH: rain,
      intensityDbz: intensity,
      confidence: conf,
    });
  }
  return pts;
}

export const EXPLANATION_FACTORS: NowcastExplanationFactor[] = [
  { label: 'Storm motion vector', value: '46 km/h from SW (52°)', contribution: 0.86 },
  { label: 'Turbulent energy (CAPE)', value: '2 840 J/kg', contribution: 0.74 },
  { label: 'Deep-layer wind shear', value: '28 kt, 0–6 km', contribution: 0.61 },
  { label: 'Cloud-top cooling rate', value: '-38 °C/h (Bravo)', contribution: 0.69 },
  { label: 'Mid-level moisture', value: '62% RH @ 700 hPa', contribution: 0.42 },
  { label: 'Convergence boundary', value: 'Outflow collision detected', contribution: 0.55 },
  { label: 'Freezing level altitude', value: '4.9 km — elevated hail risk', contribution: -0.28 },
  { label: 'Entrainment / dry air', value: 'NE flank drying trend', contribution: -0.35 },
];

export const AI_INSIGHTS = [
  { tone: 'critical' as const, text: 'Cell Bravo (63 dBZ) will traverse Central Metro between +45 and +75 min. Initiate shelter-in-place protocols for outdoor assets before +40 min.' },
  { tone: 'warning' as const, text: 'Lightning ground-strike density ahead of Cell Alpha exceeds climatological 95th percentile — expect frequent CG activity 30+ min before rain onset.' },
  { tone: 'info' as const, text: 'Outflow collision southwest of the sector may trigger convective re-initiation near SC-031 during +60–+90 min window.' },
  { tone: 'success' as const, text: 'Cell Echo is dissipating (tops collapsing 15.8→9.6 km). North Highlands alert can be downgraded to advisory.' },
];
