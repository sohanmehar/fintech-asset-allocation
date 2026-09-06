import React from 'react';
import { SectionCard } from '../ui/SectionCard';
import { Layers } from 'lucide-react';

export interface BreakdownData {
  volatilityScore: number;
  varScore: number;
  concentrationScore: number;
  drawdownScore: number;
  liquidityScore: number;
  weights: {
    volatility: number;
    var: number;
    concentration: number;
    drawdown: number;
    liquidity: number;
  };
}

interface RiskBreakdownProps {
  breakdown?: BreakdownData;
  isLoading?: boolean;
}

const DEFAULT_BREAKDOWN: BreakdownData = {
  volatilityScore: 45.5,
  varScore: 35.5,
  concentrationScore: 42.6,
  drawdownScore: 36.4,
  liquidityScore: 9.9,
  weights: {
    volatility: 0.25,
    var: 0.25,
    concentration: 0.20,
    drawdown: 0.15,
    liquidity: 0.15,
  },
};

export const RiskBreakdown: React.FC<RiskBreakdownProps> = ({
  breakdown = DEFAULT_BREAKDOWN,
  isLoading = false,
}) => {
  const metrics = [
    {
      name: 'Volatility Score',
      score: breakdown?.volatilityScore ?? 45.5,
      weight: (breakdown?.weights?.volatility ?? 0.25) * 100,
      description: 'Annualized portfolio price variance risk',
      color: 'bg-[#1D5B4B]',
    },
    {
      name: 'Value at Risk (VaR)',
      score: breakdown?.varScore ?? 35.5,
      weight: (breakdown?.weights?.var ?? 0.25) * 100,
      description: '95% confidence 1-day tail loss exposure',
      color: 'bg-[#2D8B78]',
    },
    {
      name: 'Concentration Score',
      score: breakdown?.concentrationScore ?? 42.6,
      weight: (breakdown?.weights?.concentration ?? 0.20) * 100,
      description: 'Herfindahl index & asset single-exposure risk',
      color: 'bg-[#E2B04E]',
    },
    {
      name: 'Drawdown Score',
      score: breakdown?.drawdownScore ?? 36.4,
      weight: (breakdown?.weights?.drawdown ?? 0.15) * 100,
      description: 'Historical peak-to-trough decline risk',
      color: 'bg-[#C06C59]',
    },
    {
      name: 'Liquidity Risk Penalty',
      score: breakdown?.liquidityScore ?? 9.9,
      weight: (breakdown?.weights?.liquidity ?? 0.15) * 100,
      description: 'Illiquidity penalty based on asset liquidation tier',
      color: 'bg-[#A63A2B]',
    },
  ];

  return (
    <SectionCard
      title="Risk Factor Breakdown"
      subtitle="Engine factor contributions to overall score"
      icon={<Layers className="w-4 h-4 text-[#1D5B4B]" />}
      className="h-full"
    >
      {isLoading ? (
        <div className="animate-pulse space-y-4 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-[#EAE8E1] rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {metrics.map((m) => (
            <div key={m.name} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#1C2925]">{m.name}</span>
                  <span className="text-[10px] text-stone-500 font-medium">({m.weight}% weight)</span>
                </div>
                <span className="font-mono font-bold text-[#1C2925]">
                  {m.score.toFixed(1)} <span className="text-[10px] text-stone-400">/ 100</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-[#EAE8E1] rounded-full overflow-hidden">
                <div
                  className={`h-full ${m.color} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(Math.max(m.score, 0), 100)}%` }}
                />
              </div>

              <div className="text-[10px] text-stone-500 font-medium">{m.description}</div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

