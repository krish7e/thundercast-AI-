// ─── ThunderCast AI — application shell & navigation ─────────────────────
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Map as MapIcon, CloudSun, BellRing, Database, Settings, Zap, Radio, Bell, RefreshCw,
} from 'lucide-react';
import type { PageId } from './types';
import { AppProvider, useApp } from './state/AppContext';
import { clockString } from './utils/format';
import OverviewPage from './pages/OverviewPage';
import LiveMapPage from './pages/LiveMapPage';
import ForecastPage from './pages/ForecastPage';
import AlertsPage from './pages/AlertsPage';
import DataSourcesPage from './pages/DataSourcesPage';
import SettingsPage from './pages/SettingsPage';

const NAV: { id: PageId; label: string; icon: typeof Zap; crumb: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, crumb: '/ mission control' },
  { id: 'live-map', label: 'Live Map', icon: MapIcon, crumb: '/ geospatial analyzer' },
  { id: 'forecast', label: 'Forecast', icon: CloudSun, crumb: '/ 0–120 min nowcast' },
  { id: 'alerts', label: 'Alerts', icon: BellRing, crumb: '/ warning operations' },
  { id: 'data-sources', label: 'Data Sources', icon: Database, crumb: '/ ingestion telemetry' },
  { id: 'settings', label: 'Settings', icon: Settings, crumb: '/ system configuration' },
];

function Shell() {
  const [page, setPage] = useState<PageId>('overview');
  const [now, setNow] = useState(new Date());
  const { alerts, simulateIncoming, settings } = useApp();
  const activeCount = alerts.filter((a) => a.status === 'active').length;

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const meta = NAV.find((n) => n.id === page)!;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Zap size={20} color="#fff" fill="#fff" /></div>
          <div>
            <div className="brand-name">ThunderCast <span className="glow-cyan">AI</span></div>
            <div className="brand-sub">Nowcasting Ops</div>
          </div>
        </div>
        {NAV.map((n) => (
          <div key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
            <n.icon size={17} />
            {n.label}
            {n.id === 'alerts' && activeCount > 0 && <span className="nav-badge">{activeCount}</span>}
          </div>
        ))}
        <div className="sidebar-footer">
          <div className="sys-row"><span>Ingestion</span><span><span className="dot green pulse" /> LIVE</span></div>
          <div className="sys-row"><span>ML Pipeline</span><span><span className="dot green" /> v3.2</span></div>
          <div className="sys-row"><span>Refresh cycle</span><span style={{ fontFamily: 'var(--mono)' }}>{settings.updateIntervalSec}s</span></div>
          <div style={{ marginTop: 8, fontSize: 10 }}>© 2026 ThunderCast Meteorological Systems</div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div>
            <div className="page-title">{meta.label}</div>
            <div className="page-crumb">thundercast{meta.crumb}</div>
          </div>
          <div className="topbar-right">
            <button className="btn sm" title="Simulate an incoming AI alert" onClick={simulateIncoming}>
              <RefreshCw size={13} /> Simulate feed
            </button>
            <div className="clock">{clockString(now, settings.display.clock24h)} UTC+5:30</div>
            <div className="live-pill"><Radio size={12} className="pulse" /> LIVE</div>
            <button className="icon-btn" title={`${activeCount} active alerts`} onClick={() => setPage('alerts')}>
              <Bell size={16} />
              {activeCount > 0 && <span className="nav-badge" style={{ position: 'absolute', top: -5, right: -5 }}>{activeCount}</span>}
            </button>
          </div>
        </header>

        <main className="content" key={page}>
          {page === 'overview' && <OverviewPage onNavigate={setPage} />}
          {page === 'live-map' && <LiveMapPage />}
          {page === 'forecast' && <ForecastPage />}
          {page === 'alerts' && <AlertsPage />}
          {page === 'data-sources' && <DataSourcesPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
