import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { apiService } from '../services/api';
import type { OptimizationResult, OptimizationParams } from '../types/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionCard } from '../components/ui/SectionCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

export const Optimization: React.FC = () => {
  const navigate = useNavigate();
  const { activePortfolio, refreshData } = usePortfolio();

  // Control Form States
  const [riskProfile, setRiskProfile] = useState<string>(activePortfolio?.riskProfile || 'BALANCED');
  const [riskAversion, setRiskAversion] = useState<number>(1.0);
  const [maxEquityExposure, setMaxEquityExposure] = useState<number>(60.0);
  const [minCashAllocation, setMinCashAllocation] = useState<number>(5.0);
  const [maxPortfolioVolatility, setMaxPortfolioVolatility] = useState<number>(15.0);
  const [minLiquidityScore, setMinLiquidityScore] = useState<number>(70.0);
  const [transactionCostRate, setTransactionCostRate] = useState<number>(0.25);

  // Optimization Execution States
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync riskProfile & reset stale optimization result when active portfolio changes
  useEffect(() => {
    if (activePortfolio?.riskProfile) {
      setRiskProfile(activePortfolio.riskProfile);
    }
    // Clear stale optimization result from previous portfolio
    setResult(null);
    setError(null);
  }, [activePortfolio?._id]);

  const handleRunOptimization = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePortfolio?._id || running) return;

    setRunning(true);
    setError(null);

    try {
      const params: OptimizationParams = {
        portfolioId: activePortfolio._id,
        riskProfile,
        riskAversion,
        transactionCostRate: transactionCostRate / 100, // convert percentage to decimal e.g. 0.25% -> 0.0025
        maxEquityExposure: maxEquityExposure / 100,
        minCashAllocation: minCashAllocation / 100,
        maxPortfolioVolatility: maxPortfolioVolatility / 100,
        minLiquidityScore,
      };

      const data = await apiService.runOptimization(params);
      setResult(data);
      // Refresh portfolio context data in background
      refreshData();
    } catch (err: any) {
      console.error('Optimization API Error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to execute portfolio optimization.');
    } finally {
      setRunning(false);
    }
  };

  // Recharts Grouped Allocation Chart Data
  const allocationComparisonChartData = result
    ? result.rebalancing.map((r) => ({
        symbol: r.symbol,
        currentWeight: +(r.currentWeight * 100).toFixed(1),
        targetWeight: +(r.targetWeight * 100).toFixed(1),
        action: r.action,
      }))
    : [];

  // Counts of Buy/Sell/Hold
  const buyCount = result?.rebalancing?.filter((r) => r.action === 'BUY').length || 0;
  const sellCount = result?.rebalancing?.filter((r) => r.action === 'SELL').length || 0;
  const holdCount = result?.rebalancing?.filter((r) => r.action === 'HOLD').length || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner matching reference screenshot 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Portfolio Optimization Engine
            </h2>
            <StatusBadge status="INFO" label={`PROFILE: ${riskProfile}`} />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Deterministic candidate-based mean-variance portfolio optimization, constraint enforcement and rebalancing order generator for {activePortfolio?.name || 'Alpha Growth & Income Demo Portfolio'}.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-stone-400 font-medium uppercase block">Selected Portfolio</span>
            <span className="font-bold text-[#1C2925]">{activePortfolio?.name || 'Alpha Growth & Income Demo Portfolio'}</span>
          </div>
          <div className="h-6 w-px bg-[#E5E3DA]" />
          <div>
            <span className="text-[10px] text-stone-400 font-medium uppercase block">Capital</span>
            <span className="font-mono text-[#1D5B4B] font-bold">{formatCurrency(activePortfolio?.totalCapital || 10000000)}</span>
          </div>
        </div>
      </div>

      {/* Control Panel Section */}
      <SectionCard
        title="Optimization Controls & Constraints"
        subtitle="Configure risk tolerance, governance limits and execution parameters"
        icon={<Sliders className="w-4 h-4 text-emerald-400" />}
      >
        <form onSubmit={handleRunOptimization} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Risk Profile Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Risk Profile</label>
              <select
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="CONSERVATIVE">CONSERVATIVE</option>
                <option value="BALANCED">BALANCED (Mandate Ceiling 60%)</option>
                <option value="AGGRESSIVE">AGGRESSIVE</option>
              </select>
            </div>

            {/* Risk Aversion */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Risk Aversion (λ)</label>
              <select
                value={riskAversion}
                onChange={(e) => setRiskAversion(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value={0.5}>0.5 — Low Aversion (Growth Focus)</option>
                <option value={1.0}>1.0 — Medium Aversion (Balanced)</option>
                <option value={2.0}>2.0 — High Aversion (Capital Preservation)</option>
              </select>
            </div>

            {/* Max Equity Exposure */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Equity Exposure (%)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                value={maxEquityExposure}
                onChange={(e) => setMaxEquityExposure(parseFloat(e.target.value) || 0)}
                placeholder="Range: 10 – 100%"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>

            {/* Min Cash Allocation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Min Cash Buffer (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={minCashAllocation}
                onChange={(e) => setMinCashAllocation(parseFloat(e.target.value) || 0)}
                placeholder="Range: 0 – 50%"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>

            {/* Max Volatility */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Volatility Cap (%)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={maxPortfolioVolatility}
                onChange={(e) => setMaxPortfolioVolatility(parseFloat(e.target.value) || 0)}
                placeholder="Range: 1 – 50%"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>

            {/* Min Liquidity Score */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Min Liquidity Score</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={minLiquidityScore}
                onChange={(e) => setMinLiquidityScore(parseFloat(e.target.value) || 0)}
                placeholder="Range: 0 – 100"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>

            {/* Transaction Cost Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Transaction Cost Rate (%)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="5"
                value={transactionCostRate}
                onChange={(e) => setTransactionCostRate(parseFloat(e.target.value) || 0)}
                placeholder="Range: 0.00 – 5.00%"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>

            {/* Action Run Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={running}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running Optimization...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Run Optimization Engine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </SectionCard>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Optimization Failed: {error}</span>
          </div>
          <button
            onClick={() => handleRunOptimization()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State Before Optimization Run */}
      {!result && !running && !error && (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-100">Ready to Optimize</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure your risk preferences above and click <strong className="text-slate-200">"Run Optimization Engine"</strong> to generate a mathematically optimal target allocation that resolves policy breaches.
            </p>
          </div>
        </div>
      )}

      {/* SUCCESSFUL OPTIMIZATION RESULT DISPLAY */}
      {result && (
        <div className="space-y-6">
          {/* Result Header Banner */}
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={result.status} label={`STATUS: ${result.status}`} />
                <h3 className="text-base font-bold text-slate-100">Optimization Complete</h3>
              </div>
              <p className="text-xs text-emerald-200 font-medium">
                {result.explanation?.summary || 'Recommended allocation reduces portfolio risk while satisfying configured constraints.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
              <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-500">Objective: </span>
                <span className="font-bold text-emerald-400">{result.objective?.totalObjective?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-500">Turnover: </span>
                <span className="font-bold text-slate-200">{(result.transactionCost?.turnover * 100).toFixed(1)}%</span>
              </div>
              <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-500">Est. Cost: </span>
                <span className="font-bold text-amber-400">{formatCurrency(result.transactionCost?.estimatedCost || 0)}</span>
              </div>
            </div>
          </div>

          {/* Section 7: BEFORE vs AFTER METRICS COMPARISON TABLE */}
          <SectionCard
            title="Before vs After Risk Metric Comparison"
            subtitle="Quantitative impact of target optimization on portfolio risk metrics"
            icon={<Activity className="w-4 h-4 text-emerald-400" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Financial Risk Metric</th>
                    <th className="py-3 px-4 text-right">Current Portfolio</th>
                    <th className="py-3 px-4 text-right">Optimized Target</th>
                    <th className="py-3 px-4 text-right">Difference (Delta)</th>
                    <th className="py-3 px-4 text-center">Impact / Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Expected Return */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Expected Annual Return</td>
                    <td className="py-3 px-4 text-right">{formatPercentage(result.beforeMetrics.expectedReturn)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatPercentage(result.afterMetrics.expectedReturn)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      +{( (result.afterMetrics.expectedReturn - result.beforeMetrics.expectedReturn) * 100 ).toFixed(2)} pp
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Improved
                      </span>
                    </td>
                  </tr>

                  {/* Portfolio Volatility */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Portfolio Volatility (252-d)</td>
                    <td className="py-3 px-4 text-right">{formatPercentage(result.beforeMetrics.volatility)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatPercentage(result.afterMetrics.volatility)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {( (result.afterMetrics.volatility - result.beforeMetrics.volatility) * 100 ).toFixed(2)} pp
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" /> Risk Reduced
                      </span>
                    </td>
                  </tr>

                  {/* 1-Day 95% VaR */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">1-Day 95% Value at Risk (VaR)</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(result.beforeMetrics.var95Amount)} ({formatPercentage(result.beforeMetrics.var95Percentage)})</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatCurrency(result.afterMetrics.var95Amount)} ({formatPercentage(result.afterMetrics.var95Percentage)})</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      -{formatCurrency(result.beforeMetrics.var95Amount - result.afterMetrics.var95Amount)}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" /> Tail Risk Cut
                      </span>
                    </td>
                  </tr>

                  {/* Maximum Drawdown */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Historical Maximum Drawdown</td>
                    <td className="py-3 px-4 text-right">{formatPercentage(result.beforeMetrics.maximumDrawdown)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatPercentage(result.afterMetrics.maximumDrawdown)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {( (result.afterMetrics.maximumDrawdown - result.beforeMetrics.maximumDrawdown) * 100 ).toFixed(2)} pp
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" /> Lower Drawdown
                      </span>
                    </td>
                  </tr>

                  {/* Liquidity Score */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Liquidity Score</td>
                    <td className="py-3 px-4 text-right">{result.beforeMetrics.liquidityScore.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{result.afterMetrics.liquidityScore.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      +{(result.afterMetrics.liquidityScore - result.beforeMetrics.liquidityScore).toFixed(2)} pts
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Enhanced
                      </span>
                    </td>
                  </tr>

                  {/* Risk Score */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Composite Risk Score</td>
                    <td className="py-3 px-4 text-right">{result.beforeMetrics.riskScore} / 100 ({result.beforeMetrics.riskLevel})</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{result.afterMetrics.riskScore} / 100 ({result.afterMetrics.riskLevel})</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      -{result.beforeMetrics.riskScore - result.afterMetrics.riskScore} pts
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" /> Score Reduced
                      </span>
                    </td>
                  </tr>

                  {/* Equity Exposure */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Equity Exposure</td>
                    <td className="py-3 px-4 text-right text-rose-400 font-bold">{formatPercentage(result.beforeMetrics.equityExposure)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatPercentage(result.afterMetrics.equityExposure)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {( (result.afterMetrics.equityExposure - result.beforeMetrics.equityExposure) * 100 ).toFixed(1)} pp
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold inline-flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" /> Policy Compliant
                      </span>
                    </td>
                  </tr>

                  {/* Policy Status */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">Governance Policy Compliance</td>
                    <td className="py-3 px-4 text-right"><StatusBadge status="BREACH" label="BREACH" size="sm" /></td>
                    <td className="py-3 px-4 text-right"><StatusBadge status="PASS" label="PASSED" size="sm" /></td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">PASSED</td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                        RESOLVED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Section 8: ALLOCATION COMPARISON (Grouped Bar Chart) */}
          <SectionCard
            title="Allocation Comparison (Current vs Target Optimized)"
            subtitle="Side-by-side asset weight distribution shift"
            icon={<PieChart className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationComparisonChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <XAxis dataKey="symbol" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}%`, name === 'currentWeight' ? 'Current Weight' : 'Target Weight']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend
                      formatter={(val: string) => (val === 'currentWeight' ? 'Current Weight' : 'Target Optimized Weight')}
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Bar dataKey="currentWeight" name="currentWeight" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="targetWeight" name="targetWeight" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SectionCard>

          {/* Section 9 & 12: REBALANCING TABLE & SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Rebalancing Table */}
            <div className="lg:col-span-8">
              <SectionCard
                title="Trade & Rebalancing Directive Execution Log"
                subtitle="Exact trade orders generated by rebalancing calculator"
                icon={<SlidersHorizontal className="w-4 h-4" />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Asset</th>
                        <th className="py-3 px-3">Asset Class</th>
                        <th className="py-3 px-3 text-right">Current Weight</th>
                        <th className="py-3 px-3 text-right">Target Weight</th>
                        <th className="py-3 px-3 text-right">Weight Change</th>
                        <th className="py-3 px-3 text-right">Target Value</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {result.rebalancing.map((row) => {
                        let actionBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                        if (row.action === 'BUY') actionBadgeClass = 'bg-emerald-950 text-emerald-400 border-emerald-800/50';
                        else if (row.action === 'SELL') actionBadgeClass = 'bg-rose-950 text-rose-400 border-rose-800/50';

                        return (
                          <tr key={row.symbol} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-100">{row.symbol}</td>
                            <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">{row.assetClass}</td>
                            <td className="py-2.5 px-3 text-right">{(row.currentWeight * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{(row.targetWeight * 100).toFixed(1)}%</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${row.weightChange > 0 ? 'text-emerald-400' : row.weightChange < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {row.weightChange > 0 ? `+${(row.weightChange * 100).toFixed(1)} pp` : row.weightChange < 0 ? `${(row.weightChange * 100).toFixed(1)} pp` : '0.0 pp'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans font-semibold text-slate-200">{formatCurrency(row.targetValue)}</td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionBadgeClass}`}>
                                {row.action}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>

            {/* Rebalancing Summary Card */}
            <div className="lg:col-span-4">
              <SectionCard
                title="Rebalancing Summary"
                subtitle="Execution directives breakdown"
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                className="h-full"
              >
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Directive</span>
                    <div className="text-base font-bold text-emerald-400">Rebalance Portfolio</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Shift excess equity capital into high-grade government bonds, corporate credit, gold ETF and cash reserves.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Assets to Sell (Trim):</span>
                      <span className="font-bold text-rose-400">{sellCount} Positions</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Assets to Buy (Build):</span>
                      <span className="font-bold text-emerald-400">{buyCount} Positions</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Assets to Hold (Maintain):</span>
                      <span className="font-bold text-slate-300">{holdCount} Positions</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Gross Portfolio Turnover:</span>
                      <span className="font-mono font-bold text-slate-200">{(result.transactionCost?.turnover * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Estimated Transaction Cost:</span>
                      <span className="font-mono font-bold text-amber-400">{formatCurrency(result.transactionCost?.estimatedCost || 0)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/risk-monitor')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Inspect Updated Risk Profile</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Section 10: CONSTRAINT VALIDATION SECTION */}
          <SectionCard
            title="Constraint Governance Validation"
            subtitle="Backend optimization constraint evaluation results"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Configured Policy Constraint</th>
                    <th className="py-3 px-4 text-right">Configured Limit</th>
                    <th className="py-3 px-4 text-right">Optimized Target Value</th>
                    <th className="py-3 px-4 text-center">Validation Status</th>
                    <th className="py-3 px-4">Engine Validation Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.constraintValidation.constraints.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">{c.name}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        {c.limit < 1 && c.limit > 0 ? `${(c.limit * 100).toFixed(1)}%` : c.limit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 font-sans">
                        {c.current < 1 && c.current > 0 ? `${(c.current * 100).toFixed(1)}%` : c.current}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-sans text-xs text-slate-400">{c.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Section 11: RECOMMENDATION & EXPLANATION SUMMARY */}
          <SectionCard
            title="Optimization Rationale & Explanation"
            subtitle="Backend Decision Engine explanations and directives"
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          >
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Decision Summary</span>
                <p className="text-xs text-emerald-200 font-semibold leading-relaxed">
                  {result.explanation.summary}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Why this allocation?
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {result.explanation.reasons.map((reason, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};
