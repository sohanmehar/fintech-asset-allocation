import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { apiService } from '../services/api';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { AlertItem } from '../types/api';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const { portfolios, selectedPortfolioId, setSelectedPortfolioId } = usePortfolio();

  // State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getAlerts(selectedPortfolioId || undefined);
      setAlerts(data);
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError('Unable to load alerts from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedPortfolioId]);

  // Generate / refresh alerts for selected portfolio
  const handleGenerateAlerts = async () => {
    if (!selectedPortfolioId) return;
    setGenerating(true);
    try {
      const updatedAlerts = await apiService.generateAlerts(selectedPortfolioId);
      setAlerts(updatedAlerts);
    } catch (err: any) {
      console.error('Error generating alerts:', err);
      setError('Failed to generate alerts.');
    } finally {
      setGenerating(false);
    }
  };

  // Acknowledge Alert
  const handleAcknowledge = async (alertId: string) => {
    setActionLoadingId(alertId);
    try {
      const updated = await apiService.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => (a._id === alertId ? updated : a)));
      if (selectedAlert && selectedAlert._id === alertId) {
        setSelectedAlert(updated);
      }
    } catch (err: any) {
      console.error('Error acknowledging alert:', err);
      setError('Failed to acknowledge alert.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Resolve Alert
  const handleResolve = async (alertId: string) => {
    setActionLoadingId(alertId);
    try {
      const updated = await apiService.resolveAlert(alertId);
      setAlerts(prev => prev.map(a => (a._id === alertId ? updated : a)));
      if (selectedAlert && selectedAlert._id === alertId) {
        setSelectedAlert(updated);
      }
    } catch (err: any) {
      console.error('Error resolving alert:', err);
      setError('Failed to resolve alert.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (selectedFilter === 'HIGH') return a.severity === 'HIGH';
    if (selectedFilter === 'WARNING') return a.severity === 'WARNING';
    if (selectedFilter === 'OPEN') return a.status === 'OPEN';
    if (selectedFilter === 'ACKNOWLEDGED') return a.status === 'ACKNOWLEDGED';
    if (selectedFilter === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  // Summary Counts
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH' && a.status !== 'RESOLVED').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING' && a.status !== 'RESOLVED').length;
  const openCount = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Alerts & Governance Center
            </h2>
            <StatusBadge status="WARNING" label="POLICY BREACH DETECTED" />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Monitor policy breaches, risk warnings and governance actions for {portfolios.find(p => p._id === selectedPortfolioId)?.name || 'Alpha Growth & Income Demo Portfolio'}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <select
            value={selectedPortfolioId}
            onChange={e => setSelectedPortfolioId(e.target.value)}
            className="bg-white border border-[#E5E3DA] text-[#1C2925] text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
          >
            {portfolios.map(p => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerateAlerts}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1D5B4B] hover:bg-[#16483B] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${generating ? 'animate-spin' : ''}`} />
            <span>Generate / Evaluate Breaches</span>
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="p-4 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl flex items-center gap-3 text-xs text-[#8C2C1E] font-medium">
          <AlertTriangle className="w-4 h-4 text-[#A63A2B] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FAF9F5] border border-[#F6D0C9] p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-[#A63A2B] uppercase tracking-wider">Critical Alerts</span>
            <div className="text-2xl font-extrabold text-[#1C2925] mt-1">{criticalCount}</div>
            <div className="text-[10px] text-stone-500 font-medium mt-0.5">Immediate action required</div>
          </div>
          <div className="p-3 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl text-[#A63A2B]">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF9F5] border border-[#F2DEB8] p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-[#925F18] uppercase tracking-wider">High Alerts</span>
            <div className="text-2xl font-extrabold text-[#1C2925] mt-1">{highCount}</div>
            <div className="text-[10px] text-stone-500 font-medium mt-0.5">Policy limits exceeded</div>
          </div>
          <div className="p-3 bg-[#FBF2E3] border border-[#F2DEB8] rounded-xl text-[#925F18]">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF9F5] border border-[#F2DEB8] p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-[#925F18] uppercase tracking-wider">Warning Alerts</span>
            <div className="text-2xl font-extrabold text-[#1C2925] mt-1">{warningCount}</div>
            <div className="text-[10px] text-stone-500 font-medium mt-0.5">Approaching limit thresholds</div>
          </div>
          <div className="p-3 bg-[#FBF2E3] border border-[#F2DEB8] rounded-xl text-[#925F18]">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E3DA] p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-[#1D5B4B] uppercase tracking-wider">Open Alerts</span>
            <div className="text-2xl font-extrabold text-[#1C2925] mt-1">{openCount}</div>
            <div className="text-[10px] text-stone-500 font-medium mt-0.5">Pending resolution</div>
          </div>
          <div className="p-3 bg-[#E3EBE4] border border-[#C5D7C8] rounded-xl text-[#1D5B4B]">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER TABS & MAIN TABLE */}
      <SectionCard
        title="Governance Alert Trail"
        subtitle="Comprehensive log of portfolio risk policy alerts and resolution statuses"
        icon={<Bell className="w-4 h-4 text-[#A63A2B]" />}
      >
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#E5E3DA]">
            <Filter className="w-3.5 h-3.5 text-stone-500 mr-1" />
            {['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedFilter === tab
                    ? 'bg-[#1D5B4B] text-white shadow-2xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#E5E3DA]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Alert Table */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
              Loading alerts from backend governance engine...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No alerts match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Severity</th>
                    <th className="p-3">Alert</th>
                    <th className="p-3">Metric</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">Limit</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Created</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAlerts.map(alert => (
                    <tr
                      key={alert._id}
                      onClick={() => setSelectedAlert(alert)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                    >
                      {/* Severity */}
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : alert.severity === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : alert.severity === 'WARNING'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      {/* Title & Message */}
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-slate-200 truncate">{alert.title || alert.type}</div>
                        <div className="text-[11px] text-slate-400 truncate">{alert.message}</div>
                      </td>

                      {/* Metric */}
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        {alert.metric || alert.type}
                      </td>

                      {/* Current */}
                      <td className="p-3 text-right font-mono font-bold text-slate-100">
                        {alert.currentValue !== undefined
                          ? alert.currentValue <= 1.0
                            ? `${(alert.currentValue * 100).toFixed(1)}%`
                            : alert.currentValue.toFixed(1)
                          : '-'}
                      </td>

                      {/* Limit */}
                      <td className="p-3 text-right font-mono text-slate-400">
                        {alert.limitValue !== undefined || alert.threshold !== undefined
                          ? ((alert.limitValue ?? alert.threshold)! <= 1.0
                            ? `${((alert.limitValue ?? alert.threshold)! * 100).toFixed(1)}%`
                            : (alert.limitValue ?? alert.threshold)!.toFixed(1))
                          : '-'}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <StatusBadge status={alert.status} size="sm" />
                      </td>

                      {/* Created */}
                      <td className="p-3 text-right text-[10px] text-slate-400 font-mono">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {alert.status === 'OPEN' && (
                            <button
                              onClick={() => handleAcknowledge(alert._id)}
                              disabled={actionLoadingId === alert._id}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 rounded border border-slate-700"
                            >
                              Acknowledge
                            </button>
                          )}
                          {alert.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleResolve(alert._id)}
                              disabled={actionLoadingId === alert._id}
                              className="px-2 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 text-[10px] font-semibold text-emerald-300 rounded border border-emerald-700/50"
                            >
                              Resolve
                            </button>
                          )}
                          {alert.status === 'RESOLVED' && (
                            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Resolved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ALERT DETAIL MODAL / DRAWER */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      selectedAlert.severity === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : selectedAlert.severity === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {selectedAlert.severity}
                  </span>
                  <StatusBadge status={selectedAlert.status} size="sm" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title || selectedAlert.type}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-200 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Why alert exists */}
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alert Reason</span>
              <p className="text-xs text-slate-200 leading-relaxed">{selectedAlert.message}</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block">Current Value</span>
                <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
                  {selectedAlert.currentValue !== undefined
                    ? selectedAlert.currentValue <= 1.0
                      ? `${(selectedAlert.currentValue * 100).toFixed(1)}%`
                      : selectedAlert.currentValue.toFixed(1)
                    : '-'}
                </span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block">Policy Limit</span>
                <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
                  {(selectedAlert.limitValue ?? selectedAlert.threshold) !== undefined
                    ? (selectedAlert.limitValue ?? selectedAlert.threshold)! <= 1.0
                      ? `${((selectedAlert.limitValue ?? selectedAlert.threshold)! * 100).toFixed(1)}%`
                      : (selectedAlert.limitValue ?? selectedAlert.threshold)!.toFixed(1)
                    : '-'}
                </span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block">Excess</span>
                <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">
                  {selectedAlert.excessValue !== undefined
                    ? selectedAlert.excessValue <= 1.0
                      ? `+${(selectedAlert.excessValue * 100).toFixed(1)} pp`
                      : `+${selectedAlert.excessValue.toFixed(1)}`
                    : '-'}
                </span>
              </div>
            </div>

            {/* Recommendation */}
            {selectedAlert.recommendation && (
              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Actionable Recommendation
                </span>
                <p className="text-xs text-rose-200 leading-relaxed">{selectedAlert.recommendation}</p>
              </div>
            )}

            {/* Metadata & Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-mono">
                Source: {selectedAlert.source || 'GOVERNANCE_ENGINE'}
              </div>

              <div className="flex items-center gap-2">
                {selectedAlert.status === 'OPEN' && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlert._id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700"
                  >
                    Acknowledge
                  </button>
                )}
                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(selectedAlert._id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg shadow-sm"
                  >
                    Resolve Alert
                  </button>
                )}
                <button
                  onClick={() => navigate('/optimization')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-1"
                >
                  <span>Optimize</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
