import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subValue?: string;
  badgeText?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  subValue,
  badgeText,
  badge,
  icon,
  loading = false,
}) => {
  const displaySubtitle = subtitle || subValue;

  if (loading) {
    return (
      <div className="bg-[#FAF9F5] border border-[#E5E3DA] rounded-xl p-4 animate-pulse">
        <div className="h-3 bg-[#EAE8E1] rounded w-1/2 mb-3" />
        <div className="h-7 bg-[#EAE8E1] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#EAE8E1] rounded w-1/3" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] border border-[#E5E3DA] hover:border-[#D8D5C8] transition-all rounded-xl p-4 flex flex-col justify-between shadow-2xs">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{title}</span>
          {icon && (
            <div className="p-1.5 rounded-lg bg-[#E3EBE4] text-[#1D5B4B]">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <div className="text-xl sm:text-2xl font-bold text-[#1C2925] tracking-tight">{value}</div>
          {badge ? badge : badgeText && <StatusBadge status={badgeText} size="sm" />}
        </div>
      </div>

      {displaySubtitle && (
        <div className="mt-2.5 text-[11px] font-medium text-stone-500 truncate">
          {displaySubtitle}
        </div>
      )}
    </div>
  );
};

