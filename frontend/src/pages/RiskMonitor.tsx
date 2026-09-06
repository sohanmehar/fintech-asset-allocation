import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';
import type { RiskBreach } from '../types/api';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionCard } from '../components/ui/SectionCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { RiskScoreCard } from '../components/dashboard/RiskScoreCard';
import { RiskBreakdown } from '../components/dashboard/RiskBreakdown';
import type { BreakdownData } from '../components/dashboard/RiskBreakdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  TrendingUp,
  Activity,
  AlertOctagon,
  Droplets,
  SlidersHorizontal,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Grid,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const RiskMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { activePortfolio, riskReport, loading, error, refreshData } = usePortfolio();

  // Metrics from API
  const expectedReturn = riskReport?.metrics?.expectedReturn ?? 0.1087;
  const portfolioVolatility = riskReport?.metrics?.portfolioVolatility ?? 0.0683;
  const var95Value = riskReport?.metrics?.var95?.amount ?? 70729;
  const var95Percent = riskReport?.metrics?.var95?.percentage ?? 0.0071;
  const riskScore = riskReport?.riskScore?.score ?? 49;
  const riskLevel = riskReport?.riskScore?.level ?? 'MODERATE';
  const liquidityScore = riskReport?.metrics?.liquidityScore ?? 93.04;
  const maxDrawdown = riskReport?.metrics?.maximumDrawdown ?? 0.0727;

  // Concentration / HHI metrics
  const hhiVal = riskReport?.metrics?.concentration?.hhi ?? 0.1288;
  const concentrationLevel = riskReport?.metrics?.concentration?.concentrationLevel ?? 'LOW';

  // Primary concern & policy breaches
  const breachesList: RiskBreach[] = riskReport?.policyEvaluation?.breaches || [];
  const equityBreach = breachesList.find((b) => b.type?.toLowerCase().includes('equity'));

  const primaryIssue = equityBreach
    ? equityBreach.message
    : 'Equity exposure exceeds maximum allowed allocation.';

  // Map factor scores for Recharts Risk Driver Chart
  const factorScoresData = [
    {
      name: 'Volatility',
      score: riskReport?.riskScore?.breakdown?.volatility?.score ?? 45.5,
      weight: (riskReport?.riskScore?.breakdown?.volatility?.weight ?? 0.30) * 100,
      color: '#10b981',
    },
    {
      name: 'VaR 95%',
      score: riskReport?.riskScore?.breakdown?.var?.score ?? 45.5,
      weight: (riskReport?.riskScore?.breakdown?.var?.weight ?? 0.25) * 100,
      color: '#3b82f6',
    },
    {
      name: 'Concentration',
      score: riskReport?.riskScore?.breakdown?.concentration?.score ?? 51.5,
      weight: (riskReport?.riskScore?.breakdown?.concentration?.weight ?? 0.15) * 100,
      color: '#f59e0b',
    },
    {
      name: 'Drawdown',
      score: riskReport?.riskScore?.breakdown?.drawdown?.score ?? 36.3,
      weight: (riskReport?.riskScore?.breakdown?.drawdown?.weight ?? 0.15) * 100,
      color: '#a855f7',
    },
    {
      name: 'Liquidity Risk',
      score: riskReport?.riskScore?.breakdown?.liquidity?.score ?? 75.2,
      weight: (riskReport?.riskScore?.breakdown?.liquidity?.weight ?? 0.15) * 100,
      color: '#f43f5e',
    },
  ];

  // Risk policy limits & breaches from API
  const cashBreach = breachesList.find((b) => b.type?.toLowerCase().includes('cash'));
  const volBreach = breachesList.find((b) => b.type?.toLowerCase().includes('volatility'));
  const liqBreach = breachesList.find((b) => b.type?.toLowerCase().includes('liquidity'));
  const drawdownBreach = breachesList.find((b) => b.type?.toLowerCase().includes('drawdown'));

  const equityLimitPct = (equityBreach?.limit !== undefined ? equityBreach.limit : 0.60) * 100;
  const cashLimitPct = (cashBreach?.limit !== undefined ? cashBreach.limit : 0.05) * 100;
  const volLimitPct = (volBreach?.limit !== undefined ? volBreach.limit : 0.15) * 100;
  const liqLimitVal = liqBreach?.limit !== undefined ? liqBreach.limit : 70.0;
  const drawdownLimitPct = (drawdownBreach?.limit !== undefined ? drawdownBreach.limit : 0.20) * 100;

  // Policy compliance limit bars
  const policyComplianceData = [
    {
      id: 'equity',
      label: 'Equity Exposure',
      currentValue: (riskReport?.metrics?.equityExposure ?? 0.68) * 100,
      limitValue: equityLimitPct,
      unit: '%',
      status: (equityBreach ? equityBreach.severity : 'BREACH') as any,
      limitType: 'MAX' as const,
      formattedCurrent: `${((riskReport?.metrics?.equityExposure ?? 0.68) * 100).toFixed(1)}%`,
      formattedLimit: `${equityLimitPct.toFixed(1)}%`,
    },
    {
      id: 'cash',
      label: 'Minimum Cash Allocation',
      currentValue: (riskReport?.metrics?.cashAllocation ?? 0.05) * 100,
      limitValue: cashLimitPct,
      unit: '%',
      status: (cashBreach ? cashBreach.severity : 'PASS') as any,
      limitType: 'MIN' as const,
      formattedCurrent: `${((riskReport?.metrics?.cashAllocation ?? 0.05) * 100).toFixed(1)}%`,
      formattedLimit: `${cashLimitPct.toFixed(1)}%`,
    },
    {
      id: 'volatility',
      label: 'Portfolio Volatility',
      currentValue: portfolioVolatility * 100,
      limitValue: volLimitPct,
      unit: '%',
      status: (volBreach ? volBreach.severity : 'PASS') as any,
      limitType: 'MAX' as const,
      formattedCurrent: formatPercentage(portfolioVolatility),
      formattedLimit: `${volLimitPct.toFixed(2)}%`,
    },
    {
      id: 'liquidity',
      label: 'Portfolio Liquidity Score',
      currentValue: liquidityScore,
      limitValue: liqLimitVal,
      unit: 'pts',
      status: (liqBreach ? liqBreach.severity : 'PASS') as any,
      limitType: 'MIN' as const,
      formattedCurrent: liquidityScore.toFixed(2),
      formattedLimit: liqLimitVal.toFixed(2),
    },
    {
      id: 'drawdown',
      label: 'Maximum Drawdown',
      currentValue: maxDrawdown * 100,
      limitValue: drawdownLimitPct,
      unit: '%',
      status: (drawdownBreach ? drawdownBreach.severity : 'PASS') as any,
      limitType: 'MAX' as const,
      formattedCurrent: formatPercentage(maxDrawdown),
      formattedLimit: `${drawdownLimitPct.toFixed(2)}%`,
    },
    {
      id: 'assetWeight',
      label: 'Individual Asset Weight Cap',
      currentValue: (riskReport?.metrics?.concentration?.largestHoldingWeight ?? 0.20) * 100,
      limitValue: (riskReport?.metrics?.concentration?.maxWeightAllowed ?? 0.30) * 100,
      unit: '%',
      status: 'PASS' as const,
      limitType: 'MAX' as const,
      formattedCurrent: `${((riskReport?.metrics?.concentration?.largestHoldingWeight ?? 0.20) * 100).toFixed(1)}%`,
      formattedLimit: `${((riskReport?.metrics?.concentration?.maxWeightAllowed ?? 0.30) * 100).toFixed(1)}%`,
    },
  ];

  // Recommendations data from backend
  const recommendationsList = riskReport?.recommendations?.length
    ? riskReport.recommendations
    : [
        'Reduce equity exposure by 8.0 percentage points and reallocate to government bonds, corporate credit, or liquid cash reserves.',
      ];

  // Mapped breakdown structure for RiskBreakdown component
  const mappedBreakdown: BreakdownData | undefined = riskReport?.riskScore?.breakdown
    ? {
        volatilityScore: riskReport.riskScore.breakdown.volatility?.score ?? 45.5,
        varScore: riskReport.riskScore.breakdown.var?.score ?? 45.5,
        concentrationScore: riskReport.riskScore.breakdown.concentration?.score ?? 51.5,
        drawdownScore: riskReport.riskScore.breakdown.drawdown?.score ?? 36.3,
        liquidityScore: riskReport.riskScore.breakdown.liquidity?.score ?? 75.2,
        weights: {
          volatility: riskReport.riskScore.breakdown.volatility?.weight ?? 0.30,
          var: riskReport.riskScore.breakdown.var?.weight ?? 0.25,
          concentration: riskReport.riskScore.breakdown.concentration?.weight ?? 0.15,
          drawdown: riskReport.riskScore.breakdown.drawdown?.weight ?? 0.15,
          liquidity: riskReport.riskScore.breakdown.liquidity?.weight ?? 0.15,
        },
      }
    : undefined;

  // Correlation Matrix from API
  const correlationObj = riskReport?.correlationMatrix;
  const matrixAssets = correlationObj?.assets || ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'GSEC10Y', 'CORPBOND', 'GOLDBEES', 'CASH'];
  const matrixData = correlationObj?.matrix;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Real-Time Risk Monitor
            </h2>
            <StatusBadge status="WARNING" label="MONITOR STATUS: Active Breach" />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Multi-factor portfolio risk indicators, tail-loss estimation, concentration limits and correlation heatmap for {activePortfolio?.name || 'Alpha Growth & Income Demo Portfolio'}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#EAE8E1] text-[#1C2925] rounded-lg text-xs font-bold transition-all border border-[#E5E3DA] shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1D5B4B] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Risk Engine</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl flex items-center justify-between gap-3 text-xs text-[#8C2C1E]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#A63A2B] shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Expected Return"
          value={formatPercentage(expectedReturn)}
          subtitle="Annualized Expected Mean"
          badge={<StatusBadge status="PASS" label="POSITIVE" />}
          icon={<TrendingUp className="w-4 h-4 text-[#1D5B4B]" />}
          loading={loading}
        />
        <MetricCard
          title="Portfolio Volatility"
          value={formatPercentage(portfolioVolatility)}
          subtitle="Annualized Standard Dev"
          badge={<StatusBadge status="PASS" label="NORMAL" />}
          icon={<Activity className="w-4 h-4 text-[#1D5B4B]" />}
          loading={loading}
        />
        <MetricCard
          title="1-Day 95% VaR"
          value={formatCurrency(var95Value)}
          subtitle={`${formatPercentage(var95Percent)} parametric tail loss`}
          icon={<ShieldAlert className="w-4 h-4 text-[#A63A2B]" />}
          loading={loading}
        />
        <MetricCard
          title="Maximum Drawdown"
          value={formatPercentage(maxDrawdown)}
          subtitle="Historical Peak-to-Trough"
          badge={<StatusBadge status="PASS" label="NORMAL" />}
          icon={<AlertOctagon className="w-4 h-4 text-[#1D5B4B]" />}
          loading={loading}
        />
        <MetricCard
          title="Concentration HHI"
          value={formatNumber(hhiVal, 4)}
          subtitle={`${concentrationLevel} Concentration`}
          badge={<StatusBadge status="PASS" label={concentrationLevel} />}
          icon={<Grid className="w-4 h-4 text-[#1D5B4B]" />}
          loading={loading}
        />
        <MetricCard
          title="Liquidity Score"
          value={formatNumber(liquidityScore, 2)}
          subtitle="Tier-Weighted Liquidity"
          badge={<StatusBadge status="PASS" label="HIGH" />}
          icon={<Droplets className="w-4 h-4 text-[#1D5B4B]" />}
          loading={loading}
        />
      </div>

      {/* Grid Row 2: Composite Risk Score + Factor Drivers Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <RiskScoreCard
            score={riskScore}
            level={riskLevel}
            primaryConcern={primaryIssue}
            isLoading={loading}
          />
        </div>

        <div className="lg:col-span-6">
          <SectionCard
            title="Risk Factor Drivers"
            subtitle="Normalized sub-score contributions (0-100)"
            icon={<BarChart className="w-4 h-4 text-[#1D5B4B]" />}
            className="h-full"
          >
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D5B4B]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={factorScoresData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke="#6C7471" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis stroke="#6C7471" tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toFixed(1)} / 100`, 'Sub-Score']}
                        contentStyle={{ backgroundColor: '#FAF9F5', borderColor: '#E5E3DA', borderRadius: '8px', fontSize: '12px', color: '#1C2925' }}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {factorScoresData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Grid Row 3: Policy Compliance Matrix */}
      <SectionCard
        title="Policy Compliance Matrix"
        subtitle="Mandated governance threshold compliance matrix"
        icon={<SlidersHorizontal className="w-4 h-4 text-[#1D5B4B]" />}
      >
        {loading ? (
          <div className="animate-pulse space-y-4 py-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-[#EAE8E1] rounded" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {policyComplianceData.map((item) => (
              <ProgressBar
                key={item.id}
                label={item.label}
                currentValue={item.currentValue}
                limitValue={item.limitValue}
                unit={item.unit}
                status={item.status}
                limitType={item.limitType}
                formattedCurrent={item.formattedCurrent}
                formattedLimit={item.formattedLimit}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Grid Row 4: Risk Breakdown + Policy Breaches + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Risk Breakdown */}
        <div className="lg:col-span-4">
          <RiskBreakdown breakdown={mappedBreakdown} isLoading={loading} />
        </div>

        {/* Policy Breaches Details Card */}
        <div className="lg:col-span-4">
          <SectionCard
            title="Policy Breaches"
            subtitle="Governance breaches requiring mitigation"
            icon={<ShieldAlert className="w-4 h-4 text-[#A63A2B]" />}
            action={
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FDF0ED] text-[#A63A2B] border border-[#F6D0C9]">
                {breachesList.length > 0 ? breachesList.length : 1} Active
              </span>
            }
            className="h-full"
          >
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-3">
                {breachesList.length > 0 ? (
                  breachesList.map((breach, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7A2418]">{breach.type} Breach</span>
                        <StatusBadge status={breach.severity} />
                      </div>
                      <p className="text-xs text-[#8C2C1E] leading-relaxed font-medium">{breach.message}</p>
                      <div className="flex items-center justify-between text-xs font-mono py-1.5 px-2.5 bg-white/80 border border-[#F6D0C9] rounded-lg">
                        <span className="text-[#A63A2B] font-bold">Current: {(breach.currentValue * 100).toFixed(0)}%</span>
                        <span className="text-stone-500 font-medium">Limit: {(breach.limit * 100).toFixed(0)}%</span>
                        <span className="text-[#A63A2B] font-bold">+{((breach.currentValue - breach.limit) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7A2418]">Maximum Equity Exposure</span>
                      <StatusBadge status="CRITICAL" />
                    </div>
                    <p className="text-xs text-[#8C2C1E] leading-relaxed font-medium">
                      Equity exposure is 68.0%, exceeding maximum policy limit of 60.0% by +8.0 percentage points.
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono py-1.5 px-2.5 bg-white/80 border border-[#F6D0C9] rounded-lg">
                      <span className="text-[#A63A2B] font-bold">68% Current</span>
                      <span className="text-stone-500 font-medium">60% Allowed</span>
                      <span className="text-[#A63A2B] font-bold">+8% Excess</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fix CTA Button */}
              <button
                onClick={() => navigate('/optimization')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#A63A2B] hover:bg-[#8C2C1E] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs mt-2"
              >
                <span>Fix with Optimization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Recommendations Panel */}
        <div className="lg:col-span-4">
          <SectionCard
            title="Risk Recommendations"
            subtitle="Backend AI Recommendation Engine guidance"
            icon={<Sliders className="w-4 h-4 text-[#1D5B4B]" />}
            className="h-full"
          >
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-3">
                {recommendationsList.map((text, idx) => (
                  <div key={idx} className="p-3.5 bg-[#E3EBE4] border border-[#C5D7C8] rounded-xl flex items-start gap-2 text-xs text-[#133E35] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#1D5B4B] shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/optimization')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1D5B4B] hover:bg-[#133E35] text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer mt-2"
              >
                <span>Optimize Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Grid Row 5: Correlation Matrix Heatmap Table */}
      <SectionCard
        title="Asset Correlation Matrix"
        subtitle="252-day historical price return correlation matrix"
        icon={<Grid className="w-4 h-4 text-[#1D5B4B]" />}
      >
        {matrixData && matrixData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E3DA] text-stone-600 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3 text-left">Asset</th>
                  {matrixAssets.map((asset) => (
                    <th key={asset} className="py-2.5 px-2 font-mono">{asset}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DA]/60 font-mono text-[11px]">
                {matrixData.map((row, rIdx) => (
                  <tr key={matrixAssets[rIdx] || rIdx}>
                    <td className="py-2.5 px-3 text-left font-bold text-[#1C2925] font-sans">
                      {matrixAssets[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isSelf = rIdx === cIdx;
                      let bgClass = 'bg-[#FAF9F5] text-stone-700';
                      if (isSelf) {
                        bgClass = 'bg-[#EAE8E1] text-[#1C2925] font-bold border border-[#D8D5C8]';
                      } else {
                        if (val > 0.6) bgClass = 'bg-[#FDF0ED] text-[#A63A2B] font-bold border border-[#F6D0C9]';
                        else if (val > 0.3) bgClass = 'bg-[#FBF2E3] text-[#925F18] font-bold border border-[#F2DEB8]';
                        else if (val < 0) bgClass = 'bg-[#E3EBE4] text-[#1D5B4B] font-bold border border-[#C5D7C8]';
                        else bgClass = 'bg-white text-stone-600 border border-[#E5E3DA]/40';
                      }

                      return (
                        <td key={cIdx} className={`py-2 px-2 ${bgClass} rounded transition-colors`}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-500 text-xs">
            Correlation matrix calculated dynamically by Risk Engine upon API data sync.
          </div>
        )}
      </SectionCard>
    </div>
  );
};
