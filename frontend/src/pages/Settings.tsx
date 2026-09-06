import React, { useState, useEffect } from 'react';
import {
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  History,
} from 'lucide-react';
import { apiService } from '../services/api';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { RiskPolicy, AuditLogItem } from '../types/api';

export const Settings: React.FC = () => {
  // Policies & Active Selection State
  const [policies, setPolicies] = useState<RiskPolicy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [loadingPolicies, setLoadingPolicies] = useState<boolean>(true);
  const [savingPolicy, setSavingPolicy] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields State (represented in percentages for UI)
  const [maxEquityExposure, setMaxEquityExposure] = useState<number>(60);
  const [maxIndividualAssetWeight, setMaxIndividualAssetWeight] = useState<number>(30);
  const [minCashAllocation, setMinCashAllocation] = useState<number>(5);
  const [minLiquidityScore, setMinLiquidityScore] = useState<number>(70);
  const [maxPortfolioVolatility, setMaxPortfolioVolatility] = useState<number>(15);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(20);
  const [warningThreshold, setWarningThreshold] = useState<number>(85);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(true);

  // Fetch Risk Policies from Backend
  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const data = await apiService.getRiskPolicies();
      setPolicies(data);
      if (data.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(data[0]._id);
        populateForm(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching risk policies:', err);
      setErrorMessage('Unable to load risk policies from backend server.');
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Fetch Audit Logs from Backend
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await apiService.getAuditLogs(undefined, undefined, 50);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchAuditLogs();
  }, []);

  // Populate Form Fields when selected policy changes
  const populateForm = (policy: RiskPolicy) => {
    setMaxEquityExposure(policy.maxEquityExposure * 100);
    setMaxIndividualAssetWeight(policy.maxIndividualAssetWeight * 100);
    setMinCashAllocation(policy.minCashAllocation * 100);
    setMinLiquidityScore(policy.minLiquidityScore);
    setMaxPortfolioVolatility(policy.maxPortfolioVolatility * 100);
    setMaxDrawdown(policy.maxDrawdown * 100);
    setWarningThreshold(
      policy.warningThreshold <= 1.0 ? policy.warningThreshold * 100 : policy.warningThreshold
    );
  };

  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicyId(policyId);
    const pol = policies.find(p => p._id === policyId);
    if (pol) {
      populateForm(pol);
    }
  };

  // Save Policy Handler
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicyId) return;

    setSavingPolicy(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updates: Partial<RiskPolicy> = {
        maxEquityExposure: maxEquityExposure / 100,
        maxIndividualAssetWeight: maxIndividualAssetWeight / 100,
        minCashAllocation: minCashAllocation / 100,
        minLiquidityScore: minLiquidityScore,
        maxPortfolioVolatility: maxPortfolioVolatility / 100,
        maxDrawdown: maxDrawdown / 100,
        warningThreshold: warningThreshold / 100,
      };

      const updatedPolicy = await apiService.updateRiskPolicy(selectedPolicyId, updates);
      
      // Update local state list with saved backend object
      setPolicies(prev => prev.map(p => (p._id === updatedPolicy._id ? updatedPolicy : p)));
      populateForm(updatedPolicy);
      setSuccessMessage(`Risk Policy '${updatedPolicy.name}' updated successfully.`);
      
      // Refresh audit logs after update
      fetchAuditLogs();
    } catch (err: any) {
      console.error('Error saving risk policy:', err);
      setErrorMessage(err?.response?.data?.error || err.message || 'Failed to save risk policy parameters.');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Platform Settings & Governance
            </h2>
            <StatusBadge status="PASS" label="GOVERNANCE: ACTIVE" />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Configure risk policies, governance parameters, and inspect the platform audit trail.
          </p>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="bg-[#E3EBE4] border border-[#C5D7C8] p-4 rounded-xl flex items-center justify-between text-[#1D5B4B] text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1D5B4B] flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-[#1D5B4B] hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#FDF0ED] border border-[#F6D0C9] p-4 rounded-xl flex items-center justify-between text-[#8C2C1E] text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#A63A2B] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#8C2C1E] hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* RISK POLICY CONFIGURATION SECTION */}
      <SectionCard
        title="Risk Policy Configuration"
        subtitle="Manage governance boundaries, exposure limits, and alert thresholds"
        icon={<Shield className="w-4 h-4 text-[#1D5B4B]" />}
      >
        {loadingPolicies ? (
          <div className="p-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1D5B4B]" />
            Loading risk policies...
          </div>
        ) : (
          <form onSubmit={handleSavePolicy} className="space-y-6">
            {/* Policy Selector Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#E5E3DA] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Target Risk Profile:</span>
                <select
                  value={selectedPolicyId}
                  onChange={e => handlePolicySelect(e.target.value)}
                  className="bg-[#FAF9F5] border border-[#E5E3DA] rounded-lg px-3 py-1.5 text-xs text-[#1C2925] font-bold focus:outline-none cursor-pointer"
                >
                  {policies.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-stone-500 font-medium">
                Changes recorded in immutable governance audit log
              </div>
            </div>

            {/* Threshold Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Max Equity Exposure */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Max Equity Exposure Ceiling</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={maxEquityExposure}
                    onChange={e => setMaxEquityExposure(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">Upper ceiling for total equity allocation</span>
              </div>

              {/* Max Individual Asset Weight */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Max Individual Asset Weight</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={maxIndividualAssetWeight}
                    onChange={e => setMaxIndividualAssetWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">Single security concentration limit</span>
              </div>

              {/* Min Cash Allocation */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Minimum Cash Allocation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={minCashAllocation}
                    onChange={e => setMinCashAllocation(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">Mandated liquidity cash reserve floor</span>
              </div>

              {/* Min Liquidity Score */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Minimum Liquidity Score</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={minLiquidityScore}
                    onChange={e => setMinLiquidityScore(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">pts</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">Tier-weighted liquidity score minimum (0-100)</span>
              </div>

              {/* Max Portfolio Volatility */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Max Portfolio Volatility</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={maxPortfolioVolatility}
                    onChange={e => setMaxPortfolioVolatility(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">Annualized volatility threshold</span>
              </div>

              {/* Max Drawdown */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Maximum Drawdown</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={maxDrawdown}
                    onChange={e => setMaxDrawdown(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">Peak-to-trough historical drawdown ceiling</span>
              </div>

              {/* Warning Threshold */}
              <div className="bg-white border border-[#E5E3DA] p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1C2925] block">Warning Threshold Ratio</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={warningThreshold}
                    onChange={e => setWarningThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium block">% of limit triggering pre-breach warning alert</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-[#E5E3DA]">
              <button
                type="submit"
                disabled={savingPolicy}
                className="px-6 py-2.5 bg-[#1D5B4B] hover:bg-[#133E35] disabled:bg-stone-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {savingPolicy ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Policy...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Policy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      {/* AUDIT TRAIL UI SECTION (PART 14) */}
      <SectionCard
        title="Audit Trail"
        subtitle="Immutable historical audit log of risk evaluations, optimizations, scenarios, and governance actions"
        icon={<History className="w-4 h-4 text-purple-400" />}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">System Actions History</span>
            <button
              onClick={fetchAuditLogs}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 rounded-lg flex items-center gap-1 border border-slate-700"
            >
              <RefreshCw className={`w-3 h-3 ${loadingAudit ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {loadingAudit ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Loading audit logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Entity ID</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLogs.map((log: AuditLogItem) => (
                    <tr key={log._id} className="hover:bg-slate-850/50">
                      <td className="p-3 text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.action.includes('OPTIMIZATION')
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : log.action.includes('SCENARIO')
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : log.action.includes('POLICY')
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.action.includes('ALERT')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{log.entityType}</td>
                      <td className="p-3 text-slate-400 text-[10px]">{log.entityId || '-'}</td>
                      <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate font-sans">
                        {JSON.stringify(log.details || log.metadata || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
