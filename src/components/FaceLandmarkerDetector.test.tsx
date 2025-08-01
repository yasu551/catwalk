import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FaceLandmarkerDetector } from './FaceLandmarkerDetector'

// Mock MediaPipe Tasks Vision with simpler approach
vi.mock('@mediapipe/tasks-vision', () => ({
  FaceLandmarker: {
    createFromOptions: vi.fn().mockRejectedValue(new Error('Mocked initialization'))
  },
  FilesetResolver: {
    forVisionTasks: vi.fn().mockRejectedValue(new Error('Mocked resolver'))
  }
}))

describe('FaceLandmarkerDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      save: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn()
    })
    
    // Mock requestAnimationFrame
    ;(globalThis as any).requestAnimationFrame = vi.fn()
    ;(globalThis as any).cancelAnimationFrame = vi.fn()
  })

  it('renders loading state initially', () => {
    render(<FaceLandmarkerDetector />)
    
    expect(screen.getByText('Initializing face landmark detection...')).toBeInTheDocument()
  })

  it('renders canvas with correct accessibility attributes', () => {
    render(<FaceLandmarkerDetector />)

    const canvas = screen.getByRole('img')
    expect(canvas).toHaveAttribute('aria-label', 'Face landmark detection visualization')
    expect(canvas).toHaveClass('face-landmarker-canvas')
  })

  it('renders error state when initialization fails', async () => {
    render(<FaceLandmarkerDetector />)

    // Wait for error to appear (async initialization)
    await vi.waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
    })
  })

  it('applies CSS classes correctly', () => {
    render(<FaceLandmarkerDetector />)

    const container = screen.getByText('Initializing face landmark detection...').parentElement
    expect(container).toHaveClass('face-landmarker-detector')
  })

  it('renders with default props', () => {
    const { container } = render(<FaceLandmarkerDetector />)
    
    expect(container.querySelector('.face-landmarker-detector')).toBeInTheDocument()
    expect(container.querySelector('.face-landmarker-canvas')).toBeInTheDocument()
    expect(container.querySelector('.face-landmarker-loading')).toBeInTheDocument()
  })

  it('handles video element prop gracefully', () => {
    const video = document.createElement('video')
    Object.defineProperty(video, 'videoWidth', { value: 640 })
    Object.defineProperty(video, 'videoHeight', { value: 480 })
    
    render(<FaceLandmarkerDetector videoElement={video} />)
    
    expect(screen.getByText('Initializing face landmark detection...')).toBeInTheDocument()
  })

  it('accepts configuration props without errors', () => {
    render(
      <FaceLandmarkerDetector 
        numFaces={2}
        minFaceDetectionConfidence={0.7}
        outputFaceBlendshapes={true}
        runningMode="IMAGE"
        onResults={vi.fn()}
      />
    )
    
    expect(screen.getByText('Initializing face landmark detection...')).toBeInTheDocument()
  })
})