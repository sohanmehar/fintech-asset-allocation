import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../ui/SectionCard';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendationText?: string;
  actionSummary?: string[];
  isLoading?: boolean;
}

const DEFAULT_RECOMMENDATION =
  'Reduce equity exposure by approximately 8 percentage points and reallocate toward government bonds, corporate credit, gold and/or liquid cash.';

const DEFAULT_ACTION_POINTS = [
  'Rebalance equity holdings (RELIANCE / TCS / HDFCBANK) to stay within 60% policy cap.',
  'Increase allocation in GSEC10Y (Govt Bonds) and GOLDBEES (Gold ETF) to hedge volatility.',
  'Maintain cash buffer at or above minimum 5% liquidity constraint.',
];

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendationText = DEFAULT_RECOMMENDATION,
  actionSummary = DEFAULT_ACTION_POINTS,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <SectionCard
      title="System Recommendation"
      subtitle="AI-assisted portfolio optimization guidance"
      icon={<Sparkles className="w-4 h-4 text-[#1D5B4B]" />}
      className="h-full"
    >
      {isLoading ? (
        <div className="animate-pulse space-y-3 py-2">
          <div className="h-20 bg-[#EAE8E1] rounded" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Recommendation Text Box matching reference image 1 */}
          <div className="p-4 bg-[#E3EBE4] border border-[#C5D7C8] rounded-xl space-y-2">
            <p className="text-xs text-[#133E35] font-semibold leading-relaxed">
              {recommendationText}
            </p>
          </div>

          {/* Actionable points */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Key Action Directives
            </span>
            <div className="space-y-2">
              {actionSummary.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#1C2925] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#1D5B4B] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/optimization')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1D5B4B] hover:bg-[#133E35] text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            <span>Optimize Portfolio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </SectionCard>
  );
};

