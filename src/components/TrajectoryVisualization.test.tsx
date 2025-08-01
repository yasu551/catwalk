import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrajectoryVisualization from './TrajectoryVisualization'
import { globalTrajectoryTracker } from '../utils/trajectoryTracker'

// グローバルトラッカーをモック
vi.mock('../utils/trajectoryTracker', () => ({
  globalTrajectoryTracker: {
    getVisualizationData: vi.fn(),
    analyzeCurrentGait: vi.fn(),
    getStatistics: vi.fn()
  }
}))

describe('TrajectoryVisualization', () => {
  const mockTrajectoryTracker = globalTrajectoryTracker as unknown as {
    getVisualizationData: ReturnType<typeof vi.fn>
    analyzeCurrentGait: ReturnType<typeof vi.fn>
    getStatistics: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 🟢 GREEN: 基本レンダリングのテスト
  it('should render correctly with default props', () => {
    // モックデータを設定
    mockTrajectoryTracker.getVisualizationData.mockReturnValue({
      points: [],
      path: '',
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    })
    mockTrajectoryTracker.analyzeCurrentGait.mockReturnValue(null)
    mockTrajectoryTracker.getStatistics.mockReturnValue({
      totalPoints: 0,
      timeSpan: 0,
      averageConfidence: 0,
      dataQuality: 'low'
    })

    render(<TrajectoryVisualization />)

    expect(screen.getByText('歩行軌跡分析')).toBeInTheDocument()
    expect(screen.getByText('軌跡データを取得中...')).toBeInTheDocument()
  })

  // 🟢 GREEN: 統計情報表示のテスト
  it('should display statistics correctly', () => {
    mockTrajectoryTracker.getVisualizationData.mockReturnValue({
      points: [],
      path: '',
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    })
    mockTrajectoryTracker.analyzeCurrentGait.mockReturnValue(null)
    mockTrajectoryTracker.getStatistics.mockReturnValue({
      totalPoints: 25,
      timeSpan: 5000,
      averageConfidence: 0.85,
      dataQuality: 'high'
    })

    render(<TrajectoryVisualization />)

    expect(screen.getByText('25')).toBeInTheDocument() // データ点数
    expect(screen.getByText('85.0%')).toBeInTheDocument() // 平均信頼度
    expect(screen.getByText('high')).toBeInTheDocument() // データ品質
    expect(screen.getByText('5.0s')).toBeInTheDocument() // 分析時間
  })

  // 🟢 GREEN: 歩行パターン分析結果表示のテスト
  it('should display gait analysis results', () => {
    mockTrajectoryTracker.getVisualizationData.mockReturnValue({
      points: [],
      path: '',
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    })
    mockTrajectoryTracker.analyzeCurrentGait.mockReturnValue({
      cogHistory: [],
      stability: 85.5,
      pattern: 'stable'
    })
    mockTrajectoryTracker.getStatistics.mockReturnValue({
      totalPoints: 20,
      timeSpan: 4000,
      averageConfidence: 0.8,
      dataQuality: 'medium'
    })

    render(<TrajectoryVisualization />)

    expect(screen.getByText('キャットウォーク (安定)')).toBeInTheDocument()
    expect(screen.getByText('85.5/100')).toBeInTheDocument()
  })

  // 🟢 GREEN: 不安定パターンの表示テスト
  it('should display unstable pattern correctly', () => {
    mockTrajectoryTracker.getVisualizationData.mockReturnValue({
      points: [],
      path: '',
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    })
    mockTrajectoryTracker.analyzeCurrentGait.mockReturnValue({
      cogHistory: [],
      stability: 35.2,
      pattern: 'unstable'
    })
    mockTrajectoryTracker.getStatistics.mockReturnValue({
      totalPoints: 15,
      timeSpan: 3000,
      averageConfidence: 0.7,
      dataQuality: 'medium'
    })

    render(<TrajectoryVisualization />)

    expect(screen.getByText('酔歩 (不安定)')).toBeInTheDocument()
    expect(screen.getByText('35.2/100')).toBeInTheDocument()
  })

  // 🟢 GREEN: SVG要素の存在確認テスト
  it('should render SVG visualization element', () => {
    mockTrajectoryTracker.getVisualizationData.mockReturnValue({
      points: [
        { x: 0.3, y: 0.4, timestamp: 1000 },
        { x: 0.4, y: 0.5, timestamp: 1200 }
      ],
      path: 'M 0.3 0.4 L 0.4 0.5',
      bounds: { minX: 0.3, maxX: 0.4, minY: 0.4, maxY: 0.5 }
    })
    mockTrajectoryTracker.analyzeCurrentGait.mockReturnValue(null)
    mockTrajectoryTracker.getStatistics.mockReturnValue({
      totalPoints: 2,
      timeSpan: 200,
      averageConfidence: 0.9,
      dataQuality: 'high'
    })

    render(<TrajectoryVisualization width={500} height={400} />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '500')
    expect(svg).toHaveAttribute('height', '400')
  })

  // 🟢 GREEN: カスタムプロップのテスト
  it('should accept custom props', () => {
    mockTrajectoryTracker.getVisualizationData.mockReturnValue({
      points: [],
      path: '',
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    })
    mockTrajectoryTracker.analyzeCurrentGait.mockReturnValue(null)
    mockTrajectoryTracker.getStatistics.mockReturnValue({
      totalPoints: 0,
      timeSpan: 0,
      averageConfidence: 0,
      dataQuality: 'low'
    })

    render(
      <TrajectoryVisualization 
        width={600} 
        height={500} 
        className="custom-class" 
      />
    )

    const container = document.querySelector('.trajectory-visualization')
    expect(container).toHaveClass('custom-class')
    
    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '600')
    expect(svg).toHaveAttribute('height', '500')
  })
})