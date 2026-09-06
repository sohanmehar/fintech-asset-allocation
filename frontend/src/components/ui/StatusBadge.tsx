import React from 'react';
import { getRiskLevelColor } from '../../utils/formatters';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const upper = status?.toUpperCase() || 'INFO';
  const displayText = label || status;
  let colors = { bg: 'bg-[#EAE8E1]', text: 'text-stone-700', border: 'border-[#D8D5C8]' };

  if (upper === 'PASS' || upper === 'PASSED' || upper === 'LOW' || upper === 'OPTIMIZED' || upper === 'OPEN' || upper === 'POSITIVE' || upper === 'NORMAL' || upper === 'HIGH') {
    colors = { bg: 'bg-[#E3EBE4]', text: 'text-[#1D5B4B]', border: 'border-[#C5D7C8]' };
  } else if (upper === 'WARNING' || upper === 'MODERATE' || upper === 'ATTENTION' || upper === 'NEEDS ATTENTION' || upper === 'INFO') {
    colors = { bg: 'bg-[#FBF2E3]', text: 'text-[#925F18]', border: 'border-[#F2DEB8]' };
  } else if (upper === 'HIGH_RISK') {
    colors = { bg: 'bg-[#FCEFE6]', text: 'text-[#C05621]', border: 'border-[#FCD5C1]' };
  } else if (upper === 'CRITICAL' || upper === 'BREACH' || upper === 'BREACHED' || upper === 'FAIL' || upper === 'INFEASIBLE') {
    colors = { bg: 'bg-[#FDF0ED]', text: 'text-[#A63A2B]', border: 'border-[#F6D0C9]' };
  } else {
    colors = getRiskLevelColor(upper);
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-bold',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3 py-1.5 text-sm font-extrabold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} tracking-wide ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
      {displayText}
    </span>
  );
};

