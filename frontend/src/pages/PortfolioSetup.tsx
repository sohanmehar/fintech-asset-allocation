import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { apiService } from '../services/api';
import type { Asset, RiskPolicy } from '../types/api';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/formatters';
import {
  Wallet,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Play,
  FileText,
  RefreshCw,
  PieChart,
  Shield,
} from 'lucide-react';

interface EditableHolding {
  symbol: string;
  name: string;
  assetClass: string;
  weightPct: number; // 0 - 100
}

export const PortfolioSetup: React.FC = () => {
  const navigate = useNavigate();
  const { activePortfolio, analyzePortfolio, setIsAnalyzed } = usePortfolio();

  // Form State
  const [portfolioName, setPortfolioName] = useState<string>('Alpha Growth & Income Demo Portfolio');
  const [totalCapital, setTotalCapital] = useState<number | string>(10000000);
  const [riskProfile, setRiskProfile] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');

  // Available Assets & Policies from Backend
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [policies, setPolicies] = useState<RiskPolicy[]>([]);

  // Selected Asset for Adding
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [addWeightPct, setAddWeightPct] = useState<number | string>(10);

  // Holdings Array
  const [holdings, setHoldings] = useState<EditableHolding[]>([
    { symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'EQUITY', weightPct: 20 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', assetClass: 'EQUITY', weightPct: 15 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'EQUITY', weightPct: 15 },
    { symbol: 'INFY', name: 'Infosys Limited', assetClass: 'EQUITY', weightPct: 10 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', assetClass: 'EQUITY', weightPct: 8 },
    { symbol: 'GSEC10Y', name: '10-Year Govt Security', assetClass: 'FIXED_INCOME', weightPct: 10 },
    { symbol: 'CORPBOND', name: 'AAA Corporate Bond ETF', assetClass: 'FIXED_INCOME', weightPct: 7 },
    { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', assetClass: 'COMMODITY', weightPct: 10 },
    { symbol: 'CASH', name: 'INR Cash & Liquidity', assetClass: 'CASH', weightPct: 5 },
  ]);

  // Policy Parameters Editable Inputs
  const [maxEquityExposure, setMaxEquityExposure] = useState<number | string>(60);
  const [minCashAllocation, setMinCashAllocation] = useState<number | string>(5);
  const [maxPortfolioVolatility, setMaxPortfolioVolatility] = useState<number | string>(15);
  const [minLiquidityScore, setMinLiquidityScore] = useState<number | string>(70);
  const [maxDrawdown, setMaxDrawdown] = useState<number | string>(20);
  const [maxIndividualAssetWeight, setMaxIndividualAssetWeight] = useState<number | string>(30);
  const [riskAversion, setRiskAversion] = useState<number | string>(3.0);
  const [transactionCost, setTransactionCost] = useState<number | string>(0.1);

  // Processing & UI Feedback State
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Load initial backend assets & policies
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [fetchedAssets, fetchedPolicies] = await Promise.all([
          apiService.getAssets(),
          apiService.getRiskPolicies(),
        ]);
        setAvailableAssets(fetchedAssets);
        setPolicies(fetchedPolicies);

        if (fetchedAssets.length > 0) {
          setSelectedSymbol(fetchedAssets[0].symbol);
        }

        // Set policy limits for default profile
        const defaultPol = fetchedPolicies.find((p) => p.name === riskProfile) || fetchedPolicies[0];
        if (defaultPol) {
          setMaxEquityExposure(defaultPol.maxEquityExposure * 100);
          setMinCashAllocation(defaultPol.minCashAllocation * 100);
          setMaxPortfolioVolatility(defaultPol.maxPortfolioVolatility * 100);
          setMinLiquidityScore(defaultPol.minLiquidityScore);
          setMaxDrawdown(defaultPol.maxDrawdown * 100);
          setMaxIndividualAssetWeight(defaultPol.maxIndividualAssetWeight * 100);
        }
      } catch (err) {
        console.warn('Error loading setup data from backend:', err);
      }
    };
    loadBackendData();
  }, []);

  // Update policy threshold defaults when user switches profile
  const handleProfileChange = (profile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE') => {
    setRiskProfile(profile);
    const pol = policies.find((p) => p.name === profile);
    if (pol) {
      setMaxEquityExposure(pol.maxEquityExposure * 100);
      setMinCashAllocation(pol.minCashAllocation * 100);
      setMaxPortfolioVolatility(pol.maxPortfolioVolatility * 100);
      setMinLiquidityScore(pol.minLiquidityScore);
      setMaxDrawdown(pol.maxDrawdown * 100);
      setMaxIndividualAssetWeight(pol.maxIndividualAssetWeight * 100);
    }
  };

  // Add Asset Holding Row
  const handleAddHolding = () => {
    if (!selectedSymbol) return;
    const existingIdx = holdings.findIndex((h) => h.symbol === selectedSymbol);
    const assetObj = availableAssets.find((a) => a.symbol === selectedSymbol);
    const numWeight = typeof addWeightPct === 'number' ? addWeightPct : parseFloat(addWeightPct) || 0;

    if (existingIdx >= 0) {
      const updated = [...holdings];
      updated[existingIdx].weightPct += numWeight;
      setHoldings(updated);
    } else {
      setHoldings([
        ...holdings,
        {
          symbol: selectedSymbol,
          name: assetObj?.name || selectedSymbol,
          assetClass: assetObj?.assetClass || 'EQUITY',
          weightPct: numWeight,
        },
      ]);
    }
  };

  // Remove Holding Row
  const handleRemoveHolding = (symbol: string) => {
    setHoldings(holdings.filter((h) => h.symbol !== symbol));
  };

  // Update Weight %
  const handleWeightChange = (symbol: string, val: number) => {
    setHoldings(
      holdings.map((h) => (h.symbol === symbol ? { ...h, weightPct: Math.max(0, val) } : h))
    );
  };

  // Computed Totals
  const totalCapitalNum = typeof totalCapital === 'number' ? totalCapital : parseFloat(totalCapital) || 0;
  const totalAllocationPct = holdings.reduce((sum, h) => sum + h.weightPct, 0);
  const remainingAllocationPct = 100 - totalAllocationPct;
  const equityExposurePct = holdings
    .filter((h) => h.assetClass === 'EQUITY')
    .reduce((sum, h) => sum + h.weightPct, 0);
  const cashAllocationPct = holdings
    .filter((h) => h.assetClass === 'CASH')
    .reduce((sum, h) => sum + h.weightPct, 0);

  const isValidAllocation = Math.abs(totalAllocationPct - 100.0) < 0.01;

  // Handler: Load Demo Portfolio Preset
  const handleLoadDemoPortfolio = () => {
    setPortfolioName('Alpha Growth & Income Demo Portfolio');
    setTotalCapital(10000000);
    setRiskProfile('BALANCED');
    setHoldings([
      { symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'EQUITY', weightPct: 20 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', assetClass: 'EQUITY', weightPct: 15 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'EQUITY', weightPct: 15 },
      { symbol: 'INFY', name: 'Infosys Limited', assetClass: 'EQUITY', weightPct: 10 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', assetClass: 'EQUITY', weightPct: 8 },
      { symbol: 'GSEC10Y', name: '10-Year Govt Security', assetClass: 'FIXED_INCOME', weightPct: 10 },
      { symbol: 'CORPBOND', name: 'AAA Corporate Bond ETF', assetClass: 'FIXED_INCOME', weightPct: 7 },
      { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', assetClass: 'COMMODITY', weightPct: 10 },
      { symbol: 'CASH', name: 'INR Cash & Liquidity', assetClass: 'CASH', weightPct: 5 },
    ]);
    setNoticeMessage(
      'Demo portfolio loaded into input form. Review allocations below and click ANALYZE PORTFOLIO to run risk engine.'
    );
  };

  // Handler: Analyze Portfolio (Submit to Backend)
  const handleAnalyzePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAllocation) return;

    setAnalyzing(true);
    setAnalysisStep('Saving portfolio & asset holdings to database...');

    try {
      // 1. Update policy thresholds on backend if modified
      const currentPol = policies.find((p) => p.name === riskProfile);
      const numEq = typeof maxEquityExposure === 'number' ? maxEquityExposure : parseFloat(maxEquityExposure) || 60;
      const numCash = typeof minCashAllocation === 'number' ? minCashAllocation : parseFloat(minCashAllocation) || 5;
      const numVol = typeof maxPortfolioVolatility === 'number' ? maxPortfolioVolatility : parseFloat(maxPortfolioVolatility) || 15;
      const numLiq = typeof minLiquidityScore === 'number' ? minLiquidityScore : parseFloat(minLiquidityScore) || 70;
      const numDd = typeof maxDrawdown === 'number' ? maxDrawdown : parseFloat(maxDrawdown) || 20;
      const numAsset = typeof maxIndividualAssetWeight === 'number' ? maxIndividualAssetWeight : parseFloat(maxIndividualAssetWeight) || 30;

      if (currentPol?._id) {
        try {
          await apiService.updateRiskPolicy(currentPol._id, {
            maxEquityExposure: numEq / 100,
            minCashAllocation: numCash / 100,
            maxPortfolioVolatility: numVol / 100,
            minLiquidityScore: numLiq,
            maxDrawdown: numDd / 100,
            maxIndividualAssetWeight: numAsset / 100,
          });
        } catch (polErr) {
          console.warn('Note updating policy thresholds:', polErr);
        }
      }

      setAnalysisStep('Calculating multi-factor covariance, tail risk & composite risk index...');
      await new Promise((r) => setTimeout(r, 400));

      setAnalysisStep('Evaluating risk policy limits and governance compliance thresholds...');
      await new Promise((r) => setTimeout(r, 400));

      // 2. Submit portfolio data to backend
      const payloadHoldings = holdings.map((h) => ({
        symbol: h.symbol,
        weight: h.weightPct / 100,
      }));

      await analyzePortfolio({
        portfolioId: activePortfolio?._id,
        name: portfolioName,
        totalCapital: totalCapitalNum,
        riskProfile,
        holdings: payloadHoldings,
      });

      setIsAnalyzed(true);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Portfolio setup analysis failed:', err);
      setNoticeMessage(err?.message || 'Failed to submit portfolio for analysis. Please check inputs.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E5E3DA] p-5 sm:p-6 rounded-xl shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2925] tracking-tight">
              Portfolio Setup & Risk Initialization
            </h2>
            <StatusBadge status="INFO" label="INPUT-DRIVEN MODE" />
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1.5 leading-relaxed">
            Enter portfolio capital, holdings allocation and governance parameters. The backend Risk Engine will analyze your inputs dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleLoadDemoPortfolio}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#EAE8E1] text-[#1C2925] rounded-lg text-xs font-bold transition-all border border-[#E5E3DA] shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#1D5B4B]" />
            <span>Load Demo Portfolio</span>
          </button>
        </div>
      </div>

      {/* Notice Callout Banner */}
      {noticeMessage && (
        <div className="bg-[#E3EBE4] border border-[#C5D7C8] p-4 rounded-xl flex items-center justify-between text-[#1D5B4B] text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1D5B4B] flex-shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)} className="text-[#1D5B4B] hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* SETUP FORM */}
      <form onSubmit={handleAnalyzePortfolio} className="space-y-6">
        {/* SECTION A: PORTFOLIO INFORMATION */}
        <SectionCard
          title="1. Portfolio Information"
          subtitle="Define portfolio name, total capital base, and operating currency"
          icon={<Wallet className="w-4 h-4 text-[#1D5B4B]" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-[#1C2925] block">Portfolio Name</label>
              <input
                type="text"
                required
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder="e.g. Alpha Growth & Income Portfolio"
                className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] text-xs font-semibold rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#1D5B4B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C2925] block">Total Capital Base (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="10000"
                  step="10000"
                  value={totalCapital}
                  onChange={(e) => setTotalCapital(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Range: ₹10,000 – ₹1,000,000,000"
                  className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#1D5B4B]"
                />
              </div>
              <span className="text-[10px] text-stone-500 font-medium block">
                Formatted: {formatCurrency(totalCapitalNum)}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* SECTION B: HOLDINGS ALLOCATION INPUT */}
        <SectionCard
          title="2. Asset Universe & Holdings Allocation"
          subtitle="Add financial assets and specify percentage weights (must total exactly 100%)"
          icon={<PieChart className="w-4 h-4 text-[#1D5B4B]" />}
        >
          <div className="space-y-4">
            {/* Add Asset Selector Header */}
            <div className="flex flex-wrap items-end gap-3 p-3.5 bg-white border border-[#E5E3DA] rounded-xl">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-stone-600 block">Select Asset Symbol</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                >
                  {availableAssets.map((a) => (
                    <option key={a._id} value={a.symbol}>
                      {a.symbol} — {a.name} ({a.assetClass})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 w-32">
                <label className="text-xs font-bold text-stone-600 block">Weight (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={addWeightPct}
                  onChange={(e) => setAddWeightPct(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Range: 1 – 100%"
                  className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#1D5B4B]"
                />
              </div>

              <button
                type="button"
                onClick={handleAddHolding}
                className="px-4 py-2 bg-[#1D5B4B] hover:bg-[#16483B] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holding</span>
              </button>
            </div>

            {/* Holdings Table */}
            <div className="overflow-x-auto border border-[#E5E3DA] rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F5] border-b border-[#E5E3DA] text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Asset Symbol</th>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Asset Class</th>
                    <th className="p-3 text-right">Allocation Weight (%)</th>
                    <th className="p-3 text-right">Calculated Value (₹)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DA]/60 font-mono">
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 font-sans text-xs">
                        No holdings added yet. Select an asset above and click Add Holding.
                      </td>
                    </tr>
                  ) : (
                    holdings.map((h) => {
                      const val = (h.weightPct / 100) * totalCapitalNum;
                      return (
                        <tr key={h.symbol} className="hover:bg-[#FAF9F5]/80">
                          <td className="p-3 font-bold text-[#1C2925]">{h.symbol}</td>
                          <td className="p-3 text-stone-600 font-sans">{h.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E3EBE4] text-[#1D5B4B]">
                              {h.assetClass}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={h.weightPct}
                              onChange={(e) => handleWeightChange(h.symbol, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              placeholder="0 – 100"
                              className="w-24 text-right bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2 py-1 focus:outline-none focus:border-[#1D5B4B]"
                            />
                            <span className="ml-1 text-stone-500 font-sans">%</span>
                          </td>
                          <td className="p-3 text-right font-bold text-[#1D5B4B]">
                            {formatCurrency(val)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveHolding(h.symbol)}
                              className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                              title="Remove holding"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Allocation Summary & Validation Bar */}
            <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DA] rounded-xl space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Allocation</span>
                  <span className={`text-base font-extrabold font-mono ${isValidAllocation ? 'text-[#1D5B4B]' : 'text-[#8C2C1E]'}`}>
                    {totalAllocationPct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Remaining</span>
                  <span className="text-base font-extrabold font-mono text-stone-700">
                    {remainingAllocationPct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Equity Exposure</span>
                  <span className="text-base font-extrabold font-mono text-stone-800">
                    {equityExposurePct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Cash Reserve</span>
                  <span className="text-base font-extrabold font-mono text-stone-800">
                    {cashAllocationPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Validation Warning */}
              {!isValidAllocation && (
                <div className="p-3 bg-[#FDF0ED] border border-[#F6D0C9] rounded-lg flex items-center gap-2 text-xs text-[#8C2C1E] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-[#A63A2B] shrink-0" />
                  <span>
                    Allocation total is {totalAllocationPct.toFixed(1)}%. It must equal exactly 100.0% before portfolio analysis can be executed (Difference: {Math.abs(remainingAllocationPct).toFixed(1)}%).
                  </span>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* SECTION C: RISK POLICY & GOVERNANCE THRESHOLDS */}
        <SectionCard
          title="3. Governance Policy Limits & Risk Profile"
          subtitle="Select target risk policy profile and fine-tune mandated governance boundaries"
          icon={<Shield className="w-4 h-4 text-[#1D5B4B]" />}
        >
          <div className="space-y-4">
            {/* Risk Profile Selection Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#E5E3DA] rounded-xl">
              <div>
                <label className="text-xs font-bold text-[#1C2925] block uppercase tracking-wider">Target Risk Profile:</label>
                <span className="text-[11px] text-stone-500">Loads backend governance defaults for selected mandate</span>
              </div>
              <div className="flex items-center gap-2">
                {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                  <button
                    key={prof}
                    type="button"
                    onClick={() => handleProfileChange(prof)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      riskProfile === prof
                        ? 'bg-[#1D5B4B] text-white border-[#1D5B4B] shadow-2xs'
                        : 'bg-white text-stone-600 border-[#E5E3DA] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    {prof}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Policy Threshold Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Max Equity Exposure Ceiling</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={maxEquityExposure}
                    onChange={(e) => setMaxEquityExposure(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0 – 100%"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Min Cash Allocation Floor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={minCashAllocation}
                    onChange={(e) => setMinCashAllocation(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0 – 100%"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Max Volatility Limit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={maxPortfolioVolatility}
                    onChange={(e) => setMaxPortfolioVolatility(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0 – 100%"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Min Liquidity Score</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={minLiquidityScore}
                    onChange={(e) => setMinLiquidityScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0 – 100 pts"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">pts</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Max Drawdown Ceiling</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0 – 100%"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Max Single Asset Weight</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={maxIndividualAssetWeight}
                    onChange={(e) => setMaxIndividualAssetWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0 – 100%"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Risk Aversion Factor (λ)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="10"
                    value={riskAversion}
                    onChange={(e) => setRiskAversion(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0.1 – 10.0"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E5E3DA] p-3.5 rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-[#1C2925] block">Transaction Cost Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="5"
                    value={transactionCost}
                    onChange={(e) => setTransactionCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Range: 0.00 – 5.00%"
                    className="w-full bg-[#FAF9F5] border border-[#E5E3DA] text-[#1C2925] font-mono text-xs font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1D5B4B]"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* SECTION D: ANALYZE PORTFOLIO SUBMIT BAR */}
        <div className="p-5 bg-white border border-[#E5E3DA] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs text-stone-600 font-medium">
            <span className="font-bold text-[#1C2925]">Ready for Risk Engine Analysis: </span>
            {holdings.length} assets configured • Total Capital: {formatCurrency(totalCapitalNum)}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleLoadDemoPortfolio}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-[#EAE8E1] text-[#1C2925] text-xs font-bold rounded-xl transition-all border border-[#E5E3DA] shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-[#1D5B4B]" />
              <span>Load Demo Preset</span>
            </button>

            <button
              type="submit"
              disabled={!isValidAllocation || analyzing}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#1D5B4B] hover:bg-[#16483B] disabled:bg-stone-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Portfolio...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>ANALYZE PORTFOLIO</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* PROCESSING MODAL OVERLAY */}
      {analyzing && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF9F5] border border-[#E5E3DA] rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 bg-[#E3EBE4] text-[#1D5B4B] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1D5B4B]" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1C2925]">Running Risk Engine</h3>
              <p className="text-xs text-stone-500 font-medium mt-2 leading-relaxed">{analysisStep}</p>
            </div>
            <div className="h-1.5 w-full bg-[#EAE8E1] rounded-full overflow-hidden">
              <div className="h-full bg-[#1D5B4B] animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSetup;
