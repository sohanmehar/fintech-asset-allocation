import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { PortfolioSetup } from './pages/PortfolioSetup';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { Optimization } from './pages/Optimization';
import { RiskMonitor } from './pages/RiskMonitor';
import { ScenarioAnalysis } from './pages/ScenarioAnalysis';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <PortfolioProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Desk Layout Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/portfolio-setup" replace />} />
            <Route path="/portfolio-setup" element={<PortfolioSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/optimization" element={<Optimization />} />
            <Route path="/risk-monitor" element={<RiskMonitor />} />
            <Route path="/scenario-analysis" element={<ScenarioAnalysis />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </PortfolioProvider>
  );
};

export default App;
