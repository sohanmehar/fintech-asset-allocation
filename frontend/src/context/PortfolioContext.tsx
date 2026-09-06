import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Portfolio, RiskReport } from '../types/api';

interface PortfolioContextType {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  setSelectedPortfolioId: (id: string) => void;
  activePortfolio: Portfolio | null;
  riskReport: RiskReport | null;
  isAnalyzed: boolean;
  setIsAnalyzed: (analyzed: boolean) => void;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  analyzePortfolio: (data: {
    portfolioId?: string;
    name: string;
    totalCapital: number;
    riskProfile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
    holdings: Array<{ symbol: string; weight: number }>;
  }) => Promise<Portfolio>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);
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

  const analyzePortfolio = async (data: {
    portfolioId?: string;
    name: string;
    totalCapital: number;
    riskProfile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
    holdings: Array<{ symbol: string; weight: number }>;
  }): Promise<Portfolio> => {
    setLoading(true);
    setError(null);
    try {
      const savedPortfolio = await apiService.savePortfolio(data);
      await fetchPortfolios();
      setSelectedPortfolioId(savedPortfolio._id);
      await fetchRiskReport(savedPortfolio._id);
      setIsAnalyzed(true);
      return savedPortfolio;
    } catch (err: any) {
      console.error('Error analyzing portfolio:', err);
      const errMsg = err?.response?.data?.message || err.message || 'Failed to submit portfolio for analysis.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
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
        isAnalyzed,
        setIsAnalyzed,
        loading,
        error,
        refreshData,
        analyzePortfolio,
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
