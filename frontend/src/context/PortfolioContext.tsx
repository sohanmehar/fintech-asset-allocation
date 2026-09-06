import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Portfolio, RiskReport } from '../types/api';

interface PortfolioContextType {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  setSelectedPortfolioId: (id: string) => void;
  activePortfolio: Portfolio | null;
  riskReport: RiskReport | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = async () => {
    setLoading(true);
    setError(null);
    try {
      const portList = await apiService.getPortfolios();
      if (portList && portList.length > 0) {
        setPortfolios(portList);
        if (!selectedPortfolioId || !portList.find(p => p._id === selectedPortfolioId)) {
          setSelectedPortfolioId(portList[0]._id);
        }
      } else {
        setError('No portfolios found on backend server.');
      }
    } catch (err: any) {
      console.warn('API error fetching portfolios:', err);
      setError('Unable to connect to CapitalGuard backend service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskReport = async (portfolioId: string) => {
    if (!portfolioId) return;
    setLoading(true);
    try {
      const report = await apiService.getRiskReport(portfolioId);
      setRiskReport(report);
    } catch (err: any) {
      console.warn(`API error fetching risk report for ${portfolioId}:`, err);
      setError('Unable to load live risk report from backend engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolioId) {
      fetchRiskReport(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);

  const activePortfolio = portfolios.find(p => p._id === selectedPortfolioId) || (portfolios.length > 0 ? portfolios[0] : null);

  const refreshData = async () => {
    await fetchPortfolios();
    if (selectedPortfolioId) {
      await fetchRiskReport(selectedPortfolioId);
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        selectedPortfolioId,
        setSelectedPortfolioId,
        activePortfolio,
        riskReport,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
