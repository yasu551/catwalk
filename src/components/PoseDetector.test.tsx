import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PoseDetector } from './PoseDetector'

// Mock canvas context
const mockCanvasContext = {
  save: vi.fn(),
  restore: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as unknown as HTMLCanvasElement['getContext']

// Mock MediaPipe modules
vi.mock('@mediapipe/pose', () => ({
  Pose: vi.fn().mockImplementation(() => ({
    setOptions: vi.fn(),
    onResults: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
    close: vi.fn(),
  })),
  POSE_CONNECTIONS: [],
}))

vi.mock('@mediapipe/camera_utils', () => ({
  Camera: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}))

vi.mock('@mediapipe/drawing_utils', () => ({
  drawConnectors: vi.fn(),
  drawLandmarks: vi.fn(),
}))

describe('PoseDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<PoseDetector />)
    expect(screen.getByText('Initializing pose detection...')).toBeInTheDocument()
  })

  it('renders canvas element', () => {
    render(<PoseDetector />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('pose-canvas')
  })

  it('handles initialization error', async () => {
    const { Pose } = await import('@mediapipe/pose')
    vi.mocked(Pose).mockImplementation(
      () =>
        ({
          setOptions: vi.fn(),
          onResults: vi.fn(),
          initialize: vi.fn().mockRejectedValue(new Error('Init failed')),
          send: vi.fn(),
          close: vi.fn(),
          POSE_CONNECTIONS: [],
        }) as unknown as InstanceType<typeof Pose>
    )

    render(<PoseDetector />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error: Init failed')
    })
  })

  it('calls onResults callback when pose results are received', async () => {
    const onResultsMock = vi.fn()
    const { Pose } = await import('@mediapipe/pose')

    let onResultsCallback: ((results: unknown) => void) | null = null
    vi.mocked(Pose).mockImplementation(
      () =>
        ({
          setOptions: vi.fn(),
          onResults: vi.fn((callback: (results: unknown) => void) => {
            onResultsCallback = callback
          }),
          initialize: vi.fn().mockResolvedValue(undefined),
          send: vi.fn(),
          close: vi.fn(),
          POSE_CONNECTIONS: [],
        }) as unknown as InstanceType<typeof Pose>
    )

    render(<PoseDetector onResults={onResultsMock} />)

    // Wait for initialization
    await waitFor(() => {
      expect(screen.queryByText('Initializing pose detection...')).not.toBeInTheDocument()
    })

    // Simulate pose results
    if (onResultsCallback) {
      const mockResults = {
        image: document.createElement('canvas'),
        poseLandmarks: [],
      }

      await act(async () => {
        onResultsCallback?.(mockResults)
      })

      expect(onResultsMock).toHaveBeenCalledWith(mockResults)
    }
  })

  it('sets up canvas with correct styles', () => {
    render(<PoseDetector />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toHaveStyle({
      width: '100%',
      maxWidth: '640px',
      height: 'auto',
      border: '1px solid #ccc',
    })
  })
})
