import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SectionCard } from '../ui/SectionCard';
import { PieChart as PieIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export interface AllocationItem {
  symbol: string;
  name: string;
  weight: number; // e.g. 0.20 for 20%
  value: number;  // absolute monetary value
  assetClass: string;
}

interface AllocationChartProps {
  holdings?: AllocationItem[];
  totalValue?: number;
  isLoading?: boolean;
}

const DEFAULT_HOLDINGS: AllocationItem[] = [
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

const COLOR_MAP: Record<string, string> = {
  RELIANCE: '#1E4D40',
  TCS: '#2E7D6B',
  HDFCBANK: '#C06C59',
  INFY: '#2C463F',
  ICICIBANK: '#7C8D7C',
  GSEC10Y: '#1F5A4D',
  CORPBOND: '#94A396',
  GOLDBEES: '#E2B04E',
  CASH: '#6C7471',
};

const DEFAULT_COLORS = ['#1E4D40', '#2E7D6B', '#C06C59', '#2C463F', '#7C8D7C', '#1F5A4D', '#94A396', '#E2B04E', '#6C7471', '#A63A2B'];

export const AllocationChart: React.FC<AllocationChartProps> = ({
  holdings = DEFAULT_HOLDINGS,
  totalValue = 10000000,
  isLoading = false,
}) => {
  const chartData = holdings.map((item, idx) => ({
    name: item.symbol,
    fullName: item.name,
    value: item.weight * 100,
    amount: item.value,
    color: COLOR_MAP[item.symbol] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    assetClass: item.assetClass,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#FAF9F5] border border-[#E5E3DA] p-2.5 rounded-lg shadow-md text-xs space-y-1 text-[#1C2925]">
          <div className="font-bold">{data.name} ({data.fullName})</div>
          <div className="text-stone-600">Allocation: <span className="font-bold text-[#1D5B4B]">{data.value.toFixed(1)}%</span></div>
          <div className="text-stone-500">Value: {formatCurrency(data.amount)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <SectionCard
      title="Portfolio Allocation"
      subtitle="Asset universe weight distribution"
      icon={<PieIcon className="w-4 h-4 text-[#1D5B4B]" />}
      action={<span className="text-xs text-stone-500 font-mono font-semibold">Total: {formatCurrency(totalValue)}</span>}
    >
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D5B4B]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FAF9F5" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label matching reference image 1 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl font-extrabold text-[#1C2925] font-serif leading-none">{holdings.length}</span>
              <span className="text-[11px] font-bold text-[#1C2925] uppercase tracking-wider mt-0.5">Assets</span>
              <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-tight">Holdings</span>
            </div>
          </div>

          {/* Compact Structured Legend matching reference image 1 */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E3DA] shadow-2xs hover:border-[#D8D5C8] transition-all"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-[#1C2925] truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[#1C2925] font-bold">{item.value.toFixed(0)}%</span>
                  <span className="text-[10px] text-stone-500 block font-mono">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
};

