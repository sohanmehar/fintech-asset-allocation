import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldAlert,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { usePortfolio } from '../context/PortfolioContext';
import { apiService } from '../services/api';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import type {
  ScenarioType,
  ScenarioDefinition,
  ScenarioRunResult,
  AssetShockDetail,
} from '../types/api';

// Currency & percentage formatting helpers
const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatPercent = (val: number): string => {
  const pct = val * 100;
  const prefix = pct > 0 ? '+' : '';
  return `${prefix}${pct.toFixed(2)}%`;
};

export const ScenarioAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { portfolios, selectedPortfolioId, setSelectedPortfolioId, activePortfolio } = usePortfolio();

  // State
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [selectedScenarioType, setSelectedScenarioType] = useState<ScenarioType>('MARKET_CRASH');
  const [customInputValues, setCustomInputValues] = useState<Record<string, string>>({});
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(true);
  const [runningScenario, setRunningScenario] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available scenario definitions from backend
  useEffect(() => {
    const fetchScenarios = async () => {
      setLoadingScenarios(true);
      try {
        const defs = await apiService.getScenarios();
        setScenarios(defs);
      } catch (err: any) {
        console.warn('Failed to load scenarios from backend, using defaults:', err);
        setScenarios([
          {
            type: 'MARKET_CRASH',
            name: 'Market Crash',
            description: 'Equity market shock -20%, gold rally +5%, corporate bond stress -5%.',
          },
          {
            type: 'RATE_SHOCK',
            name: 'Rate Shock',
            description: 'Interest rate surge impacting government bonds (-8%) and corporate debt (-6%).',
          },
          {
            type: 'LIQUIDITY_CRISIS',
            name: 'Liquidity Crisis',
            description: 'Broad asset sell-off with 20% deterioration in market liquidity scores.',
          },
          {
            type: 'SECTOR_SHOCK',
            name: 'Sector Shock',
            description: 'Targeted tech (-15%) & banking (-12%) heavy equities drawdown.',
          },
          {
            type: 'CUSTOM',
            name: 'Custom Stress Test',
            description: 'User-defined asset-level shock matrix.',
            isCustom: true,
          },
        ]);
      } finally {
        setLoadingScenarios(false);
      }
    };

    fetchScenarios();
  }, []);

  // Initialize custom inputs when portfolio changes
  useEffect(() => {
    if (activePortfolio && activePortfolio.holdings) {
      const initialInputs: Record<string, string> = {};
      activePortfolio.holdings.forEach(h => {
        const symbol = typeof h.assetId === 'object' ? h.assetId.symbol : h.symbol || '';
        if (symbol) {
          initialInputs[symbol] = '0';
        }
      });
      setCustomInputValues(initialInputs);
    }
  }, [activePortfolio]);

  // Run scenario calculation via backend API
  const handleRunScenario = async () => {
    if (!selectedPortfolioId) return;

    setRunningScenario(true);
    setError(null);

    try {
      let shocksToSend: Record<string, number> | undefined = undefined;

      if (selectedScenarioType === 'CUSTOM') {
        shocksToSend = {};
        Object.entries(customInputValues).forEach(([symbol, valStr]) => {
          const num = parseFloat(valStr);
          if (!isNaN(num)) {
            const clampedPct = Math.max(-100, Math.min(100, num));
            shocksToSend![symbol] = clampedPct / 100;
          }
        });
      }

      const result = await apiService.runScenario({
        portfolioId: selectedPortfolioId,
        scenarioType: selectedScenarioType,
        customShocks: shocksToSend,
      });

      setScenarioResult(result);
    } catch (err: any) {
      console.error('Error running scenario:', err);
      setError(err?.response?.data?.error || err.message || 'Unable to run stress test scenario.');
    } finally {
      setRunningScenario(false);
    }
  };

  // Handle custom shock input change
  const handleCustomShockChange = (symbol: string, value: string) => {
    setCustomInputValues(prev => ({ ...prev, [symbol]: value }));
  };

  // Navigate to Optimization page with scenario context
  const handleOptimizeForScenario = () => {
    navigate('/optimization', {
      state: {
        fromScenario: true,
        scenarioType: selectedScenarioType,
        portfolioId: selectedPortfolioId,
      },
    });
  };

  // Helper to extract comparison rows from backend snapshots & metric changes
  const getComparisonRows = (res: ScenarioRunResult) => {
    const c = res.currentSnapshot;
    const s = res.stressedSnapshot;
    const m = res.metricChanges as any;

    if (!c || !s || !m) return [];

    return [
      {
        label: 'Expected Return',
        current: `${(c.expectedReturn * 100).toFixed(2)}%`,
        stressed: `${(s.expectedReturn * 100).toFixed(2)}%`,
        change: `${m.expectedReturnDiffPP > 0 ? '+' : ''}${m.expectedReturnDiffPP.toFixed(2)} pp`,
        direction: m.expectedReturnDiffPP < 0 ? 'UNFAVORABLE' : 'FAVORABLE',
      },
      {
        label: 'Portfolio Volatility',
        current: `${(((c.portfolioVolatility ?? c.volatility) || 0) * 100).toFixed(2)}%`,
        stressed: `${(((s.portfolioVolatility ?? s.volatility) || 0) * 100).toFixed(2)}%`,
        change: `${m.volatilityDiffPP > 0 ? '+' : ''}${m.volatilityDiffPP.toFixed(2)} pp`,
        direction: m.volatilityDiffPP > 0 ? 'UNFAVORABLE' : 'FAVORABLE',
      },
      {
        label: '1-Day 95% VaR',
        current: formatCurrency(c.var95Amount),
        stressed: formatCurrency(s.var95Amount),
        change: `${m.var95AmountChange > 0 ? '+' : ''}${formatCurrency(m.var95AmountChange)}`,
        direction: m.var95AmountChange > 0 ? 'UNFAVORABLE' : 'FAVORABLE',
      },
      {
        label: 'Maximum Drawdown',
        current: `${(c.maximumDrawdown * 100).toFixed(2)}%`,
        stressed: `${(s.maximumDrawdown * 100).toFixed(2)}%`,
        change: `${m.maximumDrawdownDiffPP > 0 ? '+' : ''}${m.maximumDrawdownDiffPP.toFixed(2)} pp`,
        direction: m.maximumDrawdownDiffPP > 0 ? 'UNFAVORABLE' : 'FAVORABLE',
      },
      {
        label: 'Liquidity Score',
        current: `${c.liquidityScore.toFixed(1)} / 100`,
        stressed: `${s.liquidityScore.toFixed(1)} / 100`,
        change: `${m.liquidityScoreDiffPts > 0 ? '+' : ''}${m.liquidityScoreDiffPts.toFixed(1)} pts`,
        direction: m.liquidityScoreDiffPts < 0 ? 'UNFAVORABLE' : 'FAVORABLE',
      },
      {
        label: 'Concentration (HHI)',
        current: c.concentrationHHI.toFixed(4),
        stressed: s.concentrationHHI.toFixed(4),
        change: `${m.concentrationHHIDiff > 0 ? '+' : ''}${m.concentrationHHIDiff.toFixed(4)}`,
        direction: m.concentrationHHIDiff > 0 ? 'UNFAVORABLE' : 'NEUTRAL',
      },
      {
        label: 'Risk Score',
        current: `${c.riskScore} (${c.riskLevel})`,
        stressed: `${s.riskScore} (${s.riskLevel})`,
        change: `${m.riskScoreDiffPts > 0 ? '+' : ''}${m.riskScoreDiffPts} pts`,
        direction: m.riskScoreDiffPts > 0 ? 'UNFAVORABLE' : 'FAVORABLE',
      },
      {
        label: 'Equity Exposure',
        current: `${(c.equityExposure * 100).toFixed(1)}%`,
        stressed: `${(s.equityExposure * 100).toFixed(1)}%`,
        change: `${m.equityExposureDiffPP > 0 ? '+' : ''}${m.equityExposureDiffPP.toFixed(1)} pp`,
        direction: 'NEUTRAL',
      },
      {
        label: 'Cash Allocation',
        current: `${(c.cashAllocation * 100).toFixed(1)}%`,
        stressed: `${(s.cashAllocation * 100).toFixed(1)}%`,
        change: `${m.cashAllocationDiffPP > 0 ? '+' : ''}${m.cashAllocationDiffPP.toFixed(1)} pp`,
        direction: 'NEUTRAL',
      },
      {
        label: 'Policy Status',
        current: (c.policyPassed ?? (c.policyStatus === 'PASS')) ? 'PASS' : 'BREACH',
        stressed: (s.policyPassed ?? (s.policyStatus === 'PASS')) ? 'PASS' : 'BREACH',
        change: (s.policyPassed ?? (s.policyStatus === 'PASS')) ? 'Compliance OK' : 'Policy Breach',
        direction: (s.policyPassed ?? (s.policyStatus === 'PASS')) ? 'FAVORABLE' : 'UNFAVORABLE',
      },
    ];
  };

  const lossAmount = scenarioResult
    ? (scenarioResult as any).portfolioValueLoss ?? (scenarioResult as any).metricChanges?.totalCapitalChange ?? (scenarioResult.stressedSnapshot.totalCapital - scenarioResult.currentSnapshot.totalCapital)
    : 0;

  const lossPercent = scenarioResult
    ? (scenarioResult as any).portfolioValueLossPercentage ?? (scenarioResult as any).metricChanges?.totalCapitalChangePercent ?? (lossAmount / (scenarioResult.currentSnapshot.totalCapital || 1))
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Scenario Analysis</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
              Phase 5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stress test portfolio resilience under hypothetical market conditions.
          </p>
        </div>

        {/* Portfolio Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Portfolio:</label>
          <select
            value={selectedPortfolioId}
            onChange={e => {
              setSelectedPortfolioId(e.target.value);
              setScenarioResult(null);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            {portfolios.map(p => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/80 p-4 rounded-xl flex items-center justify-between gap-3 text-red-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRunScenario}
            className="px-3 py-1 bg-red-900/60 hover:bg-red-800/80 text-red-100 rounded text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Scenario Selector Cards */}
      <SectionCard
        title="Select Stress Scenario"
        subtitle="Choose a predefined stress scenario or enter custom asset shocks"
        icon={<Sliders className="w-4 h-4" />}
      >
        {loadingScenarios ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            Loading scenarios...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {scenarios.map(sc => {
                const isSelected = selectedScenarioType === sc.type;
                return (
                  <button
                    key={sc.type}
                    type="button"
                    onClick={() => {
                      setSelectedScenarioType(sc.type);
                      setScenarioResult(null);
                    }}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-100">{sc.name}</span>
                        {isSelected && <Zap className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {sc.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {sc.type === 'CUSTOM' ? 'Custom Inputs' : 'Predefined'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Shock Inputs Matrix */}
            {selectedScenarioType === 'CUSTOM' && activePortfolio && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    Custom Asset Shock % (-100% to +100%)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Numeric percentage input (e.g. -15 for -15%)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {activePortfolio.holdings.map(h => {
                    const symbol = typeof h.assetId === 'object' ? h.assetId.symbol : h.symbol || 'ASSET';
                    const name = typeof h.assetId === 'object' ? h.assetId.name : symbol;
                    const val = customInputValues[symbol] || '0';

                    return (
                      <div key={symbol} className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-lg flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">{symbol}</div>
                          <div className="text-[10px] text-slate-400 truncate">{name}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1"
                            min="-100"
                            max="100"
                            value={val}
                            onChange={e => handleCustomShockChange(symbol, e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono font-bold rounded px-2 py-1 text-right focus:outline-none focus:border-purple-500"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Run Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleRunScenario}
                disabled={runningScenario}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-950/40 border border-purple-500/30 transition-all flex items-center gap-2"
              >
                {runningScenario ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running Stress Test...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Run Stress Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Empty State when no scenario has been run */}
      {!scenarioResult && !runningScenario && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Select a scenario to analyze portfolio resilience.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Evaluate how your portfolio handles market shocks, interest rate surges, sector drawdowns, and liquidity crunches.
          </p>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {scenarioResult && (
        <div className="space-y-6">
          {/* Scenario Result Header & Impact Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                    {scenarioResult.scenarioName}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      lossPercent <= -0.15
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : lossPercent <= -0.05
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {lossPercent <= -0.15
                      ? 'HIGH IMPACT'
                      : lossPercent <= -0.05
                      ? 'MODERATE IMPACT'
                      : 'LOW IMPACT'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{scenarioResult.scenarioDescription}</p>
              </div>

              {/* Action Button: Optimize for Scenario */}
              <button
                type="button"
                onClick={handleOptimizeForScenario}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Optimize for Scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Portfolio Impact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Portfolio Value</span>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {formatCurrency(scenarioResult.currentSnapshot.totalCapital)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Unstressed baseline</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stressed Portfolio Value</span>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {formatCurrency(scenarioResult.stressedSnapshot.totalCapital)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Post-shock valuation</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Loss (₹)</span>
                <div
                  className={`text-xl font-bold mt-1 flex items-center gap-1 ${
                    lossAmount < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {lossAmount < 0 ? (
                    <TrendingDown className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{formatCurrency(lossAmount)}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Monetary capital change</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Loss (%)</span>
                <div
                  className={`text-xl font-bold mt-1 ${
                    lossPercent < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatPercent(lossPercent)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Percentage capital change</div>
              </div>
            </div>
          </div>

          {/* Risk Score Visual & Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Score Visual Card */}
            <SectionCard
              title="Risk Score Visual"
              subtitle="Current vs Stressed risk score shift"
              icon={<ShieldAlert className="w-4 h-4" />}
            >
              <div className="p-4 space-y-6 text-center">
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl w-28">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current</span>
                    <div className="text-2xl font-black text-slate-200 mt-1">
                      {scenarioResult.currentSnapshot.riskScore}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                      {scenarioResult.currentSnapshot.riskLevel}
                    </span>
                  </div>

                  <ArrowRight className="w-6 h-6 text-purple-400 flex-shrink-0" />

                  <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl w-28">
                    <span className="text-[10px] font-bold text-purple-300 uppercase">Stressed</span>
                    <div className="text-2xl font-black text-purple-200 mt-1">
                      {scenarioResult.stressedSnapshot.riskScore}
                    </div>
                    <span className="text-[10px] font-semibold text-purple-300 block mt-0.5">
                      {scenarioResult.stressedSnapshot.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Score Gauge Bar */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Severity Level</span>
                    <span className="text-purple-400 font-mono">
                      {scenarioResult.currentSnapshot.riskScore} → {scenarioResult.stressedSnapshot.riskScore}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, scenarioResult.stressedSnapshot.riskScore)}%` }}
                      className={`h-full transition-all rounded-full ${
                        scenarioResult.stressedSnapshot.riskScore >= 70
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : scenarioResult.stressedSnapshot.riskScore >= 40
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>0 (Low)</span>
                    <span>50 (Moderate)</span>
                    <span>100 (Critical)</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Recommendations Card */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Recommendations"
                subtitle="Deterministic risk mitigation guidance"
                icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
              >
                <div className="p-2 space-y-2">
                  {scenarioResult.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-850 border border-slate-800 p-3 rounded-lg flex items-start gap-3 text-xs text-slate-200"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* RISK BEFORE vs AFTER METRICS TABLE */}
          <SectionCard
            title="Risk Before vs After"
            subtitle="Comparison of core risk & exposure metrics before and after stress scenario"
            icon={<BarChart3 className="w-4 h-4" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Metric</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">Stressed</th>
                    <th className="p-3 text-right">Change</th>
                    <th className="p-3 text-center">Impact Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {getComparisonRows(scenarioResult).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-200">{row.label}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{row.current}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-100">{row.stressed}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span
                          className={
                            row.direction === 'UNFAVORABLE'
                              ? 'text-red-400'
                              : row.direction === 'FAVORABLE'
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }
                        >
                          {row.change}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {row.direction === 'UNFAVORABLE' ? (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-bold uppercase">
                            Unfavorable
                          </span>
                        ) : row.direction === 'FAVORABLE' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase">
                            Favorable
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-medium uppercase">
                            Neutral
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ASSET IMPACT CHART & TABLE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horizontal Bar Chart (Recharts) */}
            <SectionCard
              title="Asset Impact Chart"
              subtitle="Asset-level monetary impact ₹ (largest losses first)"
              icon={<TrendingDown className="w-4 h-4" />}
            >
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={scenarioResult.assetImpacts.map(a => ({
                      symbol: a.symbol,
                      impact: a.impactAmount,
                    }))}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`}
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis dataKey="symbol" type="category" stroke="#94a3b8" style={{ fontSize: '11px' }} width={80} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Impact ₹']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {scenarioResult.assetImpacts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.impactAmount < 0 ? '#ef4444' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Asset Impact Table */}
            <SectionCard
              title="Asset Impact Table"
              subtitle="Per-asset shock percentages and value deterioration"
              icon={<BarChart3 className="w-4 h-4" />}
            >
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Asset</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Shock</th>
                      <th className="p-2.5 text-right">Current</th>
                      <th className="p-2.5 text-right">Stressed</th>
                      <th className="p-2.5 text-right">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {scenarioResult.assetImpacts.map((a: AssetShockDetail) => {
                      const shockVal = a.shockPercentage ?? a.shock ?? 0;
                      return (
                        <tr key={a.assetId} className="hover:bg-slate-850/50">
                          <td className="p-2.5 font-bold text-slate-200">{a.symbol}</td>
                          <td className="p-2.5 text-[10px] text-slate-400">{a.assetClass}</td>
                          <td className="p-2.5 font-mono font-semibold">
                            <span className={shockVal < 0 ? 'text-red-400' : shockVal > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                              {formatPercent(shockVal)}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-300">{formatCurrency(a.currentValue)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-100">{formatCurrency(a.stressedValue)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">
                            <span className={a.impactAmount < 0 ? 'text-red-400' : 'text-emerald-400'}>
                              {formatCurrency(a.impactAmount)}
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

          {/* POLICY BREACHES / GOVERNANCE */}
          <SectionCard
            title="Policy Breaches"
            subtitle="Policy compliance evaluation under stressed portfolio conditions"
            icon={<ShieldAlert className="w-4 h-4" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Policy</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">Stressed</th>
                    <th className="p-3 text-right">Limit</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scenarioResult.policyEvaluation.breaches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        No policy breaches detected under this scenario.
                      </td>
                    </tr>
                  ) : (
                    scenarioResult.policyEvaluation.breaches.map((b: any, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50">
                        <td className="p-3 font-semibold text-slate-200">{b.type || b.policyName}</td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          {typeof b.currentValue === 'number'
                            ? b.currentValue <= 1.0
                              ? `${(b.currentValue * 100).toFixed(1)}%`
                              : b.currentValue.toFixed(2)
                            : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-100">
                          {typeof b.stressedValue === 'number'
                            ? b.stressedValue <= 1.0
                              ? `${(b.stressedValue * 100).toFixed(1)}%`
                              : b.stressedValue.toFixed(2)
                            : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {typeof b.limit === 'number'
                            ? b.limit <= 1.0
                              ? `${(b.limit * 100).toFixed(1)}%`
                              : b.limit.toFixed(2)
                            : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={b.severity || 'BREACH'} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};
