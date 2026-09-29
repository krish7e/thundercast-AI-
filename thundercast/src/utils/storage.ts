// ─── LocalStorage persistence for settings ───────────────────────────────
import type { AppSettings } from '../types';

const KEY = 'thundercast.settings.v1';

export const DEFAULT_SETTINGS: AppSettings = {
  layers: {
    radar: true,
    satellite: false,
    lightning: true,
    stormCells: true,
    predictedTrack: true,
    radarCoverage: false,
    rainfall: false,
    wind: false,
    modelForecast: false,
    regions: true,
  },
  forecastDurationMin: 120,
  updateIntervalSec: 60,
  alertThresholds: {
    severeDbz: 55,
    moderateDbz: 45,
    minorDbz: 35,
    lightningStrikesPerHour: 60,
    minProbability: 0.4,
  },
  animationSpeed: 1,
  display: { units: 'metric', showGrid: true, showLabels: true, reduceMotion: false, clock24h: true },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    // shallow-deep merge so new keys get defaults
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      layers: { ...DEFAULT_SETTINGS.layers, ...(parsed.layers ?? {}) },
      alertThresholds: { ...DEFAULT_SETTINGS.alertThresholds, ...(parsed.alertThresholds ?? {}) },
      display: { ...DEFAULT_SETTINGS.display, ...(parsed.display ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}
