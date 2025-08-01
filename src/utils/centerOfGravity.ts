import { type CenterOfGravity, type PoseLandmark, type GaitAnalysis } from '../types/gait'

// MediaPipeの重要な体の部位のインデックス
const BODY_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

// 重心計算に使用する部位の重み（解剖学的な体重分布を考慮）
const LANDMARK_WEIGHTS = {
  SHOULDER: 0.15, // 肩の重み（上半身の一部）
  HIP: 0.45, // 腰の重み（体の中心、最も重要）
  KNEE: 0.25, // 膝の重み（下半身の重要な支点）
  ANKLE: 0.15, // 足首の重み（接地点）
}

// 計算の設定値
const CONFIG = {
  CONFIDENCE_THRESHOLD: 0.5, // 信頼度の閾値
  MIN_VALID_LANDMARKS: 2, // 最小限必要なランドマーク数
  STABILITY_SCALE_FACTOR: 100, // 安定性計算のスケール係数（調整済み）
}

/**
 * CenterOfGravityの値が有効かどうかを検証する
 */
export function isValidCenterOfGravity(cog: CenterOfGravity): boolean {
  // 座標は0-1の範囲内である必要がある
  if (cog.x < 0 || cog.x > 1 || cog.y < 0 || cog.y > 1) {
    return false
  }

  // 信頼度は0-1の範囲内である必要がある
  if (cog.confidence < 0 || cog.confidence > 1) {
    return false
  }

  // タイムスタンプは正の値である必要がある
  if (cog.timestamp <= 0) {
    return false
  }

  return true
}

/**
 * 姿勢ランドマークから重心位置を計算する
 */
export function calculateCenterOfGravity(
  landmarks: PoseLandmark[],
  timestamp: number
): CenterOfGravity {
  if (!landmarks || landmarks.length === 0) {
    throw new Error('No valid landmarks provided')
  }

  // 重要な体の部位のランドマークを取得
  const bodyLandmarks = [
    { landmark: landmarks[BODY_LANDMARKS.LEFT_SHOULDER], weight: LANDMARK_WEIGHTS.SHOULDER },
    { landmark: landmarks[BODY_LANDMARKS.RIGHT_SHOULDER], weight: LANDMARK_WEIGHTS.SHOULDER },
    { landmark: landmarks[BODY_LANDMARKS.LEFT_HIP], weight: LANDMARK_WEIGHTS.HIP },
    { landmark: landmarks[BODY_LANDMARKS.RIGHT_HIP], weight: LANDMARK_WEIGHTS.HIP },
    { landmark: landmarks[BODY_LANDMARKS.LEFT_KNEE], weight: LANDMARK_WEIGHTS.KNEE },
    { landmark: landmarks[BODY_LANDMARKS.RIGHT_KNEE], weight: LANDMARK_WEIGHTS.KNEE },
    { landmark: landmarks[BODY_LANDMARKS.LEFT_ANKLE], weight: LANDMARK_WEIGHTS.ANKLE },
    { landmark: landmarks[BODY_LANDMARKS.RIGHT_ANKLE], weight: LANDMARK_WEIGHTS.ANKLE },
  ]

  // 有効なランドマーク（信頼度が閾値以上）をフィルタリング
  const validLandmarks = bodyLandmarks.filter(
    item =>
      item.landmark &&
      item.landmark.visibility !== undefined &&
      item.landmark.visibility > CONFIG.CONFIDENCE_THRESHOLD
  )

  if (validLandmarks.length < CONFIG.MIN_VALID_LANDMARKS) {
    throw new Error('No valid landmarks with sufficient confidence')
  }

  // 信頼度による重み調整を追加（高信頼度のランドマークをより重視）
  let weightedX = 0
  let weightedY = 0
  let totalWeight = 0
  let totalConfidence = 0

  validLandmarks.forEach(({ landmark, weight }) => {
    // 信頼度による重み調整（信頼度が高いほど重みを増加）
    const confidenceBoost = landmark.visibility || 0
    const adjustedWeight = weight * (1 + confidenceBoost)

    weightedX += landmark.x * adjustedWeight
    weightedY += landmark.y * adjustedWeight
    totalWeight += adjustedWeight
    totalConfidence += confidenceBoost
  })

  // 重心座標を正規化
  const centerX = Math.max(0, Math.min(1, weightedX / totalWeight))
  const centerY = Math.max(0, Math.min(1, weightedY / totalWeight))

  // 平均信頼度を計算（最小値を0.5に設定）
  const averageConfidence = Math.max(0.5, totalConfidence / validLandmarks.length)

  return {
    x: centerX,
    y: centerY,
    timestamp,
    confidence: Math.min(1, averageConfidence),
  }
}

/**
 * 重心の安定性を計算する（標準偏差ベース）
 */
export function calculateStability(cogHistory: CenterOfGravity[]): number {
  if (cogHistory.length < 2) {
    return 0
  }

  // 信頼度の低いデータポイントを除外
  const validCogHistory = cogHistory.filter(cog => cog.confidence > 0.6)

  if (validCogHistory.length < 2) {
    return 0
  }

  // X,Y座標の変動を計算
  const xValues = validCogHistory.map(cog => cog.x)
  const yValues = validCogHistory.map(cog => cog.y)

  const xMean = xValues.reduce((sum, x) => sum + x, 0) / xValues.length
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length

  const xVariance =
    xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xValues.length
  const yVariance =
    yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yValues.length

  const xStdDev = Math.sqrt(xVariance)
  const yStdDev = Math.sqrt(yVariance)

  // 総合的な安定性スコア（0-100）
  // 標準偏差が小さいほど安定性が高い
  const totalStdDev = Math.sqrt(xStdDev * xStdDev + yStdDev * yStdDev)
  const stabilityScore = Math.max(0, 100 - totalStdDev * CONFIG.STABILITY_SCALE_FACTOR)

  return Math.min(100, stabilityScore)
}

/**
 * 重心データの異常値を検出・除去する
 */
export function filterOutliers(cogHistory: CenterOfGravity[]): CenterOfGravity[] {
  if (cogHistory.length < 3) {
    return cogHistory
  }

  const xValues = cogHistory.map(cog => cog.x)
  const yValues = cogHistory.map(cog => cog.y)

  // Q1, Q3を計算して外れ値を検出
  const sortedX = [...xValues].sort((a, b) => a - b)
  const sortedY = [...yValues].sort((a, b) => a - b)

  const q1X = sortedX[Math.floor(sortedX.length * 0.25)]
  const q3X = sortedX[Math.floor(sortedX.length * 0.75)]
  const iqrX = q3X - q1X

  const q1Y = sortedY[Math.floor(sortedY.length * 0.25)]
  const q3Y = sortedY[Math.floor(sortedY.length * 0.75)]
  const iqrY = q3Y - q1Y

  // 外れ値の閾値
  const outlierFactor = 1.5

  return cogHistory.filter(cog => {
    const isXOutlier = cog.x < q1X - iqrX * outlierFactor || cog.x > q3X + iqrX * outlierFactor
    const isYOutlier = cog.y < q1Y - iqrY * outlierFactor || cog.y > q3Y + iqrY * outlierFactor

    return !isXOutlier && !isYOutlier
  })
}

/**
 * 重心軌跡から歩行パターンを分析する
 */
export function analyzeGaitPattern(cogHistory: CenterOfGravity[]): GaitAnalysis {
  if (cogHistory.length < 2) {
    return {
      cogHistory,
      stability: 0,
      pattern: 'unknown'
    }
  }

  // 異常値を除去
  const filteredHistory = filterOutliers(cogHistory)

  // 安定性スコアを計算
  const stability = calculateStability(filteredHistory)

  // パターンを判定
  let pattern: 'stable' | 'unstable' | 'unknown'
  if (stability >= 70) {
    pattern = 'stable'
  } else if (stability <= 60) {
    pattern = 'unstable'
  } else {
    pattern = 'unknown'
  }

  return {
    cogHistory: filteredHistory,
    stability,
    pattern
  }
}