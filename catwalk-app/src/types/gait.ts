// 重心位置を表すインターフェース
export interface CenterOfGravity {
  x: number
  y: number
  timestamp: number
  confidence: number
}

// 歩行分析結果を表すインターフェース
export interface GaitAnalysis {
  cogHistory: CenterOfGravity[]
  stability: number // 0-100
  pattern: 'stable' | 'unstable' | 'unknown'
}

// 歩行分類結果を表すインターフェース
export interface GaitClassification {
  pattern: 'catwalk' | 'drunk' | 'unknown'
  confidence: number
  metrics: {
    stabilityScore: number
    regularityScore: number
    linearityScore: number
  }
}

// MediaPipeの姿勢ランドマーク点
export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}