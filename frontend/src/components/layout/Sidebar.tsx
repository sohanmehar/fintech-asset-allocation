import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  Sliders,
  Activity,
  GitBranch,
  Bell,
  Settings,
  Server
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Optimisation', path: '/optimization', icon: Sliders },
    { name: 'Risk Monitor', path: '/risk-monitor', icon: Activity },
    { name: 'Scenarios', path: '/scenario-analysis', icon: GitBranch },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: '1' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0D2923] text-stone-200 border-r border-[#163D34] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header / Brand matching reference image 1 */}
          <div className="p-6 border-b border-[#163D34] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#E5BF56] font-serif text-xl font-bold shadow-inner">
              P
            </div>
            <div>
              <div className="text-xs font-serif font-bold tracking-wider text-stone-100 uppercase leading-snug">
                PORTFOLIO<br />RISK ENGINE
              </div>
              <div className="text-[8px] font-semibold tracking-wider text-emerald-200/50 uppercase mt-0.5">
                Institutional Allocation & Optimization
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-[#1D4A3E] text-white border border-[#2D6C5B]/40 font-semibold shadow-sm'
                        : 'text-emerald-100/70 hover:text-white hover:bg-[#163D34]/60 font-medium'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-emerald-300/80" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / Tagline matching reference image 1 */}
        <div className="p-6 border-t border-[#163D34] bg-[#0A221D] relative overflow-hidden">
          <div className="w-8 h-0.5 bg-emerald-500/30 mb-3" />
          <p className="font-serif italic text-sm text-stone-300/80 leading-snug">
            Smarter Portfolios.<br />
            A More Resilient Tomorrow.
          </p>
          <div className="w-8 h-0.5 bg-emerald-500/30 mt-3 mb-3" />

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#163D34]/80 text-[10px] text-emerald-200/40">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-200/70">Engine Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3" />
              <span>v1.0.4</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

