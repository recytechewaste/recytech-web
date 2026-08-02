// Simple predictive analytics utilities
// No external dependencies required

/**
 * Calculate linear regression for trend forecasting
 * @param {Array} dataPoints - Array of {x, y} objects
 * @returns {Object} - slope, intercept, rSquared, predict function
 */
function linearRegression(dataPoints) {
    const n = dataPoints.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0, predict: () => 0 };

    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumYY = dataPoints.reduce((sum, point) => sum + point.y * point.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = dataPoints.reduce((sum, point) => {
        const predicted = slope * point.x + intercept;
        return sum + Math.pow(point.y - predicted, 2);
    }, 0);
    const ssTot = dataPoints.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

    return {
        slope,
        intercept,
        rSquared,
        predict: (x) => slope * x + intercept
    };
}

/**
 * Calculate Pearson correlation coefficient
 * @param {Array} x - First dataset
 * @param {Array} y - Second dataset
 * @returns {number} - Correlation coefficient (-1 to 1)
 */
function pearsonCorrelation(x, y) {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate moving average for smoothing
 * @param {Array} data - Array of numbers
 * @param {number} window - Window size
 * @returns {Array} - Smoothed data
 */
function movingAverage(data, window = 3) {
    if (data.length < window) return data;

    const result = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const end = i + 1;
        const slice = data.slice(start, end);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        result.push(avg);
    }
    return result;
}

/**
 * Detect seasonal patterns (simplified)
 * @param {Array} data - Time series data
 * @param {number} period - Seasonal period (e.g., 12 for monthly)
 * @returns {Object} - seasonal indices and trend
 */
function seasonalDecomposition(data, period = 12) {
    if (data.length < period * 2) return { seasonal: [], trend: data, remainder: [] };

    // Calculate trend using moving average
    const trend = movingAverage(data, period);

    // Calculate seasonal indices
    const seasonalIndices = new Array(period).fill(0);
    const counts = new Array(period).fill(0);

    for (let i = 0; i < data.length; i++) {
        const seasonalIndex = i % period;
        seasonalIndices[seasonalIndex] += data[i] - trend[Math.min(i, trend.length - 1)];
        counts[seasonalIndex]++;
    }

    // Average the seasonal indices
    for (let i = 0; i < period; i++) {
        seasonalIndices[i] = counts[i] > 0 ? seasonalIndices[i] / counts[i] : 0;
    }

    // Calculate remainder
    const remainder = data.map((value, i) => {
        const seasonalValue = seasonalIndices[i % period];
        const trendValue = trend[Math.min(i, trend.length - 1)];
        return value - trendValue - seasonalValue;
    });

    return { seasonal: seasonalIndices, trend, remainder };
}

/**
 * Calculate statistical indicators
 * @param {Array} data - Dataset
 * @returns {Object} - mean, stdDev, min, max, quartiles
 */
function statisticalSummary(data) {
    if (data.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0, q1: 0, q3: 0 };

    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    return {
        mean,
        stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        q1: sorted[q1Index],
        q3: sorted[q3Index]
    };
}

/**
 * Detect outliers using IQR method
 * @param {Array} data - Dataset
 * @returns {Array} - Indices of outlier values
 */
function detectOutliers(data) {
    const stats = statisticalSummary(data);
    const iqr = stats.q3 - stats.q1;
    const lowerBound = stats.q1 - 1.5 * iqr;
    const upperBound = stats.q3 + 1.5 * iqr;

    const outliers = [];
    data.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
            outliers.push(index);
        }
    });

    return outliers;
}

/**
 * Holt's Double Exponential Smoothing
 * Captures both level (baseline) and trend (direction) with two smoothing parameters.
 * Works reliably with as few as 3 data points — much better than linear regression for short series.
 *
 * @param {Array<number>} data - Time series values (e.g., monthly drop-off counts)
 * @param {number} alpha - Level smoothing factor (0–1). Higher = more responsive to recent data. Default 0.3.
 * @param {number} beta  - Trend smoothing factor (0–1). Higher = faster trend adaptation. Default 0.2.
 * @returns {Object} - { smoothed, level, trend, predict(stepsAhead), confidenceInterval(stepsAhead, confidence) }
 */
function holtExponentialSmoothing(data, alpha = 0.3, beta = 0.2) {
    if (!data || data.length < 2) {
        return {
            smoothed: data || [],
            level: 0,
            trend: 0,
            predict: () => 0,
            confidenceInterval: () => ({ lower: 0, upper: 0, point: 0 }),
            residuals: []
        };
    }

    // Initialize level and trend from first two data points
    let level = data[0];
    let trend = data[1] - data[0];

    const smoothed = [data[0]];
    const residuals = [];

    for (let i = 1; i < data.length; i++) {
        const prevLevel = level;
        const prevTrend = trend;

        // Update level: weighted blend of observed vs. predicted
        level = alpha * data[i] + (1 - alpha) * (prevLevel + prevTrend);
        // Update trend: weighted blend of new trend vs. old trend
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;

        const fitted = prevLevel + prevTrend;
        smoothed.push(level + trend);
        residuals.push(data[i] - fitted);
    }

    // Calculate residual standard error for confidence intervals
    const residualMean = residuals.length > 0
        ? residuals.reduce((a, b) => a + b, 0) / residuals.length
        : 0;
    const residualVariance = residuals.length > 1
        ? residuals.reduce((sum, r) => sum + Math.pow(r - residualMean, 2), 0) / (residuals.length - 1)
        : 0;
    const residualStdErr = Math.sqrt(residualVariance);

    return {
        smoothed,
        level,
        trend,
        residuals,
        residualStdErr,

        /**
         * Predict value at stepsAhead periods into the future.
         * @param {number} stepsAhead - Number of periods ahead (1 = next period)
         * @returns {number}
         */
        predict: (stepsAhead) => {
            return Math.max(0, Math.round(level + trend * stepsAhead));
        },

        /**
         * Calculate confidence interval for a future prediction.
         * Uses residual standard error scaled by sqrt of forecast horizon.
         * @param {number} stepsAhead - Periods ahead
         * @param {number} zScore - Z-score for desired confidence (1.96 = 95%, 1.645 = 90%, 1.28 = 80%)
         * @returns {{ lower: number, point: number, upper: number }}
         */
        confidenceInterval: (stepsAhead, zScore = 1.645) => {
            const point = Math.max(0, Math.round(level + trend * stepsAhead));
            // Uncertainty grows with forecast horizon
            const margin = Math.round(zScore * residualStdErr * Math.sqrt(stepsAhead));
            return {
                lower: Math.max(0, point - margin),
                point,
                upper: point + margin
            };
        }
    };
}

module.exports = {
    linearRegression,
    pearsonCorrelation,
    movingAverage,
    seasonalDecomposition,
    statisticalSummary,
    detectOutliers,
    holtExponentialSmoothing
};