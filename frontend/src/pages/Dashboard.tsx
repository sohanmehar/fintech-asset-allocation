import React from 'react';
import type { RiskBreach } from '../types/api';
import { usePortfolio } from '../context/PortfolioContext';
import { apiService } from '../services/api';
import {
  formatCurrency,
  formatPercentage,
} from '../utils/formatters';

import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskScoreCard } from '../components/dashboard/RiskScoreCard';
import { AllocationChart } from '../components/dashboard/AllocationChart';
import type { AllocationItem } from '../components/dashboard/AllocationChart';
import { RiskBreakdown } from '../components/dashboard/RiskBreakdown';
import type { BreakdownData } from '../components/dashboard/RiskBreakdown';
import { LimitBars } from '../components/dashboard/LimitBars';
import type { PolicyLimitItem } from '../components/dashboard/LimitBars';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import type { AlertItem } from '../components/dashboard/AlertsPanel';
import { RecommendationsPanel } from '../components/dashboard/RecommendationsPanel';

import {
  Wallet,
  TrendingUp,
  Activity,
  ShieldAlert,
  Droplets,
  AlertOctagon,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { activePortfolio, riskReport, loading, error, refreshData } = usePortfolio();

  // Compute metric values using API data or fallback values
  const totalCapital = riskReport?.totalCapital ?? activePortfolio?.totalCapital ?? 10000000;
  const expectedReturn = riskReport?.metrics?.expectedReturn ?? 0.1087;
  const portfolioVolatility = riskReport?.metrics?.portfolioVolatility ?? 0.0683;
  const var95Value = riskReport?.metrics?.var95?.amount ?? 70729;
  const var95Percent = riskReport?.metrics?.var95?.percentage ?? 0.0071;
  const riskScore = riskReport?.riskScore?.score ?? 49;
  const riskLevel = riskReport?.riskScore?.level ?? 'MODERATE';
  const liquidityScore = riskReport?.metrics?.liquidityScore ?? 93.04;
  const maxDrawdown = riskReport?.metrics?.maximumDrawdown ?? 0.0727;

  // Holdings for chart
  const holdingsForChart: AllocationItem[] = activePortfolio?.holdings
    ? activePortfolio.holdings.map((h) => {
        const symbol = typeof h.assetId === 'object' ? h.assetId.symbol : (h.symbol || 'ASSET');
        const name = typeof h.assetId === 'object' ? h.assetId.name : (h.symbol || 'Asset');
        const assetClass = typeof h.assetId === 'object' ? h.assetId.assetClass : 'EQUITY';
        return {
          symbol,
          name,
          weight: h.weight,
          value: h.currentValue || (h.weight * totalCapital),
          assetClass,
        };
      })
    : [
        { symbol: 'RELIANCE', name: 'Reliance Industries', weight: 0.20, value: 2000000, assetClass: 'EQUITY' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 0.15, value: 1500000, assetClass: 'EQUITY' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank', weight: 0.15, value: 1500000, assetClass: 'EQUITY' },
        { symbol: 'INFY', name: 'Infosys Limited', weight: 0.10, value: 1000000, assetClass: 'EQUITY' },
        { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', weight: 0.10, value: 1000000, assetClass: 'COMMODITY' },
        { symbol: 'GSEC10Y', name: '10-Year Govt Security', weight: 0.10, value: 1000000, assetClass: 'FIXED_INCOME' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank', weight: 0.08, value: 800000, assetClass: 'EQUITY' },
        { symbol: 'CORPBOND', name: 'AAA Corporate Bond ETF', weight: 0.07, value: 700000, assetClass: 'FIXED_INCOME' },
        { symbol: 'CASH', name: 'INR Cash & Liquidity', weight: 0.05, value: 500000, assetClass: 'CASH' },
      ];

  // Risk policy limits
  const equityBreach = riskReport?.policyEvaluation?.breaches?.find((b: RiskBreach) =>
    b.type?.toLowerCase().includes('equity')
  );

  const limitsData: PolicyLimitItem[] = [
    {
      id: 'equity',
      name: 'Equity Exposure',
      currentValue: (riskReport?.metrics?.equityExposure ?? 0.68) * 100,
      limitValue: 60.0,
      unit: '%',
      status: 'BREACH',
      limitType: 'MAX',
      formattedCurrent: `${((riskReport?.metrics?.equityExposure ?? 0.68) * 100).toFixed(1)}%`,
      formattedLimit: '60.0%',
    },
    {
      id: 'cash',
      name: 'Cash Allocation',
      currentValue: (riskReport?.metrics?.cashAllocation ?? 0.05) * 100,
      limitValue: 5.0,
      unit: '%',
      status: 'PASS',
      limitType: 'MIN',
      formattedCurrent: `${((riskReport?.metrics?.cashAllocation ?? 0.05) * 100).toFixed(1)}%`,
      formattedLimit: '5.0%',
    },
    {
      id: 'volatility',
      name: 'Portfolio Volatility',
      currentValue: portfolioVolatility * 100,
      limitValue: 15.0,
      unit: '%',
      status: 'PASS',
      limitType: 'MAX',
      formattedCurrent: formatPercentage(portfolioVolatility),
      formattedLimit: '15.00%',
    },
    {
      id: 'liquidity',
      name: 'Liquidity Score',
      currentValue: liquidityScore,
      limitValue: 70.0,
      unit: 'pts',
      status: 'PASS',
      limitType: 'MIN',
      formattedCurrent: liquidityScore.toFixed(2),
      formattedLimit: '70.00',
    },
    {
      id: 'drawdown',
      name: 'Max Drawdown',
      currentValue: maxDrawdown * 100,
      limitValue: 20.0,
      unit: '%',
      status: 'PASS',
      limitType: 'MAX',
      formattedCurrent: formatPercentage(maxDrawdown),
      formattedLimit: '20.00%',
    },
  ];

  // Live Governance Alerts State
  const [liveAlerts, setLiveAlerts] = React.useState<AlertItem[]>([]);

  React.useEffect(() => {
    const loadAlerts = async () => {
      if (activePortfolio?._id) {
        try {
          const fetched = await apiService.getAlertsByPortfolio(activePortfolio._id);
          const mapped: AlertItem[] = fetched.map((a: any) => ({
            id: a._id,
            severity: a.severity as any,
            title: a.title || a.message || 'Policy Breach Alert',
            details: a.message,
            metric: a.metric || a.type,
            currentValue: a.currentValue !== undefined ? (a.currentValue <= 1.0 ? `${(a.currentValue * 100).toFixed(0)}%` : `${a.currentValue.toFixed(1)}`) : '-',
            allowedValue: (a.limitValue ?? a.threshold) !== undefined ? ((a.limitValue ?? a.threshold) <= 1.0 ? `${((a.limitValue ?? a.threshold) * 100).toFixed(0)}%` : `${(a.limitValue ?? a.threshold).toFixed(1)}`) : '-',
            excess: a.excessValue ? `+${(a.excessValue * 100).toFixed(1)} percentage points` : '+8 percentage points',
          }));
          setLiveAlerts(mapped);
        } catch (err) {
          console.warn('Dashboard error fetching live alerts:', err);
        }
      }
    };
    loadAlerts();
  }, [activePortfolio?._id]);

  const activeAlerts: AlertItem[] = liveAlerts.length > 0
    ? liveAlerts
    : riskReport?.alerts?.length
    ? riskReport.alerts.map((a) => ({
        id: a._id,
        severity: a.severity as any,
        title: a.message || 'Equity exposure exceeds policy limit',
        details: 'Current allocation exceeds the maximum mandated policy limit.',
        metric: a.metric || 'Equity Exposure',
        currentValue: a.currentValue ? `${(a.currentValue * 100).toFixed(0)}%` : '68%',
        allowedValue: a.threshold ? `${(a.threshold * 100).toFixed(0)}%` : '60%',
        excess: a.currentValue && a.threshold ? `+${((a.currentValue - a.threshold) * 100).toFixed(0)} percentage points` : '+8 percentage points',
      }))
    : [];

  const primaryConcern = equityBreach
    ? equityBreach.message
    : 'Equity exposure exceeds policy limit.';

  const recommendationText = riskReport?.recommendations?.length
    ? riskReport.recommendations[0]
    : 'Reduce equity exposure by approximately 8 percentage points and reallocate toward government bonds, corporate credit, gold and/or liquid cash.';

  // Map breakdown structure for RiskBreakdown component
  const mappedBreakdown: BreakdownData | undefined = riskReport?.riskScore?.breakdown
    ? {
        volatilityScore: riskReport.riskScore.breakdown.volatility?.score ?? 45.5,
        varScore: riskReport.riskScore.breakdown.var?.score ?? 35.5,
        concentrationScore: riskReport.riskScore.breakdown.concentration?.score ?? 42.6,
        drawdownScore: riskReport.riskScore.breakdown.drawdown?.score ?? 36.4,
        liquidityScore: riskReport.riskScore.breakdown.liquidity?.score ?? 9.9,
        weights: {
          volatility: riskReport.riskScore.breakdown.volatility?.weight ?? 0.25,
          var: riskReport.riskScore.breakdown.var?.weight ?? 0.25,
          concentration: riskReport.riskScore.breakdown.concentration?.weight ?? 0.20,
          drawdown: riskReport.riskScore.breakdown.drawdown?.weight ?? 0.15,
          liquidity: riskReport.riskScore.breakdown.liquidity?.weight ?? 0.15,
        },
      }
    : undefined;

  return (
    <div className="space-y-6">
      {/* Dashboard Header Banner matching reference screenshot 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Portfolio Risk Dashboard
            </h2>
            <StatusBadge status="WARNING" label="PORTFOLIO STATUS: Needs Attention" size="md" />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Monitor exposure, risk limits and optimization opportunities for {activePortfolio?.name || 'Alpha Growth & Income Demo Portfolio'}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#EAE8E1] text-[#1C2925] rounded-lg text-xs font-bold transition-all border border-[#E5E3DA] shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1D5B4B] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Engine</span>
          </button>
        </div>
      </div>


      {/* Error state alert if API fails */}
      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshData}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Capital"
          value={formatCurrency(totalCapital)}
          subtitle="Portfolio Value"
          icon={<Wallet className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="Expected Return"
          value={formatPercentage(expectedReturn)}
          subtitle="Annualized Return"
          badge={<StatusBadge status="PASS" label="POSITIVE" />}
          icon={<TrendingUp className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="Portfolio Volatility"
          value={formatPercentage(portfolioVolatility)}
          subtitle="Annualized Standard Dev"
          badge={<StatusBadge status="PASS" label="NORMAL" />}
          icon={<Activity className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="1-Day 95% VaR"
          value={formatCurrency(var95Value)}
          subtitle={`${formatPercentage(var95Percent)} portfolio tail risk`}
          icon={<ShieldAlert className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="Risk Score"
          value={`${riskScore} / 100`}
          subtitle="Composite Risk Score"
          badge={<StatusBadge status={riskLevel} label={riskLevel} />}
          icon={<AlertOctagon className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="Liquidity Score"
          value={liquidityScore.toFixed(2)}
          subtitle="Tier-Weighted Liquidity"
          badge={<StatusBadge status="PASS" label="HIGH" />}
          icon={<Droplets className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      {/* Grid Row 2: Portfolio Allocation Donut + Risk Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <AllocationChart
            holdings={holdingsForChart}
            totalValue={totalCapital}
            isLoading={loading}
          />
        </div>
        <div className="lg:col-span-5">
          <RiskScoreCard
            score={riskScore}
            level={riskLevel}
            primaryConcern={primaryConcern}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid Row 3: Risk Limits Compliance */}
      <div>
        <LimitBars limits={limitsData} isLoading={loading} />
      </div>

      {/* Grid Row 4: Risk Breakdown + Alerts + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4">
          <RiskBreakdown breakdown={mappedBreakdown} isLoading={loading} />
        </div>
        <div className="lg:col-span-4">
          <AlertsPanel alerts={activeAlerts} isLoading={loading} />
        </div>
        <div className="lg:col-span-4">
          <RecommendationsPanel
            recommendationText={recommendationText}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
};
