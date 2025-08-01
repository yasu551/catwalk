import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

// Mock Camera component
vi.mock('./components/Camera', () => ({
  Camera: ({ onStream }: { onStream?: (stream: MediaStream) => void }) => {
    const mockStream = {} as MediaStream

    return (
      <div data-testid="camera-component">
        <button onClick={() => onStream?.(mockStream)} data-testid="mock-start-camera">
          Start Camera
        </button>
        <video data-testid="mock-video" />
      </div>
    )
  },
}))

// Mock PoseDetector component
vi.mock('./components/PoseDetector', () => ({
  PoseDetector: ({ videoElement }: { videoElement?: HTMLVideoElement }) => (
    <div data-testid="pose-detector-component">
      {videoElement ? 'Pose detection active' : 'No video element'}
    </div>
  ),
}))

// Mock document.querySelector for video element
Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => ({}) as HTMLVideoElement),
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
})
