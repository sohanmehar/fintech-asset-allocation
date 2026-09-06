# 🛡️ CapitalGuard — Institutional Portfolio Allocation, Risk & Optimization Engine

[![Build Status](https://img.shields.io/badge/Build-Passing-1D5B4B?style=for-the-badge&logo=vite)](https://fintech-asset-allocation.vercel.app)
[![Tests](https://img.shields.io/badge/Unit%20Tests-68%2F68%20Passed-1D5B4B?style=for-the-badge&logo=jest)](https://github.com/sohanmehar/fintech-asset-allocation)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript)](https://github.com/sohanmehar/fintech-asset-allocation)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel)](https://fintech-asset-allocation.vercel.app)
[![Deployed on Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render)](https://fintech-asset-allocation.onrender.com)

---

## 📌 Executive Summary

**CapitalGuard** is an enterprise-grade portfolio risk control, asset allocation optimization, and governance terminal designed for wealth management firms, risk officers, and institutional portfolio managers.

The platform continuously monitors multi-factor portfolio risks, calculates tail-loss metrics (1-Day 95% VaR, Maximum Drawdown), detects policy breaches, runs non-mutating stress scenarios, and generates deterministic rebalancing trade instructions to restore compliance.

---

## 🌐 Live Deployments & Demo Credentials

- **Frontend Application (Vercel)**: [https://fintech-asset-allocation.vercel.app](https://fintech-asset-allocation.vercel.app)
- **Backend API (Render)**: [https://fintech-asset-allocation.onrender.com](https://fintech-asset-allocation.onrender.com)
- **GitHub Repository**: [https://github.com/sohanmehar/fintech-asset-allocation](https://github.com/sohanmehar/fintech-asset-allocation)


---

## ✨ Key Features & Architecture

### 🎨 1. Premium Institutional Wealth Theme
- **Light Warm Aesthetic**: Refined warm ivory background (`#F5F4EE`) and cream cards (`#FAF9F5`) matching institutional private banking control terminals.
- **Deep Forest Green Navigation**: Sidebar (`#0D2923`) with gold badge, line iconography, and editorial typography (`Playfair Display` serif headers & `Inter` sans-serif metric data).

### 📐 2. Multi-Factor Risk Engine (Phase 2)
- **Historical Analysis**: Computes annualized returns and standard deviations from ~500 daily trading observations across multi-asset universes (Equities, Sovereign Bonds, Corporate Credit, Gold, Cash).
- **Covariance & Correlation**: Symmetric $N \times N$ matrices ensuring positive semi-definite risk properties.
- **Parametric 1-Day 95% VaR**: Calculates tail-loss exposure ($\text{VaR}_{95} = 1.645 \cdot \sigma_p \cdot V$).
- **Maximum Drawdown**: Peak-to-trough historical loss calculation.
- **Concentration Analysis**: Herfindahl-Hirschman Index (HHI) concentration evaluation.
- **Tier-Weighted Liquidity Score**: Asset liquidity scoring (0–100).
- **Composite Risk Score**: Weighted risk index ($0-100$) categorized into `LOW`, `MODERATE`, `HIGH`, and `CRITICAL`.

### ⚙️ 3. Candidate-Based Optimization Engine (Phase 3)
- **Mean-Variance Trade-Off**: Evaluates candidate allocation vectors using objective utility:
  $$\text{Utility} = \mu_p - \lambda \cdot \sigma_p^2 - \text{Penalty}_{\text{turnover}}$$
- **Hard Governance Constraints**: Enforces max equity ceiling (e.g. 60%), max asset weight (30%), min cash buffer (5%), min liquidity (70 pts), and max volatility (15%).
- **Rebalancing Order Generator**: Issues clear `BUY`, `SELL`, `HOLD` trade instructions with exact monetary amounts and percentage adjustments, incorporating a $0.1\%$ transaction fee model.

### 🧪 4. Stress Testing & Scenario Simulation Engine (Phase 5)
- **Immutability Mandate**: Runs macroeconomic stress tests without mutating underlying portfolio holdings.
- **Predefined Macro Scenarios**:
  - **Market Crash**: $-20\%$ equity shock, $+30\%$ volatility spike.
  - **Interest Rate Shock**: $-8\%$ bond price impact, $+20\%$ liquidity penalty.
  - **Liquidity Crisis**: $-20\%$ asset liquidity deterioration.
  - **Sector Shock**: Target shocks on specific industries.
  - **Custom Stress Tests**: User-defined percentage shock vectors.
- **Monetary Impact Ranking**: Ranks asset losses by absolute monetary value and provides actionable risk recommendations.

### 📋 5. Alerts, Governance & Audit Trail (Phase 6)
- **Automated Breach Detection**: Evaluates risk metrics against policy ceilings and automatically generates severity-mapped alerts (`CRITICAL`, `HIGH`, `WARNING`, `INFO`).
- **Alert Lifecycle Management**: Supports status progression (`OPEN` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `RESOLVED`) with deduplication.
- **Immutable Audit Log**: Records all risk evaluations, policy edits, optimization runs, and stress simulations.

---

## 🧮 Mathematical Foundations & Formulas

| Metric | Mathematical Formula | Description |
| :--- | :--- | :--- |
| **Annualized Expected Return** | $\mu_p = \sum_{i=1}^{N} w_i \cdot (\bar{r}_i \cdot 252)$ | Weighted sum of annualized mean daily asset returns. |
| **Portfolio Volatility** | $\sigma_p = \sqrt{w^T \Sigma w}$ | Quadratic form calculation using annualized covariance matrix $\Sigma$. |
| **1-Day 95% Value at Risk** | $\text{VaR}_{95\%} = 1.645 \cdot \sigma_{\text{daily}} \cdot V$ | Parametric normal tail-loss threshold at 95% confidence level. |
| **Maximum Drawdown** | $\text{MDD} = \max_{t} \left( \frac{P_{\text{peak}} - P_t}{P_{\text{peak}}} \right)$ | Historical worst peak-to-trough portfolio value decline. |
| **Concentration (HHI)** | $\text{HHI} = \sum_{i=1}^{N} w_i^2$ | Herfindahl-Hirschman Index measure of asset weight concentration. |
| **Optimization Objective** | $\max_{w} \left( \mu_p - \lambda \sigma_p^2 - \tau \cdot \sum \vert w_i - w_{i,0} \vert \right)$ | Penalized mean-variance objective function with turnover penalty $\tau$. |

---

## 📁 Repository Directory Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/             # DB & Environment Configuration
│   │   ├── controllers/        # Express Route Controllers
│   │   ├── engines/            # Core Financial Engines
│   │   │   ├── risk/           # Risk Engine & Policy Evaluator
│   │   │   ├── optimization/   # Candidate Mean-Variance Optimizer
│   │   │   ├── scenario/       # Macro Stress Testing Engine
│   │   │   └── governance/     # Alert Generator & Audit Engine
│   │   ├── models/             # Mongoose Schemas & TypeScript Interfaces
│   │   ├── routes/             # REST API Express Routes
│   │   ├── seed/               # Data Generators & Verification Scripts
│   │   ├── services/           # Service Business Logic Layer
│   │   ├── tests/              # Jest/TSX Comprehensive Engine Unit Tests
│   │   ├── app.ts              # Express App Setup & Middleware
│   │   └── server.ts           # HTTP Server Bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/      # Allocation Chart, Risk Breakdown, Metric Cards
│   │   │   ├── layout/         # Institutional Deep Forest Sidebar & Light Topbar
│   │   │   └── ui/             # Reusable Cards, Badges, Progress Bars
│   │   ├── context/            # PortfolioContext State Provider
│   │   ├── pages/              # Dashboard, Portfolio, Risk Monitor, Optimization, Scenarios, Alerts, Settings
│   │   ├── services/           # Axios API Client & Endpoints
│   │   ├── types/              # Frontend TypeScript Interfaces
│   │   └── utils/              # Formatting Helpers & Currency Utilities
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── render.yaml                 # Render Backend Deployment Specification
├── vercel.json                 # Vercel Frontend Deployment Specification
└── README.md
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance or MongoDB Atlas connection string (or set `ALLOW_MEMORY_DB_FALLBACK=true`)

### 2. Clone Repository
```bash
git clone https://github.com/sohanmehar/fintech-asset-allocation.git
cd fintech-asset-allocation
```

### 3. Backend Setup
```bash
cd backend
npm install

# Create local environment file
cp .env.example .env
```

Configure `.env` in `backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/capitalguard
MARKET_DATA_PROVIDER=seeded
JWT_SECRET=capitalguard_secret_key_2026
CLIENT_URL=http://localhost:5173
ALLOW_MEMORY_DB_FALLBACK=true
```

Seed the database with ~500 trading days of historical market data and initial demo portfolios:
```bash
npm run seed
```

Start the backend development server:
```bash
npm run dev
```
*Backend server will start at `http://localhost:5000`.*

### 4. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will start at `http://localhost:5173`.*

---

## 🧪 Running Unit Tests

The backend test suite verifies all mathematical calculations, risk formulas, constraint evaluations, scenario shock immutability, and governance rules.

```bash
cd backend
npm test
```

### Test Suite Summary (68 / 68 Passed)
- `tests/riskEngine.test.ts` — **19/19 PASSED** (VaR, Volatility, HHI, Policy Breaches)
- `tests/optimizationEngine.test.ts` — **21/21 PASSED** (Mean-Variance Utility, Constraints, Rebalancing)
- `tests/scenarioEngine.test.ts` — **14/14 PASSED** (Market Shock Immutability, Impact Ranking)
- `tests/governanceEngine.test.ts` — **14/14 PASSED** (Alert Lifecycle, Severity Mapping, Audit Logs)

---

## 🔌 API Reference

### Health & Assets
- `GET /api/health` — API health check
- `GET /api/assets` — List all financial assets with historical prices

### Risk Engine
- `GET /api/risk/portfolio/:portfolioId` — Generate complete multi-factor risk report
- `GET /api/risk/portfolio/:portfolioId/summary` — Lightweight risk summary metrics

### Optimization Engine
- `POST /api/optimization/run` — Run candidate mean-variance optimization & generate trade orders
- `GET /api/optimization/history/:portfolioId` — Fetch past optimization runs

### Scenario Engine
- `GET /api/scenarios/definitions` — List available stress testing scenario definitions
- `POST /api/scenarios/run` — Execute non-mutating stress scenario simulation

### Governance & Alerts
- `GET /api/governance/alerts/portfolio/:portfolioId` — Fetch active governance alerts
- `POST /api/governance/alerts/evaluate` — Trigger alert evaluation scan
- `PATCH /api/governance/alerts/:alertId/acknowledge` — Acknowledge alert
- `PATCH /api/governance/alerts/:alertId/resolve` — Resolve alert
- `GET /api/governance/audit-logs` — Fetch system audit log trail
- `GET /api/governance/policies` — List risk policies
- `PUT /api/governance/policies/:policyId` — Update policy threshold parameters

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel
1. Connect repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Environment variable: `VITE_API_BASE_URL` = `https://fintech-asset-allocation.onrender.com/api`

### Deploying Backend to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect repository and set **Root Directory** to `backend`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `<your-mongodb-atlas-uri>`
   - `CLIENT_URL` = `https://fintech-asset-allocation.vercel.app`

---

## 📜 License

Distributed under the **ISC License**. See `LICENSE` for details.

Developed for **Institutional Portfolio Risk Control & Asset Allocation**.
