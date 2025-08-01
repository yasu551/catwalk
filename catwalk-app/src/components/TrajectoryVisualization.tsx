import React, { useEffect, useRef, useState } from 'react'
import { type GaitAnalysis } from '../types/gait'
import { globalTrajectoryTracker } from '../utils/trajectoryTracker'

interface TrajectoryVisualizationProps {
  width?: number
  height?: number
  className?: string
}

export const TrajectoryVisualization: React.FC<TrajectoryVisualizationProps> = ({
  width = 400,
  height = 300,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [gaitAnalysis, setGaitAnalysis] = useState<GaitAnalysis | null>(null)
  const [statistics, setStatistics] = useState({
    totalPoints: 0,
    timeSpan: 0,
    averageConfidence: 0,
    dataQuality: 'low' as 'high' | 'medium' | 'low'
  })

  useEffect(() => {
    const updateVisualization = () => {
      // 可視化データを取得
      const vizData = globalTrajectoryTracker.getVisualizationData()
      const analysis = globalTrajectoryTracker.analyzeCurrentGait()
      const stats = globalTrajectoryTracker.getStatistics()

      setGaitAnalysis(analysis)
      setStatistics(stats)

      // SVG要素を更新
      if (svgRef.current && vizData.points.length > 0) {
        const svg = svgRef.current
        
        // 既存の動的要素を効率的に削除
        const existingElements = svg.querySelectorAll('.trajectory-path, .trajectory-point')
        existingElements.forEach(element => element.remove())

        // スケールを計算（座標系を正規化）
        const scaleX = width * 0.8 // 80%を使用してマージンを確保
        const scaleY = height * 0.8
        const offsetX = width * 0.1 // 10%マージン
        const offsetY = height * 0.1

        // 軌跡パスを描画
        if (vizData.path) {
          const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          
          // 座標をスケール変換
          const scaledPath = vizData.path.replace(/([ML])\s*(\d+\.?\d*)\s+(\d+\.?\d*)/g, 
            (_, command, x, y) => {
              const scaledX = parseFloat(x) * scaleX + offsetX
              const scaledY = parseFloat(y) * scaleY + offsetY
              return `${command} ${scaledX} ${scaledY}`
            }
          )

          pathElement.setAttribute('d', scaledPath)
          pathElement.setAttribute('class', 'trajectory-path')
          pathElement.setAttribute('fill', 'none')
          pathElement.setAttribute('stroke', getTrajectoryColor(analysis?.pattern))
          pathElement.setAttribute('stroke-width', '2')
          pathElement.setAttribute('stroke-linecap', 'round')
          svg.appendChild(pathElement)
        }

        // 重心点を描画
        vizData.points.forEach((point, index) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          const scaledX = point.x * scaleX + offsetX
          const scaledY = point.y * scaleY + offsetY
          
          circle.setAttribute('cx', scaledX.toString())
          circle.setAttribute('cy', scaledY.toString())
          circle.setAttribute('r', '3')
          circle.setAttribute('class', 'trajectory-point')
          circle.setAttribute('fill', getPointColor(index, vizData.points.length))
          circle.setAttribute('opacity', '0.7')
          svg.appendChild(circle)
        })
      }
    }

    // パフォーマンス向上のため更新頻度を調整
    const interval = setInterval(updateVisualization, 200) // 200ms間隔に変更
    updateVisualization() // 初回実行

    return () => clearInterval(interval)
  }, [width, height])

  // 軌跡の色を決定
  const getTrajectoryColor = (pattern?: string): string => {
    switch (pattern) {
      case 'stable': return '#4CAF50' // 緑（安定）
      case 'unstable': return '#F44336' // 赤（不安定）
      default: return '#FF9800' // オレンジ（不明）
    }
  }

  // 点の色を決定（時系列グラデーション）
  const getPointColor = (index: number, total: number): string => {
    const ratio = index / Math.max(1, total - 1)
    const hue = 240 + ratio * 120 // 青から緑へのグラデーション
    return `hsl(${hue}, 70%, 50%)`
  }

  // データ品質に基づくステータス色
  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-red-600'
    }
  }

  return (
    <div className={`trajectory-visualization ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">歩行軌跡分析</h3>
        
        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="font-medium">データ点数:</span> {statistics.totalPoints}
          </div>
          <div>
            <span className="font-medium">平均信頼度:</span> {(statistics.averageConfidence * 100).toFixed(1)}%
          </div>
          <div>
            <span className="font-medium">データ品質:</span> 
            <span className={`ml-1 ${getQualityColor(statistics.dataQuality)}`}>
              {statistics.dataQuality}
            </span>
          </div>
          <div>
            <span className="font-medium">分析時間:</span> {(statistics.timeSpan / 1000).toFixed(1)}s
          </div>
        </div>

        {/* 歩行パターン分析結果 */}
        {gaitAnalysis && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">歩行パターン:</span>
              <span 
                className={`px-2 py-1 rounded text-white text-sm ${
                  gaitAnalysis.pattern === 'stable' ? 'bg-green-500' :
                  gaitAnalysis.pattern === 'unstable' ? 'bg-red-500' : 'bg-yellow-500'
                }`}
              >
                {gaitAnalysis.pattern === 'stable' ? 'キャットウォーク (安定)' :
                 gaitAnalysis.pattern === 'unstable' ? '酔歩 (不安定)' : '判定中'}
              </span>
            </div>
            <div className="mt-2">
              <span className="font-medium">安定性スコア:</span> 
              <span className="ml-2">{gaitAnalysis.stability.toFixed(1)}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG可視化 */}
      <div className="border rounded-lg p-4 bg-white">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-200 rounded"
          style={{ backgroundColor: '#fafafa' }}
        >
          {/* グリッド線 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* 中心線 */}
          <line 
            x1={width * 0.1} 
            y1={height * 0.5} 
            x2={width * 0.9} 
            y2={height * 0.5} 
            stroke="#cccccc" 
            strokeWidth="1" 
            strokeDasharray="5,5"
          />
          <line 
            x1={width * 0.5} 
            y1={height * 0.1} 
            x2={width * 0.5} 
            y2={height * 0.9} 
            stroke="#cccccc" 
            strokeWidth="1" 
            strokeDasharray="5,5"
          />
        </svg>
        
        {statistics.totalPoints === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            軌跡データを取得中...
          </div>
        )}
      </div>
    </div>
  )
}

export default TrajectoryVisualization