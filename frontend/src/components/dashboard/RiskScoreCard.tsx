import React from 'react';
import { SectionCard } from '../ui/SectionCard';
import { StatusBadge } from '../ui/StatusBadge';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface RiskScoreCardProps {
  score?: number;
  level?: string;
  primaryConcern?: string;
  isLoading?: boolean;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  score = 49,
  level = 'MODERATE',
  primaryConcern = 'Equity exposure exceeds policy limit.',
  isLoading = false,
}) => {
  const indicatorPosition = Math.min(Math.max(score, 0), 100);

  return (
    <SectionCard
      title="Composite Risk Score"
      subtitle="Multi-factor portfolio risk index"
      icon={<ShieldAlert className="w-4 h-4 text-[#1D5B4B]" />}
      action={<StatusBadge status={level as any} label={level} />}
      className="h-full"
    >
      {isLoading ? (
        <div className="animate-pulse space-y-4 py-4">
          <div className="h-12 bg-[#EAE8E1] rounded w-1/3" />
          <div className="h-4 bg-[#EAE8E1] rounded w-full" />
          <div className="h-10 bg-[#EAE8E1] rounded w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main Score Display matching reference screenshot 1 */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[#1C2925]">
              {score}
            </span>
            <span className="text-sm font-semibold text-stone-500">/ 100</span>
            <span className="ml-auto text-xs font-bold text-stone-700 uppercase tracking-wider">
              {level} RISK
            </span>
          </div>

          {/* Horizontal Risk Scale Visualization */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              <span>0 LOW</span>
              <span>31 MODERATE</span>
              <span>61 HIGH</span>
              <span>81-100 CRITICAL</span>
            </div>

            {/* Scale bar matching reference screenshot 1 colors */}
            <div className="relative h-3 w-full bg-[#EAE8E1] rounded-full overflow-hidden flex shadow-inner">
              <div className="w-[30%] bg-[#1D5B4B] border-r border-white/40" title="Low (0-30)" />
              <div className="w-[30%] bg-[#E2B04E] border-r border-white/40" title="Moderate (31-60)" />
              <div className="w-[20%] bg-[#C06C59] border-r border-white/40" title="High (61-80)" />
              <div className="w-[20%] bg-[#A63A2B]" title="Critical (81-100)" />

              {/* Marker pin */}
              <div
                className="absolute top-0 bottom-0 w-1.5 bg-[#1C2925] shadow-md transition-all duration-500 transform -translate-x-1/2"
                style={{ left: `${indicatorPosition}%` }}
              />
            </div>
          </div>

          {/* Primary Concern Highlight matching reference screenshot 1 */}
          {primaryConcern && (
            <div className="p-3.5 bg-[#FDF0ED] border border-[#F6D0C9] rounded-lg flex items-start gap-2.5 text-xs text-[#8C2C1E]">
              <AlertTriangle className="w-4 h-4 text-[#A63A2B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#7A2418]">Primary concern: </span>
                <span className="font-medium">{primaryConcern}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
};

