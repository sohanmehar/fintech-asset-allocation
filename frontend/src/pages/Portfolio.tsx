import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionCard } from '../components/ui/SectionCard';
import { AllocationChart, type AllocationItem } from '../components/dashboard/AllocationChart';
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
  Wallet,
  Layers,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Activity,
  AlertTriangle,
  RefreshCw,
  Coins,
} from 'lucide-react';

const ASSET_CLASS_COLORS: Record<string, string> = {
  EQUITY: '#1E4D40',
  GOVERNMENT_BOND: '#2E7D6B',
  FIXED_INCOME: '#2E7D6B',
  CORPORATE_BOND: '#7C8D7C',
  GOLD: '#E2B04E',
  COMMODITY: '#E2B04E',
  CASH: '#6C7471',
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  EQUITY: 'Equity',
  GOVERNMENT_BOND: 'Government Bonds',
  FIXED_INCOME: 'Government Bonds',
  CORPORATE_BOND: 'Corporate Bonds',
  GOLD: 'Gold & Commodities',
  COMMODITY: 'Gold & Commodities',
  CASH: 'Cash & Liquid Funds',
};

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const { activePortfolio, riskReport, loading, error, refreshData } = usePortfolio();

  const totalCapital = riskReport?.totalCapital ?? activePortfolio?.totalCapital ?? 10000000;
  const riskProfile = riskReport?.riskProfile || activePortfolio?.riskProfile || 'BALANCED';

  // Format holdings
  const holdingsList = activePortfolio?.holdings || [];
  const totalAssetsCount = holdingsList.length || 9;

  // Process per-asset weights & values for display
  const holdingsTableData = holdingsList.length > 0
    ? holdingsList.map((h) => {
        const assetObj = typeof h.assetId === 'object' ? h.assetId : null;
        const symbol = assetObj?.symbol || h.symbol || 'ASSET';
        const name = assetObj?.name || h.symbol || 'Asset';
        const assetClass = assetObj?.assetClass || 'EQUITY';
        const currentPrice = assetObj?.currentPrice ?? (h.currentValue && h.quantity ? h.currentValue / h.quantity : 0);
        const quantity = h.quantity ?? 0;
        const currentValue = h.currentValue || (h.weight * totalCapital);
        const weight = h.weight;

        // Individual weight status (max 25% or 30% individual asset threshold)
        const isMaxBreached = weight > 0.25;
        const status = isMaxBreached ? 'BREACH' : 'PASS';

        return {
          symbol,
          name,
          assetClass,
          currentPrice,
          quantity,
          currentValue,
          weight,
          status,
        };
      })
    : [
        { symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'EQUITY', currentPrice: 2500, quantity: 800, currentValue: 2000000, weight: 0.20, status: 'PASS' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', assetClass: 'EQUITY', currentPrice: 3500, quantity: 428, currentValue: 1500000, weight: 0.15, status: 'PASS' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'EQUITY', currentPrice: 1500, quantity: 1000, currentValue: 1500000, weight: 0.15, status: 'PASS' },
        { symbol: 'INFY', name: 'Infosys Limited', assetClass: 'EQUITY', currentPrice: 1400, quantity: 714, currentValue: 1000000, weight: 0.10, status: 'PASS' },
        { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', assetClass: 'GOLD', currentPrice: 50, quantity: 20000, currentValue: 1000000, weight: 0.10, status: 'PASS' },
        { symbol: 'GSEC10Y', name: '10-Year Govt Security', assetClass: 'GOVERNMENT_BOND', currentPrice: 100, quantity: 10000, currentValue: 1000000, weight: 0.10, status: 'PASS' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank', assetClass: 'EQUITY', currentPrice: 950, quantity: 842, currentValue: 800000, weight: 0.08, status: 'PASS' },
        { symbol: 'CORPBOND', name: 'AAA Corporate Bond ETF', assetClass: 'CORPORATE_BOND', currentPrice: 100, quantity: 7000, currentValue: 700000, weight: 0.07, status: 'PASS' },
        { symbol: 'CASH', name: 'INR Cash & Liquidity', assetClass: 'CASH', currentPrice: 1, quantity: 500000, currentValue: 500000, weight: 0.05, status: 'PASS' },
      ];

  // Asset class breakdown computation
  const assetClassTotals: Record<string, number> = {};
  holdingsTableData.forEach((h) => {
    const cls = h.assetClass;
    assetClassTotals[cls] = (assetClassTotals[cls] || 0) + h.weight;
  });

  const assetClassChartData = Object.entries(assetClassTotals).map(([cls, weight]) => ({
    name: ASSET_CLASS_LABELS[cls] || cls,
    weightPercent: weight * 100,
    color: ASSET_CLASS_COLORS[cls] || '#1E4D40',
  }));

  // Holdings for chart format
  const holdingsForChart: AllocationItem[] = holdingsTableData.map((h) => ({
    symbol: h.symbol,
    name: h.name,
    weight: h.weight,
    value: h.currentValue,
    assetClass: h.assetClass,
  }));

  const equityExposure = riskReport?.metrics?.equityExposure ?? 0.68;
  const isEquityBreached = equityExposure > 0.60;
  const govtBondExposure = assetClassTotals['GOVERNMENT_BOND'] || assetClassTotals['FIXED_INCOME'] || 0.10;
  const corpBondExposure = assetClassTotals['CORPORATE_BOND'] || 0.07;
  const goldExposure = assetClassTotals['GOLD'] || assetClassTotals['COMMODITY'] || 0.10;
  const cashAllocation = riskReport?.metrics?.cashAllocation ?? 0.05;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Portfolio Holdings & Allocation
            </h2>
            <StatusBadge status="INFO" label={`PROFILE: ${riskProfile}`} />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Detailed asset breakdown, sector weights, market valuations and position governance for {activePortfolio?.name || 'Alpha Growth & Income Demo Portfolio'}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#EAE8E1] text-[#1C2925] rounded-lg text-xs font-bold transition-all border border-[#E5E3DA] shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1D5B4B] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Portfolio</span>
          </button>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshData}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 rounded font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Capital"
          value={formatCurrency(totalCapital)}
          subtitle="Portfolio Net Asset Value"
          icon={<Wallet className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="Total Holdings"
          value={`${totalAssetsCount} Assets`}
          subtitle="Multi-Asset Universe"
          icon={<Layers className="w-4 h-4" />}
          loading={loading}
        />
        <MetricCard
          title="Equity Exposure"
          value={formatPercentage(equityExposure)}
          subtitle="Limit: 60.0%"
          badge={<StatusBadge status={isEquityBreached ? 'BREACH' : 'PASS'} label={isEquityBreached ? 'BREACH' : 'PASS'} />}
          icon={<ShieldAlert className="w-4 h-4 text-[#A63A2B]" />}
          loading={loading}
        />
        <MetricCard
          title="Cash Allocation"
          value={formatPercentage(cashAllocation)}
          subtitle="Min Reserve: 5.0%"
          badge={<StatusBadge status="PASS" label="SAFE" />}
          icon={<Coins className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      {/* Holdings Table */}
      <SectionCard
        title="Portfolio Holdings & Positions"
        subtitle="Individual asset prices, quantities, valuations and weights"
        icon={<Layers className="w-4 h-4 text-[#1D5B4B]" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1C2925]">
            <thead className="bg-[#FAF9F5] text-stone-600 uppercase text-[10px] font-bold border-b border-[#E5E3DA]">
              <tr>
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Symbol</th>
                <th className="py-3.5 px-4">Asset Class</th>
                <th className="py-3.5 px-4 text-right">Current Price</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4 text-right">Current Value</th>
                <th className="py-3.5 px-4 text-right">Weight</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DA] font-mono">
              {holdingsTableData.map((row) => (
                <tr key={row.symbol} className="hover:bg-[#EAE8E1]/60 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-[#1C2925]">{row.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#EAE8E1] text-[#1C2925] border border-[#D8D5C8] text-[11px] font-bold">
                      {row.symbol}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="text-[11px] text-stone-600 font-medium">
                      {ASSET_CLASS_LABELS[row.assetClass] || row.assetClass}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans font-semibold">
                    {row.currentPrice > 0 ? formatCurrency(row.currentPrice) : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans font-semibold">
                    {row.quantity > 0 ? row.quantity.toLocaleString('en-IN') : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#1C2925] font-sans">
                    {formatCurrency(row.currentValue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#1D5B4B] font-sans">
                    {(row.weight * 100).toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Allocation Visualizations: 2 Visual Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Section A: Individual Asset Allocation Donut */}
        <div className="lg:col-span-6">
          <AllocationChart
            holdings={holdingsForChart}
            totalValue={totalCapital}
            isLoading={loading}
          />
        </div>

        {/* Section B: Asset Class Exposure Bar Chart */}
        <div className="lg:col-span-6">
          <SectionCard
            title="Asset Class Exposure"
            subtitle="Capital allocation across asset classes"
            icon={<BarChart className="w-4 h-4 text-[#1D5B4B]" />}
            className="h-full"
          >
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D5B4B]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetClassChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke="#6C7471" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#6C7471" tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Weight']}
                        contentStyle={{ backgroundColor: '#FAF9F5', borderColor: '#E5E3DA', borderRadius: '8px', fontSize: '12px', color: '#1C2925' }}
                      />
                      <Bar dataKey="weightPercent" radius={[4, 4, 0, 0]}>
                        {assetClassChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-[#E5E3DA]">
                  {assetClassChartData.map((item) => (
                    <div key={item.name} className="p-2 rounded-lg bg-white border border-[#E5E3DA] shadow-2xs">
                      <span className="text-[10px] text-stone-500 block truncate font-medium">{item.name}</span>
                      <span className="font-bold text-[#1C2925]">{item.weightPercent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Portfolio Exposure & Policy Breach Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <SectionCard
            title="Exposure Overview & Policy Limits"
            subtitle="Governance compliance matrix across asset classes"
            icon={<ShieldAlert className="w-4 h-4 text-[#A63A2B]" />}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Equity Exposure */}
                <div className="p-3.5 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#7A2418]">Equity Exposure</span>
                    <StatusBadge status="BREACH" size="sm" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-[#A63A2B]">{(equityExposure * 100).toFixed(1)}%</span>
                    <span className="text-[11px] text-stone-600 font-medium">Policy Max: 60.0%</span>
                  </div>
                  <div className="text-[10px] text-[#A63A2B] font-bold">Exceeds mandate by +{((equityExposure - 0.60) * 100).toFixed(1)}%</div>
                </div>

                {/* Government Bonds */}
                <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DA] rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C2925]">Government Bonds</span>
                    <StatusBadge status="PASS" size="sm" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-[#1D5B4B]">{(govtBondExposure * 100).toFixed(1)}%</span>
                    <span className="text-[11px] text-stone-500 font-medium">Target: 10.0%</span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Sovereign yield allocation</div>
                </div>

                {/* Corporate Bonds */}
                <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DA] rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C2925]">Corporate Credit</span>
                    <StatusBadge status="PASS" size="sm" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-[#1D5B4B]">{(corpBondExposure * 100).toFixed(1)}%</span>
                    <span className="text-[11px] text-stone-500 font-medium">Target: 7.0%</span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">AAA corporate credit ETF</div>
                </div>

                {/* Gold & Commodity */}
                <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E3DA] rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C2925]">Gold & Commodities</span>
                    <StatusBadge status="PASS" size="sm" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-[#925F18]">{(goldExposure * 100).toFixed(1)}%</span>
                    <span className="text-[11px] text-stone-500 font-medium">Target: 10.0%</span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Inflation hedge asset</div>
                </div>
              </div>

              {/* CTA Link */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => navigate('/risk-monitor')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF9F5] hover:bg-[#EAE8E1] text-[#1C2925] rounded-lg text-xs font-bold border border-[#E5E3DA] transition-all cursor-pointer shadow-2xs"
                >
                  <span>Review Risk Details</span>
                  <ArrowRight className="w-4 h-4 text-[#1D5B4B]" />
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Portfolio Actions Area */}
        <div className="lg:col-span-4">
          <SectionCard
            title="Portfolio Actions"
            subtitle="Governance desk shortcuts"
            icon={<Sliders className="w-4 h-4 text-[#1D5B4B]" />}
            className="h-full"
          >
            <div className="space-y-4 flex flex-col justify-between h-full">
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Take rebalancing actions or inspect real-time factor risk metrics for the selected portfolio.
              </p>

              <div className="space-y-2.5 pt-4">
                <button
                  onClick={() => navigate('/optimization')}
                  className="w-full flex items-center justify-between p-3.5 bg-[#1D5B4B] hover:bg-[#133E35] text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    <span>Run Optimization</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/risk-monitor')}
                  className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-[#EAE8E1] text-[#1C2925] font-bold border border-[#E5E3DA] rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#1D5B4B]" />
                    <span>View Risk Monitor</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
