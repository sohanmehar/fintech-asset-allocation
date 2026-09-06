import { CovarianceMatrixResult, CorrelationMatrixResult, TRADING_DAYS_PER_YEAR } from './types';
import { calculateSampleStandardDeviation } from './volatilityCalculator';

/**
 * Calculates daily and annualized covariance matrix as well as correlation matrix for aligned returns.
 */
export function calculateCovarianceAndCorrelation(
  symbols: string[],
  returnsMatrix: number[][] // [returnIndex][assetIndex]
): {
  dailyCovariance: CovarianceMatrixResult;
  annualCovariance: CovarianceMatrixResult;
  correlation: CorrelationMatrixResult;
} {
  const numObs = returnsMatrix.length;
  const numAssets = symbols.length;

  if (numObs <= 1) {
    throw new Error('Insufficient return observations to compute covariance matrix.');
  }

  // 1. Calculate mean daily return for each asset
  const means: number[] = new Array(numAssets).fill(0);
  for (let t = 0; t < numObs; t++) {
    for (let a = 0; a < numAssets; a++) {
      means[a] += returnsMatrix[t][a];
    }
  }
  for (let a = 0; a < numAssets; a++) {
    means[a] /= numObs;
  }

  // 2. Compute Daily Covariance Matrix
  const dailyMatrix: number[][] = Array.from({ length: numAssets }, () => new Array(numAssets).fill(0));
  for (let i = 0; i < numAssets; i++) {
    for (let j = i; j < numAssets; j++) {
      let sumCov = 0;
      for (let t = 0; t < numObs; t++) {
        sumCov += (returnsMatrix[t][i] - means[i]) * (returnsMatrix[t][j] - means[j]);
      }
      const covVal = sumCov / (numObs - 1);
      dailyMatrix[i][j] = covVal;
      dailyMatrix[j][i] = covVal; // Symmetric
    }
  }

  // 3. Compute Annualized Covariance Matrix
  const annualMatrix: number[][] = dailyMatrix.map((row) =>
    row.map((val) => val * TRADING_DAYS_PER_YEAR)
  );

  // 4. Compute Correlation Matrix
  const dailyStdDevs: number[] = [];
  for (let a = 0; a < numAssets; a++) {
    const series = returnsMatrix.map((row) => row[a]);
    dailyStdDevs.push(calculateSampleStandardDeviation(series));
  }

  const corrMatrix: number[][] = Array.from({ length: numAssets }, () => new Array(numAssets).fill(0));
  for (let i = 0; i < numAssets; i++) {
    for (let j = 0; j < numAssets; j++) {
      const denom = dailyStdDevs[i] * dailyStdDevs[j];
      if (denom === 0) {
        corrMatrix[i][j] = i === j ? 1 : 0;
      } else {
        const corr = dailyMatrix[i][j] / denom;
        // Clamp between -1 and 1 to prevent floating point inaccuracies
        corrMatrix[i][j] = Math.max(-1.0, Math.min(1.0, Math.round(corr * 10000) / 10000));
      }
    }
  }

  return {
    dailyCovariance: { assets: symbols, matrix: dailyMatrix },
    annualCovariance: { assets: symbols, matrix: annualMatrix },
    correlation: { assets: symbols, matrix: corrMatrix },
  };
}
