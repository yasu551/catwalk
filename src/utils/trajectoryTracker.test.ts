import { describe, it, expect, beforeEach } from 'vitest'
import { type CenterOfGravity } from '../types/gait'
import { TrajectoryTracker } from './trajectoryTracker'

describe('TrajectoryTracker', () => {
  let tracker: TrajectoryTracker

  beforeEach(() => {
    tracker = new TrajectoryTracker()
  })

  // 🟢 GREEN: 軌跡データ追加・保存のテスト
  it('should add and store trajectory data correctly', () => {
    const cog1: CenterOfGravity = {
      x: 0.5,
      y: 0.4,
      timestamp: 1000,
      confidence: 0.9
    }

    const cog2: CenterOfGravity = {
      x: 0.51,
      y: 0.41,
      timestamp: 1200,
      confidence: 0.8
    }

    tracker.addCenterOfGravity(cog1)
    tracker.addCenterOfGravity(cog2)

    const history = tracker.getTrajectoryHistory()
    expect(history).toHaveLength(2)
    expect(history[0]).toEqual(cog1)
    expect(history[1]).toEqual(cog2)
  })

  // 🟢 GREEN: 更新間隔制御のテスト
  it('should respect update interval', () => {
    const baseCog: CenterOfGravity = {
      x: 0.5,
      y: 0.4,
      timestamp: 1000,
      confidence: 0.9
    }

    // 短い間隔で追加（除外されるべき）
    tracker.addCenterOfGravity(baseCog)
    tracker.addCenterOfGravity({ ...baseCog, timestamp: 1050 }) // 50ms後（100ms未満）

    const history = tracker.getTrajectoryHistory()
    expect(history).toHaveLength(1) // 最初の1つだけ

    // 十分な間隔で追加（追加されるべき）
    tracker.addCenterOfGravity({ ...baseCog, timestamp: 1150 }) // 150ms後

    const updatedHistory = tracker.getTrajectoryHistory()
    expect(updatedHistory).toHaveLength(2)
  })

  // 🟢 GREEN: 履歴サイズ制限のテスト
  it('should limit history size', () => {
    // 61個のデータを追加（制限は50 + バッチクリーンアップ10で60を超えると削除）
    for (let i = 0; i < 61; i++) {
      const cog: CenterOfGravity = {
        x: 0.5,
        y: 0.4,
        timestamp: 1000 + i * 200, // 200ms間隔
        confidence: 0.9
      }
      tracker.addCenterOfGravity(cog)
    }

    const history = tracker.getTrajectoryHistory()
    expect(history.length).toBeLessThanOrEqual(60) // バッチクリーンアップ後は最大60個以下
    expect(history.length).toBeGreaterThan(40) // 40個以上は残る
  })

  // 🟢 GREEN: 履歴クリアのテスト
  it('should clear history correctly', () => {
    const cog: CenterOfGravity = {
      x: 0.5,
      y: 0.4,
      timestamp: 1000,
      confidence: 0.9
    }

    tracker.addCenterOfGravity(cog)
    expect(tracker.getTrajectoryHistory()).toHaveLength(1)

    tracker.clearHistory()
    expect(tracker.getTrajectoryHistory()).toHaveLength(0)
  })

  // 🟢 GREEN: 歩行パターン分析のテスト
  it('should analyze gait patterns', () => {
    // 不十分なデータ点数の場合
    const cog: CenterOfGravity = {
      x: 0.5,
      y: 0.4,
      timestamp: 1000,
      confidence: 0.9
    }
    tracker.addCenterOfGravity(cog)

    const analysis1 = tracker.analyzeCurrentGait()
    expect(analysis1).toBeNull() // データ不足

    // 十分なデータ点数を追加
    for (let i = 1; i < 15; i++) {
      const cogData: CenterOfGravity = {
        x: 0.5 + (i * 0.01), // 線形変化
        y: 0.4 + (i * 0.01),
        timestamp: 1000 + i * 200,
        confidence: 0.9
      }
      tracker.addCenterOfGravity(cogData)
    }

    const analysis2 = tracker.analyzeCurrentGait()
    expect(analysis2).not.toBeNull()
    expect(analysis2?.pattern).toBe('stable') // 線形軌跡は安定
  })

  // 🟢 GREEN: 可視化データ生成のテスト
  it('should generate visualization data', () => {
    // 空の状態
    const emptyViz = tracker.getVisualizationData()
    expect(emptyViz.points).toHaveLength(0)
    expect(emptyViz.path).toBe('')

    // データを追加
    const testData = [
      { x: 0.3, y: 0.2, timestamp: 1000, confidence: 0.9 },
      { x: 0.4, y: 0.3, timestamp: 1200, confidence: 0.9 },
      { x: 0.5, y: 0.4, timestamp: 1400, confidence: 0.9 }
    ]

    testData.forEach(cog => tracker.addCenterOfGravity(cog))

    const viz = tracker.getVisualizationData()
    expect(viz.points).toHaveLength(3)
    expect(viz.path).toContain('M 0.300 0.200') // SVGパスの開始（最適化後の形式）
    expect(viz.path).toContain('L 0.400 0.300') // 線の描画（最適化後の形式）
    expect(viz.bounds.minX).toBeLessThanOrEqual(0.3)
    expect(viz.bounds.maxX).toBeGreaterThanOrEqual(0.5)
  })

  // 🟢 GREEN: 統計情報取得のテスト
  it('should calculate statistics correctly', () => {
    // 空の状態
    const emptyStats = tracker.getStatistics()
    expect(emptyStats.totalPoints).toBe(0)
    expect(emptyStats.dataQuality).toBe('low')

    // 高品質データを追加
    for (let i = 0; i < 25; i++) {
      const cog: CenterOfGravity = {
        x: 0.5,
        y: 0.4,
        timestamp: 1000 + i * 200,
        confidence: 0.85 // 高信頼度
      }
      tracker.addCenterOfGravity(cog)
    }

    const stats = tracker.getStatistics()
    expect(stats.totalPoints).toBe(25)
    expect(stats.timeSpan).toBe(24 * 200) // 24 intervals * 200ms
    expect(stats.averageConfidence).toBeCloseTo(0.85)
    expect(stats.dataQuality).toBe('high')
  })
})