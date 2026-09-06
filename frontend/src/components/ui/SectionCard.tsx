import React from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-[#FAF9F5] border border-[#E5E3DA] rounded-xl p-5 shadow-2xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E3DA]/80">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-[#1D5B4B]">{icon}</span>}
            <div>
              <h3 className="font-serif text-base font-bold text-[#1C2925] tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-stone-500 mt-0.5 font-sans">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

