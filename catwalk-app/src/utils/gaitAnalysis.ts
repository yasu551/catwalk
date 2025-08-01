import { type CenterOfGravity, type GaitClassification } from '../types/gait'

// 時系列データの一貫性分析結果
export interface TemporalConsistency {
  averageInterval: number
  intervalVariation: number
  isConsistent: boolean
}

// 包括的な歩行分析結果
export interface ComprehensiveGaitAnalysis {
  classification: GaitClassification
  advancedMetrics: AdvancedGaitMetrics
  temporalAnalysis: TemporalConsistency
  confidenceFactors: {
    dataQuality: number
    temporalConsistency: number
    sampleSize: number
  }
}

// 高度な歩行メトリクス
export interface AdvancedGaitMetrics {
  standardDeviation: number
  coefficientOfVariation: number
  linearityIndex: number
  velocityVariation: number
}

/**
 * 高度な歩行メトリクスを計算する（最適化版）
 */
export function calculateAdvancedGaitMetrics(cogHistory: CenterOfGravity[]): AdvancedGaitMetrics {
  if (cogHistory.length < 3) {
    return {
      standardDeviation: 0,
      coefficientOfVariation: 0,
      linearityIndex: 0,
      velocityVariation: 0
    }
  }

  // 信頼度でフィルタリング（パフォーマンス向上）
  const filteredHistory = cogHistory.filter(cog => cog.confidence > 0.6)
  if (filteredHistory.length < 3) {
    return calculateAdvancedGaitMetrics(cogHistory) // fallback to original
  }

  // 座標の分離（一度のループで効率的に計算）
  let xSum = 0, ySum = 0
  const xValues: number[] = []
  const yValues: number[] = []
  
  for (const cog of filteredHistory) {
    xValues.push(cog.x)
    yValues.push(cog.y)
    xSum += cog.x
    ySum += cog.y
  }

  const n = filteredHistory.length
  const xMean = xSum / n
  const yMean = ySum / n

  // 1. 標準偏差の計算（一度のループで効率化）
  let xVarianceSum = 0, yVarianceSum = 0
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean
    const yDiff = yValues[i] - yMean
    xVarianceSum += xDiff * xDiff
    yVarianceSum += yDiff * yDiff
  }
  
  const standardDeviation = Math.sqrt((xVarianceSum + yVarianceSum) / n)

  // 2. 変動係数の計算（数値安定性向上）
  const overallMean = Math.sqrt(xMean * xMean + yMean * yMean)
  const coefficientOfVariation = overallMean > 1e-10 ? standardDeviation / overallMean : 0

  // 3. 直線性指標の計算（キャッシュ効率向上）
  const linearityIndex = calculateLinearityIndexOptimized(xValues, yValues, xMean, yMean, n)

  // 4. 速度変動の計算（最適化版）
  const velocityVariation = calculateVelocityVariationOptimized(filteredHistory)

  return {
    standardDeviation: Math.round(standardDeviation * 1000) / 1000,
    coefficientOfVariation: Math.round(coefficientOfVariation * 1000) / 1000,
    linearityIndex: Math.round(linearityIndex * 1000) / 1000,
    velocityVariation: Math.round(velocityVariation * 1000) / 1000
  }
}

/**
 * 直線性指標を計算する（最適化版）
 */
function calculateLinearityIndexOptimized(
  xValues: number[], 
  yValues: number[], 
  xMean: number, 
  yMean: number, 
  n: number
): number {
  if (n < 3) return 0

  // 最小二乗法の計算を最適化
  let sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean
    sumXY += xDiff * (yValues[i] - yMean)
    sumXX += xDiff * xDiff
  }
  
  if (sumXX < 1e-10) return 0 // 数値安定性
  
  const slope = sumXY / sumXX
  const intercept = yMean - slope * xMean
  
  // 残差平方和と総平方和を同時計算
  let residualSumSquares = 0, totalSumSquares = 0
  for (let i = 0; i < n; i++) {
    const predictedY = slope * xValues[i] + intercept
    const residual = yValues[i] - predictedY
    const totalDiff = yValues[i] - yMean
    
    residualSumSquares += residual * residual
    totalSumSquares += totalDiff * totalDiff
  }
  
  // R²の計算
  const rSquared = totalSumSquares > 1e-10 ? 1 - (residualSumSquares / totalSumSquares) : 0
  return Math.max(0, Math.min(1, rSquared))
}


/**
 * 速度変動を計算する（最適化版）
 */
function calculateVelocityVariationOptimized(cogHistory: CenterOfGravity[]): number {
  if (cogHistory.length < 3) return 0

  // 速度の計算と統計を一度のループで計算
  const velocities: number[] = []
  let velocitySum = 0
  
  for (let i = 1; i < cogHistory.length; i++) {
    const prev = cogHistory[i - 1]
    const curr = cogHistory[i]
    
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const dt = (curr.timestamp - prev.timestamp) / 1000
    
    if (dt > 0) {
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt
      velocities.push(velocity)
      velocitySum += velocity
    }
  }
  
  if (velocities.length < 2) return 0
  
  const velocityMean = velocitySum / velocities.length
  
  // 分散を一度のループで計算
  let varianceSum = 0
  for (const velocity of velocities) {
    const diff = velocity - velocityMean
    varianceSum += diff * diff
  }
  
  const velocityStdDev = Math.sqrt(varianceSum / velocities.length)
  return velocityMean > 1e-10 ? velocityStdDev / velocityMean : 0
}


/**
 * 歩行パターンを分類する（キャットウォーク vs 酔歩）- 改良版
 */
export function classifyGaitPattern(cogHistory: CenterOfGravity[]): GaitClassification {
  if (cogHistory.length < 5) {
    return {
      pattern: 'unknown',
      confidence: 0,
      metrics: {
        stabilityScore: 0,
        regularityScore: 0,
        linearityScore: 0
      }
    }
  }

  // 高度なメトリクスと時系列分析を統合
  const metrics = calculateAdvancedGaitMetrics(cogHistory)
  const temporalAnalysis = analyzeTemporalConsistency(cogHistory)
  const dataQuality = calculateDataQuality(cogHistory)
  
  // 各指標をスコア化（0-100）- 適応的スケーリング
  const stabilityScore = calculateAdaptiveStabilityScore(metrics.standardDeviation, cogHistory.length)
  const regularityScore = calculateAdaptiveRegularityScore(metrics.velocityVariation, temporalAnalysis)
  const linearityScore = metrics.linearityIndex * 100
  
  // 品質要因による重み調整
  const qualityWeight = Math.max(0.5, dataQuality)
  const temporalWeight = temporalAnalysis.isConsistent ? 1.0 : 0.7
  
  // 総合スコアの計算（動的重み付き平均）- 直線性を重視
  const baseScore = (stabilityScore * 0.3 + regularityScore * 0.2 + linearityScore * 0.5)
  const adjustedScore = baseScore * qualityWeight * temporalWeight
  
  // 改良された判定アルゴリズム
  const { pattern, baseConfidence } = classifyPatternWithAdaptiveThresholds(
    adjustedScore, 
    cogHistory.length, 
    dataQuality
  )
  
  // 信頼度の最終調整
  const finalConfidence = calculateFinalConfidence(
    baseConfidence, 
    dataQuality, 
    temporalAnalysis.isConsistent,
    cogHistory.length
  )
  
  return {
    pattern,
    confidence: Math.round(finalConfidence * 1000) / 1000,
    metrics: {
      stabilityScore: Math.round(stabilityScore * 10) / 10,
      regularityScore: Math.round(regularityScore * 10) / 10,
      linearityScore: Math.round(linearityScore * 10) / 10
    }
  }
}

/**
 * 適応的安定性スコア計算
 */
function calculateAdaptiveStabilityScore(standardDeviation: number, sampleSize: number): number {
  // サンプルサイズに基づいて閾値を調整（より保守的に）
  const baseThreshold = sampleSize > 10 ? 150 : 100
  const adjustedThreshold = baseThreshold * Math.max(0.8, Math.min(1.2, sampleSize / 10))
  
  return Math.max(0, Math.min(100, 100 - standardDeviation * adjustedThreshold))
}

/**
 * 適応的規則性スコア計算
 */
function calculateAdaptiveRegularityScore(velocityVariation: number, temporalAnalysis: TemporalConsistency): number {
  // 時系列の一貫性を考慮した規則性評価
  const baseScore = Math.max(0, 100 - velocityVariation * 100)
  const temporalBonus = temporalAnalysis.isConsistent ? 1.1 : 0.9
  
  return Math.min(100, baseScore * temporalBonus)
}

/**
 * 適応的閾値による分類（最適化版）
 */
function classifyPatternWithAdaptiveThresholds(
  score: number, 
  sampleSize: number, 
  dataQuality: number
): { pattern: 'catwalk' | 'drunk' | 'unknown', baseConfidence: number } {
  // サンプルサイズとデータ品質に基づいて閾値を調整（最適化版）
  const qualityFactor = Math.max(0.75, Math.min(1.0, dataQuality)) // 範囲を狭めて安定化
  const sizeFactor = Math.min(1.0, sampleSize / 8) // より少ないサンプルで最大効果
  
  // チューニングされた閾値（より厳しい基準）
  const catwalkThreshold = 78 * qualityFactor * sizeFactor // 75→78に引き上げ
  const drunkThreshold = 32 * qualityFactor * sizeFactor   // 35→32に引き下げ
  
  if (score >= catwalkThreshold) {
    return {
      pattern: 'catwalk',
      baseConfidence: Math.min(0.92, score / 100) // 0.95→0.92に調整
    }
  } else if (score <= drunkThreshold) {
    return {
      pattern: 'drunk', 
      baseConfidence: Math.min(0.92, (100 - score) / 100)
    }
  } else {
    return {
      pattern: 'unknown',
      baseConfidence: Math.min(0.7, Math.abs(score - 50) / 50 * 0.6) // より保守的な信頼度
    }
  }
}

/**
 * 最終信頼度の計算
 */
function calculateFinalConfidence(
  baseConfidence: number,
  dataQuality: number,
  isTemporallyConsistent: boolean,
  sampleSize: number
): number {
  // 各要因による信頼度調整
  const qualityBonus = dataQuality > 0.8 ? 1.1 : dataQuality < 0.6 ? 0.8 : 1.0
  const temporalBonus = isTemporallyConsistent ? 1.05 : 0.9
  const sizeBonus = sampleSize >= 10 ? 1.0 : sampleSize >= 5 ? 0.9 : 0.7
  
  const adjustedConfidence = baseConfidence * qualityBonus * temporalBonus * sizeBonus
  
  return Math.max(0, Math.min(0.98, adjustedConfidence))
}

/**
 * 時系列データの時間間隔の一貫性を分析する
 */
export function analyzeTemporalConsistency(cogHistory: CenterOfGravity[]): TemporalConsistency {
  if (cogHistory.length < 2) {
    return {
      averageInterval: 0,
      intervalVariation: 0,
      isConsistent: false
    }
  }

  // 時間間隔を計算
  const intervals: number[] = []
  for (let i = 1; i < cogHistory.length; i++) {
    const interval = cogHistory[i].timestamp - cogHistory[i - 1].timestamp
    intervals.push(interval)
  }

  // 平均間隔と変動を計算
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  
  const varianceSum = intervals.reduce((sum, interval) => {
    const diff = interval - averageInterval
    return sum + diff * diff
  }, 0)
  
  const intervalVariance = varianceSum / intervals.length
  const intervalVariation = Math.sqrt(intervalVariance) / averageInterval

  // 一貫性の判定（変動係数が0.5以下で一貫性ありとする）
  const isConsistent = intervalVariation <= 0.5 && averageInterval > 0

  return {
    averageInterval: Math.round(averageInterval),
    intervalVariation: Math.round(intervalVariation * 1000) / 1000,
    isConsistent
  }
}

/**
 * 包括的な歩行パターン分析を実行する
 */
export function performComprehensiveGaitAnalysis(cogHistory: CenterOfGravity[]): ComprehensiveGaitAnalysis {
  // 基本的な分類とメトリクス
  const classification = classifyGaitPattern(cogHistory)
  const advancedMetrics = calculateAdvancedGaitMetrics(cogHistory)
  const temporalAnalysis = analyzeTemporalConsistency(cogHistory)

  // 信頼度要因の計算
  const dataQuality = calculateDataQuality(cogHistory)
  const temporalConsistency = temporalAnalysis.isConsistent ? 1.0 : 0.5
  const sampleSize = Math.min(1.0, cogHistory.length / 10) // 10個以上で最大スコア

  return {
    classification,
    advancedMetrics,
    temporalAnalysis,
    confidenceFactors: {
      dataQuality: Math.round(dataQuality * 1000) / 1000,
      temporalConsistency: Math.round(temporalConsistency * 1000) / 1000,
      sampleSize: Math.round(sampleSize * 1000) / 1000
    }
  }
}

/**
 * データ品質を評価する（0-1）
 */
function calculateDataQuality(cogHistory: CenterOfGravity[]): number {
  if (cogHistory.length === 0) return 0

  // 平均信頼度を計算
  const averageConfidence = cogHistory.reduce((sum, cog) => sum + cog.confidence, 0) / cogHistory.length
  
  // 高信頼度データの割合を計算
  const highConfidenceCount = cogHistory.filter(cog => cog.confidence > 0.8).length
  const highConfidenceRatio = highConfidenceCount / cogHistory.length

  // データ品質スコア（平均信頼度と高信頼度割合の加重平均）
  return averageConfidence * 0.6 + highConfidenceRatio * 0.4
}