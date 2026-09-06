import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../ui/SectionCard';
import { StatusBadge } from '../ui/StatusBadge';
import { Bell, ArrowRight, ShieldAlert } from 'lucide-react';

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  details: string;
  metric: string;
  currentValue: string;
  allowedValue: string;
  excess: string;
}

interface AlertsPanelProps {
  alerts?: AlertItem[];
  isLoading?: boolean;
}

const DEFAULT_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    severity: 'CRITICAL',
    title: 'Equity exposure exceeds policy limit',
    details: 'Current allocation is 68.0%, exceeding the maximum mandated limit of 60.0% by +8.0 percentage points.',
    metric: 'Equity Exposure',
    currentValue: '68%',
    allowedValue: '60%',
    excess: '+8 percentage points',
  },
];

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts = DEFAULT_ALERTS,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <SectionCard
      title="Active Alerts"
      subtitle="Policy breaches requiring risk officer attention"
      icon={<Bell className="w-4 h-4 text-[#A63A2B]" />}
      action={
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FDF0ED] text-[#A63A2B] border border-[#F6D0C9]">
          {alerts.length} Active
        </span>
      }
      className="h-full"
    >
      {isLoading ? (
        <div className="animate-pulse space-y-3 py-2">
          <div className="h-24 bg-[#EAE8E1] rounded" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-8 text-center text-stone-500 text-xs">
          No active risk alerts. All policy constraints within normal bounds.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-[#FDF0ED] border border-[#F6D0C9] rounded-xl space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#A63A2B] shrink-0" />
                  <span className="text-xs font-bold text-[#7A2418]">{alert.title}</span>
                </div>
                <StatusBadge status={alert.severity} />
              </div>

              <p className="text-xs text-[#8C2C1E] leading-relaxed">{alert.details}</p>

              {/* Data summary pill */}
              <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-white/80 border border-[#F6D0C9] rounded-lg text-xs font-mono">
                <span className="text-[#A63A2B] font-bold">{alert.currentValue} current</span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-600">{alert.allowedValue} allowed</span>
                <span className="text-stone-300">|</span>
                <span className="text-[#A63A2B] font-bold">{alert.excess}</span>
              </div>

              {/* CTA Navigation */}
              <button
                onClick={() => navigate('/optimization')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#A63A2B] hover:bg-[#8C2C1E] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <span>Review Optimization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

