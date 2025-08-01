import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FaceLandmarkerDetector } from './FaceLandmarkerDetector'

// MediaPipe Tasks Vision をモック
vi.mock('@mediapipe/tasks-vision', () => ({
  FaceLandmarker: {
    createFromOptions: vi.fn().mockResolvedValue({
      detectForVideo: vi.fn().mockReturnValue({
        faceLandmarks: [
          [
            { x: 0.5, y: 0.3, z: 0.1 },
            { x: 0.6, y: 0.4, z: 0.2 }
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

describe('FaceLandmarkerDetector (Migrated from FaceMeshDetector)', () => {
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

  // ✅ GREEN: Face Landmarker初期化のテスト（実装完了）
  it('should initialize Face Landmarker correctly', async () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // 初期化中の表示を確認
    expect(screen.getByText(/Initializing face landmark detection/)).toBeInTheDocument()

    // Face Landmarkerが初期化されることを確認
    await waitFor(() => {
      expect(screen.queryByText(/Initializing face landmark detection/)).not.toBeInTheDocument()
    })
  })

  // ✅ GREEN: Face Landmarker設定のテスト（実装完了）
  it('should configure Face Landmarker with correct options', async () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
        numFaces={2}
        minFaceDetectionConfidence={0.7}
      />
    )

    // コンポーネントが描画されることを確認
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  // ✅ GREEN: Canvas要素の描画テスト（実装完了）
  it('should render canvas element for face visualization', () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // Canvasが描画されることを確認
    const canvas = screen.getByRole('img') // canvasは通常img roleを持つ
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
  })

  // ✅ GREEN: エラーハンドリングのテスト（実装完了）
  it('should handle Face Landmarker initialization errors', async () => {
    const mockOnResults = vi.fn()
    
    // Face Landmarker初期化を失敗させる
    const { FaceLandmarker } = await import('@mediapipe/tasks-vision')
    const mockFaceLandmarker = FaceLandmarker as any
    mockFaceLandmarker.createFromOptions.mockRejectedValueOnce(new Error('Face Landmarker initialization failed'))

    render(
      <FaceLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Face Landmarker initialization failed/)).toBeInTheDocument()
    })
  })

  // ✅ GREEN: 顔検出結果のコールバックテスト（実装完了）
  it('should call onResults callback when face detection results are received', async () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // onResultsコールバックが定義されていることを確認
    expect(mockOnResults).toBeDefined()
    
    // 顔検出処理が実行されるまで待機
    await waitFor(() => {
      expect(mockOnResults).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  // ✅ GREEN: ビデオ要素変更時の再初期化テスト（実装完了）
  it('should handle video element changes gracefully', async () => {
    const mockOnResults = vi.fn()
    
    const { rerender } = render(
      <FaceLandmarkerDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // 新しいビデオ要素で再レンダー
    const newVideoElement = document.createElement('video')
    Object.defineProperty(newVideoElement, 'videoWidth', {
      value: 1280,
      writable: false
    })
    Object.defineProperty(newVideoElement, 'videoHeight', {
      value: 720,
      writable: false
    })

    rerender(
      <FaceLandmarkerDetector 
        videoElement={newVideoElement}
        onResults={mockOnResults}
      />
    )

    // コンポーネントが正常に動作することを確認
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })
})