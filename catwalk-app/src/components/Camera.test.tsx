import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Camera } from './Camera'

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
})

// Mock MediaStream
const mockStream = {
  getTracks: vi.fn(() => [
    { stop: vi.fn() }
  ])
} as unknown as MediaStream

describe('Camera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders start camera button initially', () => {
    render(<Camera />)
    expect(screen.getByText('Start Camera')).toBeInTheDocument()
  })

  it('shows loading state when starting camera', async () => {
    mockGetUserMedia.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<Camera />)
    
    fireEvent.click(screen.getByText('Start Camera'))
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('successfully starts camera and shows video', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)
    render(<Camera />)
    
    fireEvent.click(screen.getByText('Start Camera'))
    
    await waitFor(() => {
      expect(screen.getByText('Stop Camera')).toBeInTheDocument()
    })
    
    const video = document.querySelector('video')
    expect(video).toHaveStyle({ display: 'block' })
  })

  it('handles camera access error', async () => {
    const errorMessage = 'Permission denied'
    mockGetUserMedia.mockRejectedValue(new Error(errorMessage))
    render(<Camera />)
    
    fireEvent.click(screen.getByText('Start Camera'))
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(`Camera access failed: ${errorMessage}`)
    })
  })

  it('calls onStream callback when camera starts', async () => {
    const onStreamMock = vi.fn()
    mockGetUserMedia.mockResolvedValue(mockStream)
    render(<Camera onStream={onStreamMock} />)
    
    fireEvent.click(screen.getByText('Start Camera'))
    
    await waitFor(() => {
      expect(onStreamMock).toHaveBeenCalledWith(mockStream)
    })
  })

  it('stops camera and cleans up stream', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStreamWithTracks = {
      getTracks: vi.fn(() => [mockTrack])
    } as unknown as MediaStream
    
    mockGetUserMedia.mockResolvedValue(mockStreamWithTracks)
    render(<Camera />)
    
    // Start camera
    fireEvent.click(screen.getByText('Start Camera'))
    await waitFor(() => {
      expect(screen.getByText('Stop Camera')).toBeInTheDocument()
    })
    
    // Stop camera
    fireEvent.click(screen.getByText('Stop Camera'))
    
    await waitFor(() => {
      expect(screen.getByText('Start Camera')).toBeInTheDocument()
    })
    
    expect(mockTrack.stop).toHaveBeenCalled()
  })
})