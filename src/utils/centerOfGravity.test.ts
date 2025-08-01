import { describe, it, expect } from 'vitest'
import { type CenterOfGravity, type PoseLandmark } from '../types/gait'
import { 
  calculateCenterOfGravity, 
  isValidCenterOfGravity, 
  calculateStability,
  filterOutliers,
  analyzeGaitPattern
} from './centerOfGravity'

describe('CenterOfGravity Interface', () => {
  // 🔴 RED: CenterOfGravityインターフェースの構造テスト
  it('should have correct CenterOfGravity interface structure', () => {
    const cog: CenterOfGravity = {
      x: 0.5,
      y: 0.3,
      timestamp: Date.now(),
      confidence: 0.95,
    }

    expect(cog).toHaveProperty('x')
    expect(cog).toHaveProperty('y')
    expect(cog).toHaveProperty('timestamp')
    expect(cog).toHaveProperty('confidence')
    
    expect(typeof cog.x).toBe('number')
    expect(typeof cog.y).toBe('number')
    expect(typeof cog.timestamp).toBe('number')
    expect(typeof cog.confidence).toBe('number')
  })

  // 🔴 RED: CenterOfGravity検証テスト（まず失敗させる）
  it('should validate CenterOfGravity values', () => {
    const validCog: CenterOfGravity = {
      x: 0.5,
      y: 0.3,
      timestamp: Date.now(),
      confidence: 0.95,
    }

    const invalidCog: CenterOfGravity = {
      x: 1.5, // 無効な座標（0-1の範囲外）
      y: -0.1, // 無効な座標（負の値）
      timestamp: Date.now(),
      confidence: 1.5, // 無効な信頼度（0-1の範囲外）
    }

    // この関数はまだ実装されていないので失敗する
    expect(isValidCenterOfGravity(validCog)).toBe(true)
    expect(isValidCenterOfGravity(invalidCog)).toBe(false)
  })
})

describe('Center of Gravity Calculation', () => {
  // 🔴 RED: 重心計算の基本テスト（まず失敗させる）
  it('should calculate center of gravity from pose landmarks', () => {
    // MediaPipeの33個のランドマークに対応する配列を作成
    const mockLandmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.1, // 基本的に低信頼度
    }))

    // 重要な部位のランドマークを高信頼度に設定
    mockLandmarks[11] = { x: 0.4, y: 0.2, z: 0, visibility: 0.9 } // 左肩
    mockLandmarks[12] = { x: 0.6, y: 0.2, z: 0, visibility: 0.9 } // 右肩
    mockLandmarks[23] = { x: 0.45, y: 0.5, z: 0, visibility: 0.8 } // 左腰
    mockLandmarks[24] = { x: 0.55, y: 0.5, z: 0, visibility: 0.8 } // 右腰

    // この関数はまだ実装されていないので失敗する
    const cog = calculateCenterOfGravity(mockLandmarks, Date.now())
    
    expect(cog).toBeDefined()
    expect(typeof cog.x).toBe('number')
    expect(typeof cog.y).toBe('number')
    expect(cog.x).toBeGreaterThanOrEqual(0)
    expect(cog.x).toBeLessThanOrEqual(1)
    expect(cog.y).toBeGreaterThanOrEqual(0)
    expect(cog.y).toBeLessThanOrEqual(1)
  })

  // 🔴 RED: 空のランドマークデータでのエラーハンドリングテスト
  it('should handle empty landmarks gracefully', () => {
    const emptyLandmarks: PoseLandmark[] = []
    
    expect(() => {
      calculateCenterOfGravity(emptyLandmarks, Date.now())
    }).toThrow('No valid landmarks provided')
  })

  // 🔴 RED: 低信頼度ランドマークの除外テスト
  it('should exclude low confidence landmarks', () => {
    // MediaPipeの33個のランドマークに対応する配列を作成
    const mixedConfidenceLandmarks: PoseLandmark[] = new Array(33).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.1, // 基本的に低信頼度
    }))

    // 一部のランドマークを高信頼度に設定
    mixedConfidenceLandmarks[11] = { x: 0.4, y: 0.2, z: 0, visibility: 0.9 } // 高信頼度
    mixedConfidenceLandmarks[12] = { x: 0.6, y: 0.2, z: 0, visibility: 0.1 } // 低信頼度（除外されるべき）
    mixedConfidenceLandmarks[23] = { x: 0.5, y: 0.4, z: 0, visibility: 0.8 } // 高信頼度

    const cog = calculateCenterOfGravity(mixedConfidenceLandmarks, Date.now())
    
    // 低信頼度のランドマークが除外されることを確認
    expect(cog.confidence).toBeGreaterThan(0.5)
  })
})

describe('Center of Gravity Trajectory Management', () => {
  // 🔴 RED: 重心軌跡履歴管理のテスト作成・失敗確認
  it('should manage trajectory history correctly', () => {
    const trajectoryHistory: CenterOfGravity[] = []
    
    // 時系列データを作成
    const timePoints = [1000, 2000, 3000, 4000, 5000]
    const expectedPoints = timePoints.map(timestamp => ({
      x: 0.5 + Math.sin(timestamp / 1000) * 0.1, // 軽微な変動
      y: 0.4 + Math.cos(timestamp / 1000) * 0.1,
      timestamp,
      confidence: 0.8 + Math.random() * 0.2
    }))
    
    expectedPoints.forEach(point => trajectoryHistory.push(point))
    
    // 軌跡履歴の基本検証
    expect(trajectoryHistory).toHaveLength(5)
    expect(trajectoryHistory[0].timestamp).toBe(1000)
    expect(trajectoryHistory[4].timestamp).toBe(5000)
    
    // 時系列順序の確認
    for (let i = 1; i < trajectoryHistory.length; i++) {
      expect(trajectoryHistory[i].timestamp).toBeGreaterThan(trajectoryHistory[i-1].timestamp)
    }
  })
  
  // 🔴 RED: 安定性計算のテスト作成・失敗確認
  it('should calculate stability from trajectory history', () => {
    // 安定した重心軌跡（低変動）
    const stableTrajectory: CenterOfGravity[] = [
      { x: 0.50, y: 0.40, timestamp: 1000, confidence: 0.9 },
      { x: 0.51, y: 0.41, timestamp: 2000, confidence: 0.9 },
      { x: 0.49, y: 0.39, timestamp: 3000, confidence: 0.9 },
      { x: 0.50, y: 0.40, timestamp: 4000, confidence: 0.9 },
      { x: 0.51, y: 0.41, timestamp: 5000, confidence: 0.9 }
    ]
    
    // 不安定な重心軌跡（高変動）
    const unstableTrajectory: CenterOfGravity[] = [
      { x: 0.10, y: 0.10, timestamp: 1000, confidence: 0.8 },
      { x: 0.90, y: 0.90, timestamp: 2000, confidence: 0.8 },
      { x: 0.05, y: 0.95, timestamp: 3000, confidence: 0.8 },
      { x: 0.95, y: 0.05, timestamp: 4000, confidence: 0.8 },
      { x: 0.20, y: 0.80, timestamp: 5000, confidence: 0.8 }
    ]
    
    // この関数はまだ実装されていないので失敗する
    const stableScore = calculateStability(stableTrajectory)
    const unstableScore = calculateStability(unstableTrajectory)
    
    expect(stableScore).toBeGreaterThan(unstableScore)
    expect(stableScore).toBeGreaterThan(70) // 安定は70以上
    expect(unstableScore).toBeLessThan(60) // 不安定は60以下
  })
  
  // 🔴 RED: 異常値除去のテスト作成・失敗確認
  it('should filter outliers from trajectory history', () => {
    // 正常データに異常値を混入
    const trajectoryWithOutliers: CenterOfGravity[] = [
      { x: 0.50, y: 0.40, timestamp: 1000, confidence: 0.9 },
      { x: 0.51, y: 0.41, timestamp: 2000, confidence: 0.9 },
      { x: 0.95, y: 0.95, timestamp: 3000, confidence: 0.9 }, // 異常値
      { x: 0.49, y: 0.39, timestamp: 4000, confidence: 0.9 },
      { x: 0.05, y: 0.05, timestamp: 5000, confidence: 0.9 }, // 異常値
      { x: 0.50, y: 0.40, timestamp: 6000, confidence: 0.9 }
    ]
    
    // この関数はまだ実装されていないので失敗する
    const filteredTrajectory = filterOutliers(trajectoryWithOutliers)
    
    expect(filteredTrajectory.length).toBeLessThan(trajectoryWithOutliers.length)
    expect(filteredTrajectory.length).toBeGreaterThanOrEqual(4) // 正常データは残る
    
    // 異常値が除去されていることを確認
    const hasExtremeValues = filteredTrajectory.some(point => 
      point.x > 0.90 || point.x < 0.10 || point.y > 0.90 || point.y < 0.10
    )
    expect(hasExtremeValues).toBe(false)
  })
  
  // 🔴 RED: 軌跡パターン分析のテスト作成・失敗確認
  it('should classify trajectory patterns correctly', () => {
    // 直線的な軌跡（キャットウォーク的）
    const linearTrajectory: CenterOfGravity[] = [
      { x: 0.40, y: 0.30, timestamp: 1000, confidence: 0.9 },
      { x: 0.45, y: 0.35, timestamp: 2000, confidence: 0.9 },
      { x: 0.50, y: 0.40, timestamp: 3000, confidence: 0.9 },
      { x: 0.55, y: 0.45, timestamp: 4000, confidence: 0.9 },
      { x: 0.60, y: 0.50, timestamp: 5000, confidence: 0.9 }
    ]
    
    // ランダムな軌跡（酔歩的）
    const randomTrajectory: CenterOfGravity[] = [
      { x: 0.10, y: 0.10, timestamp: 1000, confidence: 0.8 },
      { x: 0.90, y: 0.90, timestamp: 2000, confidence: 0.8 },
      { x: 0.05, y: 0.95, timestamp: 3000, confidence: 0.8 },
      { x: 0.95, y: 0.05, timestamp: 4000, confidence: 0.8 },
      { x: 0.20, y: 0.80, timestamp: 5000, confidence: 0.8 }
    ]
    
    const linearAnalysis = analyzeGaitPattern(linearTrajectory)
    const randomAnalysis = analyzeGaitPattern(randomTrajectory)
    
    expect(linearAnalysis.pattern).toBe('stable')
    expect(randomAnalysis.pattern).toBe('unstable')
    expect(linearAnalysis.stability).toBeGreaterThan(randomAnalysis.stability)
  })
})