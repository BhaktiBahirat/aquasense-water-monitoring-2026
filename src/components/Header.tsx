import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import {
  Droplets,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  Database,
  Radio,
  ChevronDown,
  User,
  FlaskConical,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'live-monitoring'
  | 'water-analysis'
  | 'ai-maintenance'
  | 'filter-management'
  | 'water-consumption'
  | 'reports'
  | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
}) => {
  const { systemStatus, notifications, injectSimulatedScenario, setDataSource } = useAquasense();
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadAlerts = notifications.filter((n) => !n.acknowledged).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: Radio },
    { id: 'water-analysis', label: 'Water Quality', icon: Droplets },
    { id: 'ai-maintenance', label: 'AI Assistant', icon: Sparkles },
    { id: 'filter-management', label: 'Filters', icon: Layers },
    { id: 'water-consumption', label: 'Consumption', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
      {/* Top tier: Brand + IoT Connection Statuses + Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-wider text-white font-mono">
                AQUA<span className="text-cyan-400">SENSE</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 uppercase">
                IoT v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight truncate max-w-[200px] sm:max-w-none">
              Intelligent Water Quality & Predictive Maintenance
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Firebase RTDB connection pill */}
          <div
            className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              systemStatus.firebaseConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : systemStatus.firebaseConnecting
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}
            title={
              systemStatus.firebaseConnected
                ? 'Connected to Firebase Realtime Database'
                : systemStatus.firebaseError || 'Demo Simulation active'
            }
          >
            <Database className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {systemStatus.firebaseConnected
                ? 'Firebase RTDB: Live'
                : systemStatus.firebaseConnecting
                ? 'Firebase: Connecting...'
                : 'Firebase: Demo Mode'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus.firebaseConnected
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
          </div>

          {/* ESP32 Online / Offline Indicator with heartbeat timer */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              systemStatus.esp32Online
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
            }`}
            title={`Last sensor packet received ${systemStatus.secondsSinceLastPacket}s ago`}
          >
            {systemStatus.esp32Online ? (
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="text-[11px] font-semibold">
              ESP32: {systemStatus.esp32Online ? 'Online' : 'Offline'}
            </span>
            <span className="text-[10px] text-slate-400 hidden md:inline">
              ({systemStatus.secondsSinceLastPacket}s)
            </span>
          </div>

          {/* Sensor Scenario Test Injector (Essential for demonstrating anomalies) */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Test Sensor Scenarios"
            >
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Inject Test Scenario</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  Simulate Sensor Conditions
                </div>
                <button
                  onClick={() => {
                    injectSimulatedScenario('normal');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>1. Normal Inlet Water (Level 1)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </button>
                <button
                  onClick={() => {
                    injectSimulatedScenario('turbidity_spike');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>2. Turbidity Surge (14.8 NTU)</span>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                </button>
                <button
                  onClick={() => {
                    injectSimulatedScenario('ph_acid');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>3. Acidic pH Shock (5.4 pH)</span>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                </button>
                <button
                  onClick={() => {
                    injectSimulatedScenario('tds_surge');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>4. High TDS Spike (1150 ppm)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </button>
                <button
                  onClick={() => {
                    injectSimulatedScenario('low_do');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>5. Low Dissolved Oxygen (2.2 mg/L)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </button>
                <button
                  onClick={() => {
                    injectSimulatedScenario('disconnect_sensor');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>6. Probe Disconnect (N/A Value)</span>
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                </button>
                <button
                  onClick={() => {
                    injectSimulatedScenario('esp32_offline');
                    setShowScenarioMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>7. ESP32 Offline Disconnect</span>
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* User Profile avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-900 text-slate-300 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold">
                EN
              </div>
              <span className="text-xs font-medium text-slate-200 hidden md:inline">Plant Engineer</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2">
                <div className="border-b border-slate-800 pb-2">
                  <p className="font-semibold text-white">bhaktibahirat1@gmail.com</p>
                  <p className="text-[11px] text-cyan-400">Chief Water Systems Engineer</p>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p className="text-[11px]">Role: Administrator</p>
                  <p className="text-[11px]">Project: water quality monitoring</p>
                  <p className="text-[11px]">Protocol: ESP32 WiFi HTTP / RTDB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tabs bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-900/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
