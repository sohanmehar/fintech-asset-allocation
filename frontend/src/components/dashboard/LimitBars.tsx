import React from 'react';
import { SectionCard } from '../ui/SectionCard';
import { ProgressBar } from '../ui/ProgressBar';
import { SlidersHorizontal } from 'lucide-react';

export interface PolicyLimitItem {
  id: string;
  name: string;
  currentValue: number;
  limitValue: number;
  unit: string;
  status: 'PASS' | 'BREACH' | 'WARNING';
  limitType: 'MAX' | 'MIN';
  formattedCurrent: string;
  formattedLimit: string;
}

interface LimitBarsProps {
  limits?: PolicyLimitItem[];
  isLoading?: boolean;
}

const DEFAULT_LIMITS: PolicyLimitItem[] = [
  {
    id: 'equity',
    name: 'Equity Exposure',
    currentValue: 68.0,
    limitValue: 60.0,
    unit: '%',
    status: 'BREACH',
    limitType: 'MAX',
    formattedCurrent: '68.00%',
    formattedLimit: '60.00%',
  },
  {
    id: 'cash',
    name: 'Cash Allocation',
    currentValue: 5.0,
    limitValue: 5.0,
    unit: '%',
    status: 'PASS',
    limitType: 'MIN',
    formattedCurrent: '5.00%',
    formattedLimit: '5.00%',
  },
  {
    id: 'volatility',
    name: 'Portfolio Volatility',
    currentValue: 6.83,
    limitValue: 15.0,
    unit: '%',
    status: 'PASS',
    limitType: 'MAX',
    formattedCurrent: '6.83%',
    formattedLimit: '15.00%',
  },
  {
    id: 'liquidity',
    name: 'Liquidity Score',
    currentValue: 93.04,
    limitValue: 70.0,
    unit: 'pts',
    status: 'PASS',
    limitType: 'MIN',
    formattedCurrent: '93.04',
    formattedLimit: '70.00',
  },
  {
    id: 'drawdown',
    name: 'Max Drawdown',
    currentValue: 7.27,
    limitValue: 20.0,
    unit: '%',
    status: 'PASS',
    limitType: 'MAX',
    formattedCurrent: '7.27%',
    formattedLimit: '20.00%',
  },
];

export const LimitBars: React.FC<LimitBarsProps> = ({
  limits = DEFAULT_LIMITS,
  isLoading = false,
}) => {
  return (
    <SectionCard
      title="Risk Policy Limits Compliance"
      subtitle="Mandated governance threshold compliance matrix"
      icon={<SlidersHorizontal className="w-4 h-4 text-[#1D5B4B]" />}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-4 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-[#EAE8E1] rounded" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {limits.map((item) => (
            <ProgressBar
              key={item.id}
              label={item.name}
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
  );
};

