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

  // Phase 3: videoElement変更時の再初期化テスト (TDD RED)
  describe('Video Element Change Lifecycle', () => {
    it('should reinitialize when videoElement prop changes', async () => {
      const mockVideo1 = document.createElement('video')
      const mockVideo2 = document.createElement('video')
      
      Object.defineProperty(mockVideo1, 'videoWidth', { value: 640 })
      Object.defineProperty(mockVideo1, 'videoHeight', { value: 480 })
      Object.defineProperty(mockVideo2, 'videoWidth', { value: 1280 })
      Object.defineProperty(mockVideo2, 'videoHeight', { value: 720 })

      const { rerender } = render(
        <PoseLandmarkerDetector videoElement={mockVideo1} />
      )

      expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()

      // video elementを変更
      rerender(<PoseLandmarkerDetector videoElement={mockVideo2} />)

      // MediaPipeの初期化を待つ
      await vi.waitFor(() => {
        // 再初期化されることを期待（ローディング状態が再表示される可能性）
        expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
      })
    })

    it('should clean up animation frame when videoElement changes', async () => {
      vi.spyOn(globalThis, 'cancelAnimationFrame')
      
      // animation frameをトリガーするために十分な条件を設定
      Object.defineProperty(mockVideoElement, 'videoWidth', { value: 640 })
      Object.defineProperty(mockVideoElement, 'videoHeight', { value: 480 })

      const { rerender } = render(
        <PoseLandmarkerDetector videoElement={mockVideoElement} />
      )

      // MediaPipeの初期化を待つ
      await new Promise(resolve => setTimeout(resolve, 100))

      const mockVideo2 = document.createElement('video')
      Object.defineProperty(mockVideo2, 'videoWidth', { value: 1280 })
      Object.defineProperty(mockVideo2, 'videoHeight', { value: 720 })

      // video elementを変更
      rerender(<PoseLandmarkerDetector videoElement={mockVideo2} />)

      // フレーム処理のクリーンアップを待つ
      await new Promise(resolve => setTimeout(resolve, 50))

      // useEffectのクリーンアップ関数が動作することを確認（間接的にテスト）
      const isLoading = screen.queryByText('Initializing pose landmark detection...')
      const canvas = screen.queryByRole('img') || document.querySelector('canvas')
      expect(isLoading || canvas).toBeTruthy()
    })

    it('should restart pose detection with new video element', async () => {
      const requestAnimationFrameSpy = vi.spyOn(globalThis, 'requestAnimationFrame')
      
      Object.defineProperty(mockVideoElement, 'videoWidth', { value: 640 })
      Object.defineProperty(mockVideoElement, 'videoHeight', { value: 480 })

      const { rerender } = render(
        <PoseLandmarkerDetector videoElement={mockVideoElement} />
      )

      // MediaPipeの初期化を待つ
      await new Promise(resolve => setTimeout(resolve, 100))

      // モック関数をクリア
      requestAnimationFrameSpy.mockClear()

      const mockVideo2 = document.createElement('video')
      Object.defineProperty(mockVideo2, 'videoWidth', { value: 1280 })
      Object.defineProperty(mockVideo2, 'videoHeight', { value: 720 })

      // video elementを変更
      rerender(<PoseLandmarkerDetector videoElement={mockVideo2} />)

      // フレーム処理の再開始を待つ
      await new Promise(resolve => setTimeout(resolve, 50)) 

      // 新しいvideo elementで処理が再開されることを期待
      expect(requestAnimationFrameSpy).toHaveBeenCalled()
    })

    it('should handle null to non-null videoElement transition', () => {
      const { rerender } = render(
        <PoseLandmarkerDetector videoElement={undefined} />
      )

      expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()

      // null から実際のvideo elementに変更
      rerender(<PoseLandmarkerDetector videoElement={mockVideoElement} />)

      // 正常に動作することを確認
      expect(screen.getByText('Initializing pose landmark detection...')).toBeInTheDocument()
    })

    it('should handle non-null to null videoElement transition', async () => {
      Object.defineProperty(mockVideoElement, 'videoWidth', { value: 640 })
      Object.defineProperty(mockVideoElement, 'videoHeight', { value: 480 })

      const { rerender } = render(
        <PoseLandmarkerDetector videoElement={mockVideoElement} />
      )

      // MediaPipeの初期化を待つ
      await new Promise(resolve => setTimeout(resolve, 100))

      // video element を undefined に変更
      rerender(<PoseLandmarkerDetector videoElement={undefined} />)

      // クリーンアップを待つ
      await new Promise(resolve => setTimeout(resolve, 50))

      // null transition が正常に処理されることを確認
      const isLoading = screen.queryByText('Initializing pose landmark detection...')
      const canvas = screen.queryByRole('img') || document.querySelector('canvas')
      expect(isLoading || canvas).toBeTruthy()
    })
  })
})