import axios from 'axios';
import type {
  ApiResponse,
  Asset,
  Portfolio,
  RiskPolicy,
  RiskReport,
  RiskSummaryReport,
  OptimizationParams,
  OptimizationResult,
  ScenarioDefinition,
  RunScenarioParams,
  ScenarioRunResult,
  AlertItem,
  AuditLogItem,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const apiService = {
  // Health
  getHealth: async () => {
    const res = await apiClient.get<any>('/health');
    return res.data;
  },

  // Assets
  getAssets: async (): Promise<Asset[]> => {
    const res = await apiClient.get<ApiResponse<Asset[]>>('/assets');
    return res.data.data;
  },

  getAssetById: async (id: string): Promise<Asset> => {
    const res = await apiClient.get<ApiResponse<Asset>>(`/assets/${id}`);
    return res.data.data;
  },

  // Portfolios
  getPortfolios: async (): Promise<Portfolio[]> => {
    const res = await apiClient.get<ApiResponse<Portfolio[]>>('/portfolios');
    return res.data.data;
  },

  getPortfolioById: async (id: string): Promise<Portfolio> => {
    const res = await apiClient.get<any>(`/portfolios/${id}`);
    return res.data.data || res.data;
  },

  // Risk Policies
  getRiskPolicies: async (): Promise<RiskPolicy[]> => {
    const res = await apiClient.get<ApiResponse<RiskPolicy[]>>('/risk-policies');
    return res.data.data;
  },

  // Risk Engine
  getRiskReport: async (portfolioId: string): Promise<RiskReport> => {
    const res = await apiClient.get<ApiResponse<RiskReport>>(`/risk/portfolio/${portfolioId}`);
    return res.data.data;
  },

  getRiskSummary: async (portfolioId: string): Promise<RiskSummaryReport> => {
    const res = await apiClient.get<ApiResponse<RiskSummaryReport>>(`/risk/portfolio/${portfolioId}/summary`);
    return res.data.data;
  },

  // Optimization Engine
  runOptimization: async (params: OptimizationParams): Promise<OptimizationResult> => {
    const res = await apiClient.post<ApiResponse<OptimizationResult>>('/optimization/run', params);
    return res.data.data;
  },

  getOptimizationById: async (id: string): Promise<OptimizationResult> => {
    const res = await apiClient.get<ApiResponse<OptimizationResult>>(`/optimization/${id}`);
    return res.data.data;
  },

  getOptimizationByPortfolio: async (portfolioId: string): Promise<OptimizationResult[]> => {
    const res = await apiClient.get<ApiResponse<OptimizationResult[]>>(`/optimization/portfolio/${portfolioId}`);
    return res.data.data;
  },

  // Scenario Engine
  getScenarios: async (): Promise<ScenarioDefinition[]> => {
    const res = await apiClient.get<ApiResponse<ScenarioDefinition[]>>('/scenarios');
    return res.data.data;
  },

  runScenario: async (params: RunScenarioParams): Promise<ScenarioRunResult> => {
    const res = await apiClient.post<ApiResponse<ScenarioRunResult>>('/scenarios/run', params);
    return res.data.data;
  },

  // Governance & Alerts
  getAlerts: async (portfolioId?: string): Promise<AlertItem[]> => {
    const url = portfolioId ? `/alerts?portfolioId=${portfolioId}` : '/alerts';
    const res = await apiClient.get<ApiResponse<AlertItem[]>>(url);
    return res.data.data;
  },

  getAlertsByPortfolio: async (portfolioId: string): Promise<AlertItem[]> => {
    const res = await apiClient.get<ApiResponse<AlertItem[]>>(`/alerts/portfolio/${portfolioId}`);
    return res.data.data;
  },

  getAlertById: async (id: string): Promise<AlertItem> => {
    const res = await apiClient.get<ApiResponse<AlertItem>>(`/alerts/${id}`);
    return res.data.data;
  },

  generateAlerts: async (portfolioId: string): Promise<AlertItem[]> => {
    const res = await apiClient.post<ApiResponse<AlertItem[]>>('/alerts/generate', { portfolioId });
    return res.data.data;
  },

  acknowledgeAlert: async (id: string): Promise<AlertItem> => {
    const res = await apiClient.patch<ApiResponse<AlertItem>>(`/alerts/${id}/acknowledge`);
    return res.data.data;
  },

  resolveAlert: async (id: string): Promise<AlertItem> => {
    const res = await apiClient.patch<ApiResponse<AlertItem>>(`/alerts/${id}/resolve`);
    return res.data.data;
  },

  // Audit Logs
  getAuditLogs: async (portfolioId?: string, action?: string, limit: number = 50): Promise<AuditLogItem[]> => {
    let url = `/audit-logs?limit=${limit}`;
    if (portfolioId) url += `&portfolioId=${portfolioId}`;
    if (action) url += `&action=${action}`;
    const res = await apiClient.get<ApiResponse<AuditLogItem[]>>(url);
    return res.data.data;
  },

  // Risk Policy Updates
  updateRiskPolicy: async (id: string, updates: Partial<RiskPolicy>): Promise<RiskPolicy> => {
    const res = await apiClient.patch<ApiResponse<RiskPolicy>>(`/risk-policies/${id}`, updates);
    return res.data.data;
  },
};

