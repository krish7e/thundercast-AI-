// ─── Core domain types for ThunderCast AI ────────────────────────────────
// These interfaces define the contract between UI and data services.
// Swapping mock services for real API/ML backends requires only that the
// backend returns objects conforming to these shapes.

export type LatLng = { lat: number; lng: number };

export type StormCellStatus = 'developing' | 'mature' | 'dissipating';

export interface StormCell {
  id: string;
  name: string;
  position: LatLng;
  /** Peak reflectivity in dBZ */
  reflectivityDbz: number;
  /** Areal coverage in km^2 */
  areaKm2: number;
  /** Total cloud-to-ground lightning strikes in last hour */
  lightningCount: number;
  /** Ground strike density (strikes / 100km^2) */
  strikeDensity: number;
  /** Movement direction, degrees from north */
  movementDirDeg: number;
  /** Movement vector (km/h) */
  movementSpeedKmh: number;
  topsHeightKm: number;
  status: StormCellStatus;
  /** 0..1 model confidence this cell tracks as predicted */
  confidence: number;
  /** Minutes until the cell core reaches its primary target region (negative = already arrived) */
  etaMinutes: number;
  targetRegion: string;
  /** Predicted trajectory points (positions at +15 min increments) */
  track: { t: number; pos: LatLng }[];
  /** Probability cone radii (km) per track point */
  coneRadiiKm: number[];
}

export interface LightningStrike {
  id: string;
  timeOffsetMin: number; // relative to analysis time, negative = past
  pos: LatLng;
  polarity: 'CG-' | 'CG+' | 'IC';
  peakCurrentKa: number;
}

export interface RadarFrame {
  /** minutes offset from now */
  t: number;
  /** grid of reflectivity values dBZ, origin top-left */
  grid: number[][];
}

export interface AlertItem {
  id: string;
  severity: 'severe' | 'moderate' | 'minor' | 'watch';
  title: string;
  message: string;
  region: string;
  position: LatLng;
  issuedAt: string;
  arrivalMinutes: number;
  confidence: number;
  status: 'active' | 'acknowledged' | 'resolved';
  stormId?: string;
}

export interface RegionImpact {
  name: string;
  position: LatLng;
  populationM: number; // millions affected
  impactLevel: 'high' | 'moderate' | 'low';
  thunderProb: number;
  lightningProb: number;
  arrivalMin: number;
  rainfallMmH: number;
}

export interface NowcastPoint {
  minute: number;
  thunderstormProb: number; // 0..1
  lightningProb: number;    // 0..1
  rainfallMmH: number;
  intensityDbz: number;
  confidence: number;       // 0..1
}

export interface NowcastExplanationFactor {
  label: string;
  value: string;
  contribution: number; // -1..1 signed influence on forecast
}

export interface NowcastResult {
  series: NowcastPoint[];
  overallConfidence: number;
  aiModel: string;
  modelVersion: string;
  factors: NowcastExplanationFactor[];
}

export type DataSourceKind = 'radar' | 'satellite' | 'lightning' | 'observations' | 'model';

export interface DataSourceStatus {
  id: DataSourceKind;
  name: string;
  provider: string;
  status: 'online' | 'degraded' | 'offline';
  lastUpdateISO: string;
  latencySec: number;
  updateIntervalSec: number;
  dataRateMbps: number;
  stationCount?: number;
  coveragePct: number;
  description: string;
}

export interface MapLayerVisibility {
  radar: boolean;
  satellite: boolean;
  lightning: boolean;
  stormCells: boolean;
  predictedTrack: boolean;
  radarCoverage: boolean;
  rainfall: boolean;
  wind: boolean;
  modelForecast: boolean;
  regions: boolean;
}

export interface AppSettings {
  layers: MapLayerVisibility;
  forecastDurationMin: number;   // 60 | 90 | 120
  updateIntervalSec: number;     // 30 | 60 | 120 | 300
  alertThresholds: {
    severeDbz: number;
    moderateDbz: number;
    minorDbz: number;
    lightningStrikesPerHour: number;
    minProbability: number; // 0..1
  };
  animationSpeed: number; // 0.5 | 1 | 2 | 4
  display: {
    units: 'metric' | 'imperial';
    showGrid: boolean;
    showLabels: boolean;
    reduceMotion: boolean;
    clock24h: boolean;
  };
}

export type PageId = 'overview' | 'live-map' | 'forecast' | 'alerts' | 'data-sources' | 'settings';
