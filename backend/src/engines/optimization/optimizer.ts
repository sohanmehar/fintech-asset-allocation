import {
  CandidateAllocation,
  ObjectiveBreakdown,
  ConstraintEvaluationResult,
} from './types';
import { generateCandidateAllocations } from './candidateGenerator';
import { evaluateConstraints } from './constraintEvaluator';
import { evaluateObjectiveFunction } from './objectiveFunction';
import { AlignedPriceData } from '../risk/returnCalculator';

export interface OptimizerInput {
  currentWeights: number[];
  assets: Array<{
    assetId: string;
    symbol: string;
    assetClass: string;
    minWeight: number;
    maxWeight: number;
    liquidityScore: number;
  }>;
  expectedReturns: number[];
  alignedPrices: AlignedPriceData;
  annualCovarianceMatrix: number[][];
  maxEquityExposure: number;
  minCashAllocation: number;
  maxPortfolioVolatility: number;
  minLiquidityScore: number;
  maxIndividualAssetWeight: number;
  maxDrawdown: number;
  riskAversion: number;
  transactionCostRate: number;
}

export interface OptimizerResultSuccess {
  status: 'OPTIMIZED';
  winningCandidateName: string;
  targetWeights: number[];
  objective: ObjectiveBreakdown;
  constraintResult: ConstraintEvaluationResult;
}

export interface OptimizerResultInfeasible {
  status: 'INFEASIBLE';
  reason: string;
  violatedConstraints: string[];
}

export type OptimizerResult = OptimizerResultSuccess | OptimizerResultInfeasible;

export function runConstrainedOptimizer(input: OptimizerInput): OptimizerResult {
  const {
    currentWeights,
    assets,
    expectedReturns,
    alignedPrices,
    annualCovarianceMatrix,
    maxEquityExposure,
    minCashAllocation,
    maxPortfolioVolatility,
    minLiquidityScore,
    maxIndividualAssetWeight,
    maxDrawdown,
    riskAversion,
    transactionCostRate,
  } = input;

  // 1. Generate Candidates
  const candidates: CandidateAllocation[] = generateCandidateAllocations({
    currentWeights,
    assets,
    maxEquityExposure,
    minCashAllocation,
    maxIndividualAssetWeight,
  });

  const feasibleScoredCandidates: Array<{
    candidate: CandidateAllocation;
    objective: ObjectiveBreakdown;
    constraintResult: ConstraintEvaluationResult;
  }> = [];

  // 2. Evaluate Constraints & Objective for Every Candidate
  candidates.forEach((cand) => {
    const constraintResult = evaluateConstraints({
      weights: cand.weights,
      assets,
      alignedPrices,
      annualCovarianceMatrix,
      maxEquityExposure,
      minCashAllocation,
      maxPortfolioVolatility,
      minLiquidityScore,
      maxIndividualAssetWeight,
      maxDrawdown,
    });

    if (constraintResult.feasible) {
      const objective = evaluateObjectiveFunction({
        weights: cand.weights,
        currentWeights,
        expectedReturns,
        annualCovarianceMatrix,
        riskAversion,
        transactionCostRate,
      });

      feasibleScoredCandidates.push({
        candidate: cand,
        objective,
        constraintResult,
      });
    }
  });

  // 3. Handle Infeasible Result
  if (feasibleScoredCandidates.length === 0) {
    // Evaluate current weights constraints to detail exact violations
    const currentConstraints = evaluateConstraints({
      weights: currentWeights,
      assets,
      alignedPrices,
      annualCovarianceMatrix,
      maxEquityExposure,
      minCashAllocation,
      maxPortfolioVolatility,
      minLiquidityScore,
      maxIndividualAssetWeight,
      maxDrawdown,
    });

    return {
      status: 'INFEASIBLE',
      reason: 'No feasible target allocation satisfying all configured risk constraints could be found.',
      violatedConstraints: currentConstraints.violations,
    };
  }

  // 4. Select Candidate with Maximum Objective Value
  feasibleScoredCandidates.sort((a, b) => b.objective.totalObjective - a.objective.totalObjective);
  const winner = feasibleScoredCandidates[0];

  return {
    status: 'OPTIMIZED',
    winningCandidateName: winner.candidate.name,
    targetWeights: winner.candidate.weights,
    objective: winner.objective,
    constraintResult: winner.constraintResult,
  };
}
