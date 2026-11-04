import React, { useState } from 'react';
import { AquasenseProvider, useAquasense } from './context/AquasenseContext';
import { Header, ActiveTab } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DashboardView } from './views/DashboardView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { WaterQualityAnalysisView } from './views/WaterQualityAnalysisView';
import { AIMaintenanceView } from './views/AIMaintenanceView';
import { FilterManagementView } from './views/FilterManagementView';
import { WaterConsumptionView } from './views/WaterConsumptionView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { Droplets, ShieldCheck, Heart, Terminal, Database } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { systemStatus } = useAquasense();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'live-monitoring' && <LiveMonitoringView />}
        {activeTab === 'water-analysis' && <WaterQualityAnalysisView />}
        {activeTab === 'ai-maintenance' && <AIMaintenanceView />}
        {activeTab === 'filter-management' && <FilterManagementView />}
        {activeTab === 'water-consumption' && <WaterConsumptionView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Industrial IoT Engineering Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800/40">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-slate-300 font-semibold">
              AQUASENSE IoT
            </span>
            <span>• Intelligent Water Quality Monitoring & Predictive Maintenance</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>RTDB: {systemStatus.dataSource === 'FIREBASE_LIVE' ? 'Firebase Live' : 'Simulation Mode'}</span>
            </span>
            <span>ESP32 Node: 4-Channel In-line</span>
            <span>ESP-IDF v5.1 / FreeRTOS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AquasenseProvider>
      <AppContent />
    </AquasenseProvider>
  );
}
