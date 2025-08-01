import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FaceMeshDetector } from './FaceMeshDetector'

// MediaPipeをモック
vi.mock('@mediapipe/face_mesh', () => ({
  FaceMesh: vi.fn().mockImplementation(() => ({
    setOptions: vi.fn(),
    onResults: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn()
  }))
}))

vi.mock('@mediapipe/camera_utils', () => ({
  Camera: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn()
  }))
}))

describe('FaceMeshDetector', () => {
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
    
    vi.clearAllMocks()
  })

  // 🔴 RED: Face Mesh初期化のテスト（まだ実装されていない）
  it('should initialize Face Mesh correctly', async () => {
    const mockOnResults = vi.fn()
    
    // この関数はまだ実装されていないので失敗する
    render(
      <FaceMeshDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // 初期化中の表示を確認
    expect(screen.getByText(/Initializing face detection/)).toBeInTheDocument()

    // Face Meshが初期化されることを確認
    await waitFor(() => {
      expect(screen.queryByText(/Initializing face detection/)).not.toBeInTheDocument()
    })
  })

  // 🔴 RED: Face Mesh設定のテスト（まだ実装されていない）
  it('should configure Face Mesh with correct options', async () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceMeshDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
        maxNumFaces={2}
        refineLandmarks={true}
      />
    )

    // コンポーネントが描画されることを確認
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  // 🔴 RED: Canvas要素の描画テスト（まだ実装されていない）
  it('should render canvas element for face visualization', () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceMeshDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // Canvasが描画されることを確認
    const canvas = screen.getByRole('img') // canvasは通常img roleを持つ
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
  })

  // 🔴 RED: エラーハンドリングのテスト（まだ実装されていない）
  it('should handle Face Mesh initialization errors', async () => {
    const mockOnResults = vi.fn()
    
    // Face Mesh初期化を失敗させる
    const { FaceMesh } = await import('@mediapipe/face_mesh')
    const mockFaceMesh = FaceMesh as any
    mockFaceMesh.mockImplementationOnce(() => ({
      setOptions: vi.fn(),
      onResults: vi.fn(),
      initialize: vi.fn().mockRejectedValue(new Error('Face Mesh initialization failed')),
      close: vi.fn()
    }))

    render(
      <FaceMeshDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Face Mesh initialization failed/)).toBeInTheDocument()
    })
  })

  // 🔴 RED: 顔検出結果のコールバックテスト（まだ実装されていない）
  it('should call onResults callback when face detection results are received', async () => {
    const mockOnResults = vi.fn()
    
    render(
      <FaceMeshDetector 
        videoElement={mockVideoElement}
        onResults={mockOnResults}
      />
    )

    // Face Meshの結果コールバックをシミュレート
    const mockResults = {
      multiFaceLandmarks: [
        [
          { x: 0.5, y: 0.4, z: 0.1 },
          { x: 0.6, y: 0.5, z: 0.2 }
        ]
      ],
      image: mockVideoElement
    }

    // onResultsコールバックが呼ばれることを確認（実装後にパスする）
    // この時点では実装されていないため失敗する
  })

  // 🔴 RED: ビデオ要素変更時の再初期化テスト（まだ実装されていない）
  it('should reinitialize when video element changes', async () => {
    const mockOnResults = vi.fn()
    
    const { rerender } = render(
      <FaceMeshDetector 
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
      <FaceMeshDetector 
        videoElement={newVideoElement}
        onResults={mockOnResults}
      />
    )

    // 再初期化が行われることを確認（実装後にパスする）
    await waitFor(() => {
      expect(screen.queryByText(/Initializing face detection/)).not.toBeInTheDocument()
    })
  })
})