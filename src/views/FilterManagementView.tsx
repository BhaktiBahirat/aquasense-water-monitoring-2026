import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import { FilterStage, MaintenanceRecord, FilterStatus } from '../types/aquasense';
import {
  Layers,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Gauge,
  Plus,
  Droplet,
  ChevronRight,
  ShieldCheck,
  History,
  FileCheck,
} from 'lucide-react';

export const FilterManagementView: React.FC = () => {
  const {
    filterStages,
    maintenanceRecords,
    updateFilterStage,
    addMaintenanceRecord,
    updateMaintenanceStatus,
  } = useAquasense();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilterId, setSelectedFilterId] = useState(filterStages[0]?.id || 'stage-1');
  const [newActionType, setNewActionType] = useState<MaintenanceRecord['actionType']>('CLEANING');
  const [newUrgency, setNewUrgency] = useState<MaintenanceRecord['urgency']>('MEDIUM');
  const [newNotes, setNewNotes] = useState('');
  const [newTechnician, setNewTechnician] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );

  const getStatusBadge = (status: FilterStatus) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>GREEN – NORMAL</span>
          </span>
        );
      case 'CLEANING_REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>YELLOW – CLEANING REQUIRED</span>
          </span>
        );
      case 'REPLACEMENT_APPROACHING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>ORANGE – REPLACEMENT APPROACHING</span>
          </span>
        );
      case 'REPLACEMENT_REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>RED – REPLACEMENT / INSPECTION REQUIRED</span>
          </span>
        );
    }
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const filter = filterStages.find((f) => f.id === selectedFilterId);
    if (!filter) return;

    addMaintenanceRecord({
      filterId: filter.id,
      filterName: filter.name,
      actionType: newActionType,
      status: 'PENDING',
      urgency: newUrgency,
      scheduledDate: newScheduledDate,
      technician: newTechnician.trim() || 'Assigned On Shift',
      notes: newNotes.trim() || `Scheduled ${newActionType.toLowerCase()} based on predictive filter assessment.`,
      sensorTrigger: `Operating hours: ${filter.operatingHours} hrs | Delta-P: ${filter.differentialPressurePsi ?? 'N/A'} psi`,
    });

    setShowAddModal(false);
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Layers className="w-5 h-5 text-cyan-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              Predictive Filter Maintenance Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            4-Stage industrial filtration health tracking, service life estimation, and preventive work orders
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Maintenance Work Order</span>
        </button>
      </div>

      {/* 4 Filter Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filterStages.map((stage) => {
          return (
            <div
              key={stage.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-bold uppercase">
                      Stage {stage.stageNumber}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-wide">{stage.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Type: <span className="uppercase font-mono text-slate-300">{stage.type}</span>
                  </p>
                </div>
                {getStatusBadge(stage.status)}
              </div>

              {/* Remaining Life Progress */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Estimated Remaining Service Life:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {stage.estimatedRemainingLifePct !== null
                      ? `${stage.estimatedRemainingLifePct}% Life Remaining`
                      : 'Insufficient data to estimate filter life'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stage.estimatedRemainingLifePct !== null
                        ? stage.estimatedRemainingLifePct < 20
                          ? 'bg-rose-500'
                          : stage.estimatedRemainingLifePct < 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${stage.estimatedRemainingLifePct || 0}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Runtime: {stage.operatingHours} hrs</span>
                  <span>Rated: {stage.maxOperatingHours} hrs</span>
                </div>
              </div>

              {/* Engineering Metrics Row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Throughput Processed
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {stage.throughputLiters !== undefined
                      ? `${stage.throughputLiters.toLocaleString()} L`
                      : 'Meter pending'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Differential Pressure (ΔP)
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {stage.differentialPressurePsi !== undefined
                      ? `${stage.differentialPressurePsi.toFixed(1)} psi`
                      : 'Sensor pending'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Installed / Last Swapped
                  </span>
                  <span className="font-mono text-slate-300">{stage.lastReplacementDate}</span>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Next Scheduled Date
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">{stage.nextScheduledDate}</span>
                </div>
              </div>

              {/* AI Predictive Notification Details */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Predictive Recommendation:</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                      stage.urgency === 'CRITICAL' || stage.urgency === 'HIGH'
                        ? 'bg-rose-950 text-rose-300'
                        : stage.urgency === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    Urgency: {stage.urgency}
                  </span>
                </div>

                <p className="text-slate-200 font-medium">{stage.maintenanceAction}</p>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Sensor Evidence:</strong> {stage.sensorEvidence}
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-cyan-400">Procedure:</strong> {stage.suggestedProcedure}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Stage Health Status:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => updateFilterStage(stage.id, { status: 'NORMAL', estimatedRemainingLifePct: 95, operatingHours: 50 })}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30"
                  >
                    Reset / Normal
                  </button>
                  <button
                    onClick={() => updateFilterStage(stage.id, { status: 'CLEANING_REQUIRED' })}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30"
                  >
                    Req Cleaning
                  </button>
                  <button
                    onClick={() => updateFilterStage(stage.id, { status: 'REPLACEMENT_REQUIRED' })}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30"
                  >
                    Req Replace
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance History & Work Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Maintenance Work Orders & Firebase Service Records
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {maintenanceRecords.length} records logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Filter Stage</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Scheduled Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Technician</th>
                <th className="p-3">Sensor Trigger / Notes</th>
                <th className="p-3 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {maintenanceRecords.map((record) => {
                let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                if (record.status === 'COMPLETED') {
                  statusBadge = 'bg-emerald-950 text-emerald-400 border-emerald-500/40';
                } else if (record.status === 'IN_PROGRESS') {
                  statusBadge = 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
                } else {
                  statusBadge = 'bg-amber-950 text-amber-300 border-amber-500/40';
                }

                return (
                  <tr key={record.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-200">{record.id}</td>
                    <td className="p-3 font-semibold text-white">{record.filterName}</td>
                    <td className="p-3 font-mono text-cyan-300">{record.actionType}</td>
                    <td className="p-3 font-mono text-slate-400">{record.scheduledDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${statusBadge}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{record.technician || 'On-call Team'}</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate" title={record.notes}>
                      {record.notes}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => updateMaintenanceStatus(record.id, 'PENDING')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                        title="Mark Pending"
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => updateMaintenanceStatus(record.id, 'IN_PROGRESS')}
                        className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-[10px] text-cyan-300 border border-cyan-800/40"
                        title="Mark In Progress"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateMaintenanceStatus(record.id, 'COMPLETED')}
                        className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-[10px] text-emerald-300 border border-emerald-800/40"
                        title="Mark Completed"
                      >
                        Completed
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Create Maintenance Work Order</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Filter Stage:</label>
                <select
                  value={selectedFilterId}
                  onChange={(e) => setSelectedFilterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {filterStages.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Stage {f.stageNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Action Type:</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CLEANING">CLEANING / BACKWASH</option>
                    <option value="REPLACEMENT">MEDIA REPLACEMENT</option>
                    <option value="INSPECTION">INSPECTION / DELTA-P CHECK</option>
                    <option value="CALIBRATION">PROBE CALIBRATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Urgency:</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LOW">LOW (Planned)</option>
                    <option value="MEDIUM">MEDIUM (Upcoming)</option>
                    <option value="HIGH">HIGH (Action Needed)</option>
                    <option value="CRITICAL">CRITICAL (Immediate)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Scheduled Date:</label>
                  <input
                    type="date"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Technician:</label>
                  <input
                    type="text"
                    value={newTechnician}
                    onChange={(e) => setNewTechnician(e.target.value)}
                    placeholder="e.g. Lead Operator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Work Procedure & Notes:</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detail inspection procedures, replacement cartridge serial, or backwash parameters..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-lg"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
