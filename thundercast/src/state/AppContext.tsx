// ─── Global app state: settings (persisted), alerts, toasts ──────────────
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { AlertItem, AppSettings, MapLayerVisibility } from '../types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../utils/storage';
import { alertService } from '../services/alertService';

interface Ctx {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  toggleLayer: (k: keyof MapLayerVisibility) => void;
  resetSettings: () => void;
  alerts: AlertItem[];
  ackAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  reopenAlert: (id: string) => void;
  simulateIncoming: () => void;
  toast: string | null;
  notify: (t: string) => void;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

let toastId = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(() => loadSettings());
  const [alerts, setAlerts] = useState<AlertItem[]>(() => alertService.getAll());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => alertService.subscribe(setAlerts), []);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const notify = useCallback((t: string) => {
    const id = ++toastId;
    setToast(t);
    setTimeout(() => { if (toastId === id) setToast(null); }, 2600);
  }, []);

  const value = useMemo<Ctx>(() => ({
    settings,
    setSettings: setSettingsState,
    toggleLayer: (k) => setSettingsState((s) => ({ ...s, layers: { ...s.layers, [k]: !s.layers[k] } })),
    resetSettings: () => setSettingsState(structuredClone(DEFAULT_SETTINGS)),
    alerts,
    ackAlert: (id) => { alertService.acknowledge(id); notify(`Alert ${id} acknowledged`); },
    resolveAlert: (id) => { alertService.resolve(id); notify(`Alert ${id} resolved`); },
    reopenAlert: (id) => { alertService.reopen(id); notify(`Alert ${id} reactivated`); },
    simulateIncoming: () => { alertService.pushNew(); notify('New AI-generated alert received'); },
    toast,
    notify,
  }), [settings, alerts, toast, notify]);

  return <AppCtx.Provider value={value}>{children}{toast && <div className="toast">⚡ {toast}</div>}</AppCtx.Provider>;
}
