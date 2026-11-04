import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import { AlertCategory, NotificationItem } from '../types/aquasense';
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCheck,
  Filter,
  Activity,
  Layers,
  Cpu,
  Droplet,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    acknowledgeNotification,
    dismissNotification,
    clearResolvedNotifications,
  } = useAquasense();

  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'ALL'>('ALL');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory === 'ALL') return true;
    return n.category === selectedCategory;
  });

  const unacknowledgedCount = notifications.filter((n) => !n.acknowledged).length;

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'WATER_QUALITY':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'FILTER_MAINTENANCE':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'SYSTEM':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'WATER_MANAGEMENT':
        return <Activity className="w-4 h-4 text-teal-400" />;
    }
  };

  const getSeverityBadge = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING</span>
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/40 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Notification & Alert Center</h2>
              <p className="text-xs text-slate-400">
                {unacknowledgedCount} unacknowledged • {notifications.length} total events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter categories tabs */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center space-x-1 overflow-x-auto bg-slate-900">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'WATER_QUALITY', label: 'Water Quality' },
              { id: 'FILTER_MAINTENANCE', label: 'Filters' },
              { id: 'SYSTEM', label: 'System' },
              { id: 'WATER_MANAGEMENT', label: 'Flow' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
          <span>Active alert cooldown protection enabled</span>
          <button
            onClick={clearResolvedNotifications}
            className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px]"
          >
            Clear Resolved
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <CheckCheck className="w-8 h-8 text-emerald-500/50" />
              <p className="text-sm font-medium text-slate-400">No active alerts in this category</p>
              <p className="text-xs text-slate-500 max-w-xs">All sensor thresholds and equipment metrics are operating normally.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  notif.acknowledged
                    ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                    : 'bg-slate-900 border-slate-700/80 shadow-md ring-1 ring-cyan-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(notif.category)}
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {new Date(notif.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  {getSeverityBadge(notif.severity)}
                </div>

                <h3 className="text-xs font-bold text-slate-100 mb-1">{notif.title}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                  {notif.description}
                </p>

                {/* Recommended action box */}
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800 text-[10px] text-cyan-300/90 mb-3">
                  <strong className="text-cyan-400">Action:</strong> {notif.recommendedAction}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[10px] font-mono text-slate-400">
                    {notif.code || 'SYS-EVENT'}
                  </span>

                  <div className="flex items-center space-x-2">
                    {!notif.acknowledged && (
                      <button
                        onClick={() => acknowledgeNotification(notif.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                      >
                        <Check className="w-3 h-3 text-cyan-400" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="text-slate-400 hover:text-rose-400 text-[11px] px-1.5 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center bg-slate-950">
          AQUASENSE IoT Sentinel • Alert suppression active (300s window)
        </div>
      </div>
    </div>
  );
};
