import { type CenterOfGravity, type GaitAnalysis } from '../types/gait'
import { analyzeGaitPattern, filterOutliers } from './centerOfGravity'

// 軌跡追跡の設定（最適化版）
const CONFIG = {
  MAX_HISTORY_SIZE: 40, // 50→40に削減（メモリ効率化）
  MIN_ANALYSIS_POINTS: 6, // 8→6に削減（より早い判定開始）
  UPDATE_INTERVAL: 120, // 150→120に短縮（応答性向上）
  BATCH_CLEANUP_SIZE: 8, // 10→8に削減（効率化）
}

/**
 * 重心軌跡を追跡・管理するクラス
 */
export class TrajectoryTracker {
  private cogHistory: CenterOfGravity[] = []
  private lastUpdateTime: number = 0

  /**
   * 新しい重心データを追加
   */
  addCenterOfGravity(cog: CenterOfGravity): void {
    // 更新間隔チェック
    if (cog.timestamp - this.lastUpdateTime < CONFIG.UPDATE_INTERVAL) {
      return
    }

    this.cogHistory.push(cog)
    this.lastUpdateTime = cog.timestamp

    // キャッシュを無効化
    this.cachedVisualizationData = null

    // バッチでの履歴サイズ制限（パフォーマンス向上）
    if (this.cogHistory.length > CONFIG.MAX_HISTORY_SIZE + CONFIG.BATCH_CLEANUP_SIZE) {
      this.cogHistory.splice(0, CONFIG.BATCH_CLEANUP_SIZE)
    }
  }

  /**
   * 現在の軌跡履歴を取得
   */
  getTrajectoryHistory(): CenterOfGravity[] {
    return [...this.cogHistory]
  }

  /**
   * 最新のN個の重心データを取得
   */
  getRecentCenterOfGravity(count: number): CenterOfGravity[] {
    const startIndex = Math.max(0, this.cogHistory.length - count)
    return this.cogHistory.slice(startIndex)
  }

  /**
   * 軌跡履歴をクリア
   */
  clearHistory(): void {
    this.cogHistory = []
    this.lastUpdateTime = 0
    this.cachedVisualizationData = null
  }

  /**
   * 現在の歩行パターンを分析
   */
  analyzeCurrentGait(): GaitAnalysis | null {
    if (this.cogHistory.length < CONFIG.MIN_ANALYSIS_POINTS) {
      return null
    }

    return analyzeGaitPattern(this.cogHistory)
  }

  // キャッシュ用の変数
  private cachedVisualizationData: {
    points: { x: number; y: number; timestamp: number }[]
    path: string
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  } | null = null
  private lastVisualizationUpdate = 0

  /**
   * 軌跡の可視化用データを生成（キャッシュ機能付き）
   */
  getVisualizationData(): {
    points: { x: number; y: number; timestamp: number }[]
    path: string
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  } {
    if (this.cogHistory.length === 0) {
      return {
        points: [],
        path: '',
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
      }
    }

    // キャッシュが有効かチェック（パフォーマンス向上）
    const currentTime = Date.now()
    if (this.cachedVisualizationData && 
        currentTime - this.lastVisualizationUpdate < 200) { // 200ms キャッシュ
      return this.cachedVisualizationData
    }

    // 異常値を除去した履歴を使用
    const filteredHistory = filterOutliers(this.cogHistory)
    
    // データポイント数を制限（描画パフォーマンス向上）
    const maxVisualizationPoints = 30
    const step = Math.max(1, Math.floor(filteredHistory.length / maxVisualizationPoints))
    const sampledHistory = filteredHistory.filter((_, index) => index % step === 0)
    
    const points = sampledHistory.map(cog => ({
      x: cog.x,
      y: cog.y,
      timestamp: cog.timestamp
    }))

    // SVGパス文字列を生成（最適化版）
    let path = ''
    if (points.length > 0) {
      const pathParts = [`M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`]
      for (let i = 1; i < points.length; i++) {
        pathParts.push(`L ${points[i].x.toFixed(3)} ${points[i].y.toFixed(3)}`)
      }
      path = pathParts.join(' ')
    }

    // 境界を効率的に計算
    let minX = 1, maxX = 0, minY = 1, maxY = 0
    for (const point of points) {
      if (point.x < minX) minX = point.x
      if (point.x > maxX) maxX = point.x
      if (point.y < minY) minY = point.y
      if (point.y > maxY) maxY = point.y
    }
    
    const bounds = {
      minX: Math.min(minX, 0),
      maxX: Math.max(maxX, 1),
      minY: Math.min(minY, 0),
      maxY: Math.max(maxY, 1)
    }

    // キャッシュを更新
    this.cachedVisualizationData = { points, path, bounds }
    this.lastVisualizationUpdate = currentTime

    return { points, path, bounds }
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    totalPoints: number
    timeSpan: number
    averageConfidence: number
    dataQuality: 'high' | 'medium' | 'low'
  } {
    if (this.cogHistory.length === 0) {
      return {
        totalPoints: 0,
        timeSpan: 0,
        averageConfidence: 0,
        dataQuality: 'low'
      }
    }

    const totalPoints = this.cogHistory.length
    const timeSpan = this.cogHistory[this.cogHistory.length - 1].timestamp - this.cogHistory[0].timestamp
    const averageConfidence = this.cogHistory.reduce((sum, cog) => sum + cog.confidence, 0) / totalPoints

    // データ品質の判定
    let dataQuality: 'high' | 'medium' | 'low'
    if (averageConfidence >= 0.8 && totalPoints >= CONFIG.MIN_ANALYSIS_POINTS * 2) {
      dataQuality = 'high'
    } else if (averageConfidence >= 0.6 && totalPoints >= CONFIG.MIN_ANALYSIS_POINTS) {
      dataQuality = 'medium'
    } else {
      dataQuality = 'low'
    }

    return {
      totalPoints,
      timeSpan,
      averageConfidence,
      dataQuality
    }
  }
}

/**
 * グローバルな軌跡トラッカーインスタンス
 */
export const globalTrajectoryTracker = new TrajectoryTracker()