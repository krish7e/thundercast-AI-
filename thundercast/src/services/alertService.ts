// ─── alertService ──────────────────────────────────────────────────────
import type { AlertItem } from '../types';
import { INITIAL_ALERTS } from '../data/mockData';

let store: AlertItem[] = structuredClone(INITIAL_ALERTS);
const listeners = new Set<(a: AlertItem[]) => void>();

export const alertService = {
  getAll(): AlertItem[] { return store; },
  subscribe(fn: (a: AlertItem[]) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  _emit() { listeners.forEach((fn) => fn([...store])); },
  acknowledge(id: string) {
    store = store.map((a) => (a.id === id ? { ...a, status: 'acknowledged' as const } : a));
    this._emit();
  },
  resolve(id: string) {
    store = store.map((a) => (a.id === id ? { ...a, status: 'resolved' as const } : a));
    this._emit();
  },
  reopen(id: string) {
    store = store.map((a) => (a.id === id ? { ...a, status: 'active' as const } : a));
    this._emit();
  },
  /** Simulates the backend pushing a fresh alert */
  pushNew() {
    const n = 1043 + Math.floor(Math.random() * 50);
    const a: AlertItem = {
      id: `AL-${n}`, severity: 'moderate', title: 'AI-Generated Convective Alert',
      message: 'Nowcaster detected rapid intensification (>20 dBZ/15min) on tracked cell. Verify and escalate if confirmed by radar.',
      region: 'Southwest District', position: { lat: 28.4 + Math.random() * 0.2, lng: 76.9 + Math.random() * 0.3 },
      issuedAt: new Date().toISOString(), arrivalMinutes: 20 + Math.round(Math.random() * 40),
      confidence: 0.6 + Math.random() * 0.3, status: 'active', stormId: 'SC-031',
    };
    store = [a, ...store];
    this._emit();
  },
};
