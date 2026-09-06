# CapitalGuard — Backend API & Risk Engine (Phase 1 & 2 Complete)

> **AI-Assisted Portfolio Optimization & Risk Control Platform**
> 
> *A production-quality, explainable financial risk engine built for high reliability, mathematical clarity, fast execution, and strict policy enforcement.*

---

## 1. Project Purpose & Phase 2 Overview

CapitalGuard provides institutional-grade portfolio risk analysis and compliance enforcement. In **Phase 2**, the Risk Engine evaluates portfolio holdings against historical price observations and user-configured risk policies (`CONSERVATIVE`, `BALANCED`, `AGGRESSIVE`).

> **Disclaimer**: This Risk Engine is a hackathon decision-support prototype and does not constitute financial advice or regulatory risk measurement.

---

## 2. Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas / Local MongoDB (with Mongoose ODM)
- **Utilities**: `dotenv`, `cors`, `tsx`
- **Testing**: Built-in 19-test suite for risk metrics and policy breach verification.

---

## 3. Architecture & Clean Layer Separation

The application strictly enforces a layered architecture:

```
Express Routes (src/routes/risk.routes.ts)
     ↓
Controllers (src/controllers/risk.controller.ts)
     ↓
Services (src/services/risk.service.ts)
     ↓
Risk Engine (src/engines/risk/riskEngine.ts)
     ↓
Modular Calculation Units:
  ├── returnCalculator.ts        # Aligns price series & calculates daily/annual returns
  ├── volatilityCalculator.ts    # Asset & Portfolio annualized volatility
  ├── covarianceCalculator.ts    # Annualized covariance & correlation matrices
  ├── varCalculator.ts           # Parametric 1-Day 95% Value at Risk (VaR)
  ├── drawdownCalculator.ts      # Historical Maximum Drawdown
  ├── concentrationCalculator.ts # Herfindahl-Hirschman Index (HHI)
  ├── liquidityCalculator.ts     # Weighted portfolio liquidity score
  ├── policyEvaluator.ts         # Policy threshold breach evaluator
  ├── riskScoreCalculator.ts     # Composite 0-100 explainable risk score
  └── recommendationEngine.ts    # Breach-specific actionable recommendations
     ↓
Models (MongoDB / Mongoose schemas: Portfolio, Asset, RiskPolicy, Alert)
```

---

## 4. Financial Risk Formulas Implemented

1. **Daily Returns**:
   $$r_t = \frac{P_t}{P_{t-1}} - 1$$
   *(Calculated on chronologically aligned dates across all portfolio assets)*

2. **Expected Annual Return**:
   $$\text{ExpectedReturn}_{\text{annual}} = \bar{r} \times 252$$
   $$\text{PortfolioReturn} = \sum_{i} w_i \times \text{ExpectedReturn}_i$$

3. **Asset & Portfolio Annualized Volatility**:
   $$\sigma_{\text{asset}} = \sigma_{\text{daily}} \times \sqrt{252}$$
   $$\sigma_{\text{portfolio}} = \sqrt{w^T \Sigma_{\text{annual}} w}$$

4. **Covariance & Correlation Matrices**:
   $$\text{Cov}_{\text{daily}}(i, j) = \frac{\sum (r_{i,t} - \bar{r}_i)(r_{j,t} - \bar{r}_j)}{N - 1}$$
   $$\Sigma_{\text{annual}} = \Sigma_{\text{daily}} \times 252$$
   $$\rho_{i,j} = \frac{\text{Cov}(i, j)}{\sigma_i \sigma_j}$$

5. **Parametric 1-Day 95% Value at Risk (VaR)**:
   $$\text{VaR}_{95\%} = 1.645 \times \frac{\sigma_{\text{portfolio}}}{\sqrt{252}} \times \text{TotalCapital}$$

6. **Historical Maximum Drawdown**:
   $$V_t = \sum_{i} w_i \frac{P_{i,t}}{P_{i,0}}, \quad M_t = \max_{0 \le s \le t} V_s, \quad D_t = \frac{V_t - M_t}{M_t}$$
   $$\text{MaxDrawdown} = |\min(D_t)|$$

7. **Herfindahl-Hirschman Concentration Index (HHI)**:
   $$\text{HHI} = \sum_{i} w_i^2$$
   *(Classified as `LOW` < 0.15, `MODERATE` 0.15–0.25, `HIGH` $\ge$ 0.25)*

8. **Weighted Portfolio Liquidity**:
   $$\text{PortfolioLiquidity} = \sum_{i} w_i \times \text{LiquidityScore}_i$$

---

## 5. Composite Risk Score Methodology & Explainability

The composite risk score is a **0–100 weighted index** calculated from 5 normalized risk components:

- **Volatility (30%)**: Normalized against `policy.maxPortfolioVolatility`
- **VaR (25%)**: Normalized against policy-equivalent VaR threshold
- **Concentration (15%)**: Normalized against HHI threshold (0.25)
- **Drawdown (15%)**: Normalized against `policy.maxDrawdown`
- **Liquidity (15%)**: Normalized inversely against `policy.minLiquidityScore`

**Formula**:
$$\text{RiskScore} = \text{round}\left( 0.30 S_{\text{vol}} + 0.25 S_{\text{var}} + 0.15 S_{\text{conc}} + 0.15 S_{\text{dd}} + 0.15 S_{\text{liq}} \right)$$

**Classifications**:
- `0–30`: **LOW**
- `31–60`: **MODERATE**
- `61–80`: **HIGH**
- `81–100`: **CRITICAL**

---

## 6. Available API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status & market provider health |
| `GET` | `/api/assets` | Retrieve all financial assets |
| `GET` | `/api/assets/:id` | Retrieve asset details by ID or Symbol |
| `GET` | `/api/portfolios` | Retrieve all portfolios with populated asset info |
| `GET` | `/api/portfolios/:id` | Retrieve portfolio by ID with allocation status |
| `GET` | `/api/risk-policies` | Retrieve active risk policies (Conservative, Balanced, Aggressive) |
| `GET` | `/api/risk/portfolio/:portfolioId` | **Full Risk Report** (Metrics, Covariance, Breaches, Alerts, Recs) |
| `GET` | `/api/risk/portfolio/:portfolioId/summary` | **Dashboard Summary Report** (Risk Score, Level, Key Metrics) |

---

## 7. Sample API Response (`GET /api/risk/portfolio/:portfolioId`)

```json
{
  "success": true,
  "data": {
    "portfolioId": "6a9c989c044176cacf55568b",
    "portfolioName": "Alpha Growth & Income Demo Portfolio",
    "totalCapital": 10000000,
    "riskProfile": "BALANCED",
    "metrics": {
      "expectedReturn": 0.1086,
      "portfolioVolatility": 0.0683,
      "var95": {
        "confidenceLevel": 0.95,
        "horizonDays": 1,
        "amount": 70733.16,
        "percentage": 0.00707,
        "label": "Parametric 1-day 95% VaR"
      },
      "maximumDrawdown": 0.0727,
      "concentration": {
        "hhi": 0.1288,
        "concentrationLevel": "LOW",
        "largestHoldingSymbol": "RELIANCE",
        "largestHoldingWeight": 0.2,
        "holdingCount": 9
      },
      "liquidityScore": 93.04,
      "equityExposure": 0.68,
      "cashAllocation": 0.05
    },
    "riskScore": {
      "score": 49,
      "level": "MODERATE",
      "breakdown": {
        "volatility": { "score": 45.5, "weight": 0.3, "contribution": 13.65 },
        "var": { "score": 45.5, "weight": 0.25, "contribution": 11.38 },
        "concentration": { "score": 51.5, "weight": 0.15, "contribution": 7.73 },
        "drawdown": { "score": 36.3, "weight": 0.15, "contribution": 5.44 },
        "liquidity": { "score": 75.2, "weight": 0.15, "contribution": 11.28 }
      }
    },
    "policyEvaluation": {
      "passed": false,
      "totalBreaches": 1,
      "breaches": [
        {
          "type": "EQUITY_EXPOSURE",
          "severity": "CRITICAL",
          "currentValue": 0.68,
          "limit": 0.60,
          "excess": 0.08,
          "message": "Equity exposure (68.0%) exceeds the BALANCED policy limit of 60.0% by 8.0 percentage points."
        }
      ]
    },
    "recommendations": [
      "Reduce equity exposure by 8.0 percentage points and reallocate to government bonds, corporate credit, or liquid cash reserves."
    ]
  }
}
```

---

## 8. Running Tests & Demo Verification

- Run 19-test Risk Engine Suite:
  ```bash
  npm test
  ```
- Run End-to-End Demo Portfolio Verification:
  ```bash
  npx tsx src/seed/verifyPhase2Demo.ts
  ```
- Seed MongoDB Atlas database:
  ```bash
  npm run seed
  ```
- Build TypeScript project:
  ```bash
  npm run build
  ```
