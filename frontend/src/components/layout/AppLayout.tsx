import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Format page title based on path
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return 'Portfolio Risk Dashboard';
      case '/portfolio':
        return 'Portfolio Holdings & Allocation';
      case '/optimization':
        return 'Portfolio Optimization Engine';
      case '/risk-monitor':
        return 'Real-Time Risk Monitor';
      case '/scenario-analysis':
        return 'Scenario & Stress Testing';
      case '/alerts':
        return 'Policy Breaches & Active Alerts';
      case '/settings':
        return 'Platform Settings & Governance';
      default:
        return 'CapitalGuard Desk';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4EE] text-[#1C2925] flex">
      {/* Persistent Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle(location.pathname)}
        />

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

