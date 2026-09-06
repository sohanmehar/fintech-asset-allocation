import React from 'react';

export interface ProgressBarProps {
  label: string;
  currentValue: number; // e.g. 68 for 68% or 93.04 for score
  limitValue: number; // e.g. 60
  unit?: string;
  status?: 'PASS' | 'BREACH' | 'WARNING';
  limitType?: 'MAX' | 'MIN';
  formattedCurrent?: string;
  formattedLimit?: string;
  formatType?: 'percent' | 'score' | 'raw';
  isLowerBetter?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  currentValue,
  limitValue,
  unit = '%',
  status,
  limitType = 'MAX',
  formattedCurrent,
  formattedLimit,
  formatType = 'percent',
  isLowerBetter,
}) => {
  const checkIsLowerBetter = isLowerBetter !== undefined ? isLowerBetter : limitType === 'MAX';

  const isBreached = status
    ? status === 'BREACH'
    : checkIsLowerBetter
    ? currentValue > limitValue
    : currentValue < limitValue;

  // Max scale for the bar
  const maxScale = Math.max(currentValue, limitValue, 1) * 1.25;
  const currentPercent = Math.min(100, (currentValue / maxScale) * 100);
  const limitPercent = Math.min(100, (limitValue / maxScale) * 100);

  const displayCurrent =
    formattedCurrent || (formatType === 'percent' ? `${currentValue.toFixed(1)}${unit}` : `${currentValue.toFixed(1)}`);
  const displayLimit =
    formattedLimit || (formatType === 'percent' ? `${limitValue.toFixed(1)}${unit}` : `${limitValue.toFixed(1)}`);

  return (
    <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F5] border border-[#E5E3DA] shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#1C2925]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-stone-500">
            Current: <strong className="text-[#1C2925] font-bold">{displayCurrent}</strong>
          </span>
          <span className="text-stone-300">|</span>
          <span className="text-stone-500">
            Limit: <strong className="text-stone-700 font-bold">{displayLimit}</strong>
          </span>
          <span
            className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
              isBreached ? 'bg-[#FDF0ED] text-[#A63A2B] border border-[#F6D0C9]' : 'bg-[#E3EBE4] text-[#1D5B4B] border border-[#C5D7C8]'
            }`}
          >
            {isBreached ? 'BREACH' : 'PASS'}
          </span>
        </div>
      </div>

      <div className="relative w-full h-2.5 bg-[#EAE8E1] rounded-full overflow-hidden">
        {/* Fill bar */}
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isBreached ? 'bg-[#C06C59]' : 'bg-[#1D5B4B]'
          }`}
          style={{ width: `${currentPercent}%` }}
        />

        {/* Target Limit Marker Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#1C2925] z-10 shadow-2xs"
          style={{ left: `${limitPercent}%` }}
          title={`Limit: ${displayLimit}`}
        />
      </div>
    </div>
  );
};

