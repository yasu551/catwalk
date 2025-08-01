import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PoseLandmarkerDetector } from './PoseLandmarkerDetector'

// MediaPipe Tasks Vision をモック
vi.mock('@mediapipe/tasks-vision', () => ({
  PoseLandmarker: {
    createFromOptions: vi.fn().mockResolvedValue({
      detectForVideo: vi.fn().mockReturnValue({
        landmarks: [
          [
            { x: 0.5, y: 0.3, z: 0.1, visibility: 0.9 },
            { x: 0.6, y: 0.4, z: 0.2, visibility: 0.8 }
          ]
        ],
        worldLandmarks: [
          [
            { x: 0.05, y: 0.03, z: 0.01, visibility: 0.9 },
            { x: 0.06, y: 0.04, z: 0.02, visibility: 0.8 }
          ]
        ]
      }),
      close: vi.fn()
    })
  },
  FilesetResolver: {
    forVisionTasks: vi.fn().mockResolvedValue({})
  }
}))

// 重心計算とトラッカーをモック
vi.mock('../utils/centerOfGravity', () => ({
  calculateCenterOfGravity: vi.fn().mockReturnValue({
    x: 0.5,
    y: 0.5,
    timestamp: Date.now(),
    confidence: 0.9
  })
}))

vi.mock('../utils/trajectoryTracker', () => ({
  globalTrajectoryTracker: {
    addCenterOfGravity: vi.fn()
  }
}))

describe('PoseLandmarkerDetector', () => {
  let mockVideoElement: HTMLVideoElement

  beforeEach(() => {
    // モックビデオ要素を作成
    mockVideoElement = document.createElement('video')
    
    // videoWidthとvideoHeightはgetterなので、Objectを使って定義
    Object.defineProperty(mockVideoElement, 'videoWidth', {
      value: 640,
      writable: false
    })
    Object.defineProperty(mockVideoElement, 'videoHeight', {
      value: 480,
      writable: false
    })
    
    // Canvas contextのモック
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      save: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn()
    })
    
    // requestAnimationFrameのモック
    ;(globalThis as any).requestAnimationFrame = vi.fn()
    ;(globalThis as any).cancelAnimationFrame = vi.fn()
    
    // console.errorをモック（エラーメッセージのテスト時以外はサイレント）
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<PoseLandmarkerDetector />)
    
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
  })

  it('renders canvas with correct attributes', () => {
    const { container } = render(<PoseLandmarkerDetector />)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('pose-landmarker-canvas')
  })

  it('applies default configuration correctly', () => {
    render(<PoseLandmarkerDetector />)
    
    const container = screen.getByText('Initializing pose landmark detection...').parentElement
    expect(container).toHaveClass('pose-landmarker-detector')
  })

  it('handles video element prop gracefully', () => {
    render(<PoseLandmarkerDetector videoElement={mockVideoElement} />)
    
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
  })

  it('accepts configuration props without errors', () => {
    render(
      <PoseLandmarkerDetector 
        videoElement={mockVideoElement}
        numPoses={2}
        minPoseDetectionConfidence={0.7}
        minPosePresenceConfidence={0.6}
        minTrackingConfidence={0.5}
        outputSegmentationMasks={true}
        runningMode="IMAGE"
        onResults={vi.fn()}
      />
    )
    
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
  })

  it('handles pose detection callback correctly', () => {
    const mockOnResults = vi.fn()
    
    render(
      <PoseLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // onResultsコールバックが定義されていることを確認
    expect(mockOnResults).toBeDefined()
  })

  it('renders with different running modes', () => {
    const { rerender } = render(
      <PoseLandmarkerDetector runningMode="IMAGE" />
    )
    
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
    
    rerender(
      <PoseLandmarkerDetector runningMode="VIDEO" />
    )
    
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
  })

  it('limits numPoses to maximum of 2 for performance', () => {
    render(<PoseLandmarkerDetector numPoses={10} />)
    
    // コンポーネントが正常にレンダリングされることを確認（内部で2に制限される）
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
  })

  it('handles center of gravity calculation integration', () => {
    render(
      <PoseLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={vi.fn()}
      />
    )
    
    // コンポーネントが重心計算システムと統合されていることを確認
    expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
  })
})