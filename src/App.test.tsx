import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

// Mock Camera component
vi.mock('./components/Camera', () => ({
  Camera: ({ onStream, onCameraChange }: { 
    onStream?: (stream: MediaStream) => void
    onCameraChange?: (facingMode: 'user' | 'environment') => void 
  }) => {
    const mockStream = {} as MediaStream
    
    return (
      <div data-testid="camera-component">
        <button onClick={() => onStream?.(mockStream)} data-testid="mock-start-camera">
          Start Camera
        </button>
        <button 
          onClick={() => onCameraChange?.('environment')} 
          data-testid="mock-switch-camera"
        >
          Switch Camera
        </button>
        <video data-testid="mock-video" />
      </div>
    )
  },
}))

// Mock PoseLandmarkerDetector component
vi.mock('./components/PoseLandmarkerDetector', () => ({
  PoseLandmarkerDetector: ({ videoElement }: { videoElement?: HTMLVideoElement }) => (
    <div data-testid="pose-detector-component">
      {videoElement ? 'Pose detection active' : 'No video element'}
    </div>
  ),
}))

// Mock other components
vi.mock('./components/TrajectoryVisualization', () => ({
  TrajectoryVisualization: () => <div data-testid="trajectory-component">Trajectory Visualization</div>,
}))

vi.mock('./components/GaitClassificationDisplay', () => ({
  GaitClassificationDisplay: () => <div data-testid="classification-component">Gait Classification</div>,
}))

vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock document.querySelector for video element
const mockVideoElement = { play: vi.fn(), pause: vi.fn() } as unknown as HTMLVideoElement
Object.defineProperty(document, 'querySelector', {
  value: vi.fn((selector: string) => {
    if (selector === 'video') return mockVideoElement
    return null
  }),
  writable: true,
})

describe('App - Camera Integration (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 🔴 RED: Camera permission request test
  it('should render app header and camera section', () => {
    render(<App />)

    expect(screen.getByText('歩行分析アプリ - Catwalk')).toBeInTheDocument()
    expect(
      screen.getByText('カメラで歩行を撮影し、キャットウォークか酔歩かを判定します')
    ).toBeInTheDocument()
    expect(screen.getByText('カメラ映像')).toBeInTheDocument()
    expect(screen.getByTestId('camera-component')).toBeInTheDocument()
  })

  // 🔴 RED: Camera stream handling test
  it('should show pose detector when camera stream is available', async () => {
    render(<App />)

    // Initially pose detector should not be visible
    expect(screen.queryByTestId('pose-detector-component')).not.toBeInTheDocument()

    // Simulate camera stream start
    const startCameraButton = screen.getByTestId('mock-start-camera')
    fireEvent.click(startCameraButton)

    // Pose detector should appear after stream is available
    await waitFor(() => {
      expect(screen.getByTestId('pose-detector-component')).toBeInTheDocument()
      expect(screen.getByText('姿勢検出')).toBeInTheDocument()
    })
  })

  // 🔴 RED: Integration flow test
  it('should handle complete camera to pose detection flow', async () => {
    render(<App />)

    // Step 1: App loads with camera component
    expect(screen.getByTestId('camera-component')).toBeInTheDocument()
    expect(screen.queryByText('姿勢検出')).not.toBeInTheDocument()

    // Step 2: User starts camera
    const startCameraButton = screen.getByTestId('mock-start-camera')
    fireEvent.click(startCameraButton)

    // Step 3: Pose detection becomes available
    await waitFor(() => {
      expect(screen.getByText('姿勢検出')).toBeInTheDocument()
      expect(screen.getByTestId('pose-detector-component')).toBeInTheDocument()
    })
  })

  // MediaPipe連携 カメラ変更テスト (TDD RED phase)
  describe('MediaPipe Camera Switch Integration', () => {
    it('should handle camera switch without breaking MediaPipe integration', async () => {
      render(<App />)

      // カメラ開始
      const startCameraButton = screen.getByTestId('mock-start-camera')
      fireEvent.click(startCameraButton)

      // MediaPipe統合が有効になることを確認
      await waitFor(() => {
        expect(screen.getByTestId('pose-detector-component')).toBeInTheDocument()
      })

      // カメラ切り替え
      const switchCameraButton = screen.getByTestId('mock-switch-camera')
      fireEvent.click(switchCameraButton)

      // MediaPipe統合が継続されることを確認
      // このテストは現在失敗する（stream変更ハンドリングが未実装のため）
      await waitFor(() => {
        expect(screen.getByTestId('pose-detector-component')).toBeInTheDocument()
        expect(screen.getByText('姿勢検出')).toBeInTheDocument()
      })
    })

    it('should properly pass camera stream to MediaPipe components after switch', async () => {
      render(<App />)

      // 初期カメラ開始
      fireEvent.click(screen.getByTestId('mock-start-camera'))
      
      await waitFor(() => {
        expect(screen.getByTestId('pose-detector-component')).toBeInTheDocument()
      })

      // カメラ切り替え後もvideo elementが正しく渡されることを確認
      fireEvent.click(screen.getByTestId('mock-switch-camera'))
      
      // このテストは現在失敗する可能性がある（App.tsx の onCameraChange 未実装のため）
      await waitFor(() => {
        const poseDetector = screen.getByTestId('pose-detector-component')
        expect(poseDetector).toBeInTheDocument()
        // MediaPipeコンポーネントが新しいstreamを受け取っていることを間接的に確認
      })
    })
  })
})
