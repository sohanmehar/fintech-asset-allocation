import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronDown, RefreshCw, Search, Sun, Moon, Plus } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { usePortfolio } from '../../context/PortfolioContext';

interface TopbarProps {
  onToggleSidebar?: () => void;
  pageTitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
}) => {
  const { portfolios, selectedPortfolioId, setSelectedPortfolioId, activePortfolio, riskReport, refreshData, loading } = usePortfolio();

  const selectedPortfolioName = activePortfolio?.name || 'Alpha Growth & Income Demo Portfolio';
  const riskProfile = riskReport?.riskProfile || activePortfolio?.riskProfile || 'BALANCED';

  return (
    <header className="h-16 bg-[#F5F4EE] border-b border-[#E5E3DA] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Toggle + Search Box matching reference screenshot 1 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar as in reference screenshot 1 */}
        <div className="hidden sm:flex items-center gap-2 bg-[#EAE8E1] border border-[#E0DED4] rounded-lg px-3 py-1.5 text-xs text-stone-700 w-64 md:w-80">
          <Search className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <input
            type="text"
            placeholder="Search assets, scenarios, or insights..."
            className="bg-transparent border-none outline-none text-xs text-[#1C2925] placeholder-stone-400 w-full"
            readOnly
          />
          <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-400 bg-[#FAF9F5] border border-[#E0DED4] px-1.5 py-0.5 rounded shadow-2xs">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right section: Portfolio Selector + Status Badges + Action Buttons + Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* New Analysis / Setup Button */}
        <Link
          to="/portfolio-setup"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1D5B4B] hover:bg-[#16483B] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          title="Create or Setup Portfolio Analysis"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Analysis</span>
        </Link>

        {/* Portfolio Dropdown Selector */}
        <div className="flex items-center gap-2 bg-white border border-[#E5E3DA] rounded-lg px-3 py-1.5 text-xs text-stone-700 relative shadow-2xs">
          <span className="text-stone-400 font-medium hidden md:inline">Portfolio:</span>
          <select
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            className="bg-transparent font-semibold text-[#1C2925] focus:outline-none cursor-pointer pr-4 appearance-none text-xs"
          >
            {portfolios.length > 0 ? (
              portfolios.map((p) => (
                <option key={p._id} value={p._id} className="bg-white text-stone-900">
                  {p.name}
                </option>
              ))
            ) : (
              <option value="" className="bg-white text-stone-900">
                {selectedPortfolioName}
              </option>
            )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 pointer-events-none absolute right-2" />
        </div>

        {/* Risk Profile Badge */}
        <div className="hidden md:flex items-center gap-1.5">
          <StatusBadge status="INFO" label={`PROFILE: ${riskProfile}`} />
        </div>

        {/* Refresh button */}
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1D5B4B]' : ''}`} />
        </button>

        {/* Theme pill matching reference header top-right */}
        <div className="hidden lg:flex items-center bg-[#EAE8E1] border border-[#E0DED4] p-0.5 rounded-full text-xs">
          <button className="p-1.5 rounded-full bg-white text-amber-600 shadow-2xs">
            <Sun className="w-3 h-3" />
          </button>
          <button className="p-1.5 rounded-full text-stone-400 hover:text-stone-600">
            <Moon className="w-3 h-3" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#E5E3DA] hidden sm:block" />

        {/* User Profile Avatar matching reference screenshot 1 (Circle with initial L / RO) */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#EAE8E1] border border-[#D8D5C8] flex items-center justify-center text-[#1C2925] text-xs font-bold font-serif shadow-2xs">
            L
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-semibold text-[#1C2925]">Build · Allocate · Grow</div>
          </div>
        </div>
      </div>
    </header>
  );
};

