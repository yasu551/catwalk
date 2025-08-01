import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Camera } from './Camera'

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
})

// Mock MediaStream
const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
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
      getTracks: vi.fn(() => [mockTrack]),
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

  // カメラ切り替え機能のテスト (RED phase - これらのテストは現在失敗する)
  describe('Camera switching functionality', () => {
    it('should have initial facing mode state', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream)
      render(<Camera />)
      
      // カメラを開始してからfacing-mode-indicatorが表示されることを確認
      fireEvent.click(screen.getByText('Start Camera'))
      
      await waitFor(() => {
        expect(screen.getByTestId('facing-mode-indicator')).toBeInTheDocument()
        expect(screen.getByTestId('facing-mode-indicator')).toHaveTextContent('Front Camera')
      })
    })

    it('should render camera switch button', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream)
      render(<Camera />)
      
      // カメラを開始
      fireEvent.click(screen.getByText('Start Camera'))
      
      // カメラ切り替えボタンの存在を確認
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch camera/i })).toBeInTheDocument()
      })
    })

    it('should toggle facing mode when switch button is clicked', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream)
      render(<Camera />)
      
      // カメラ開始
      fireEvent.click(screen.getByText('Start Camera'))
      await waitFor(() => {
        expect(screen.getByText('Stop Camera')).toBeInTheDocument()
      })

      // カメラ切り替えボタンをクリック
      const switchButton = screen.getByRole('button', { name: /switch camera/i })
      fireEvent.click(switchButton)

      // facingModeが変更されることを確認
      // このテストは現在失敗する（切り替えロジックが未実装のため）
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment', // 'user'から'environment'に変更されることを期待
          },
          audio: false,
        })
      })
    })

    it('should call getUserMedia with correct facing mode on switch', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream)
      const onStreamMock = vi.fn()
      render(<Camera onStream={onStreamMock} />)
      
      // カメラ開始
      fireEvent.click(screen.getByText('Start Camera'))
      await waitFor(() => {
        expect(screen.getByText('Stop Camera')).toBeInTheDocument()
      })

      // 初回はfacingMode: 'user'で呼ばれることを確認
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })

      // モックをリセット
      mockGetUserMedia.mockClear()
      mockGetUserMedia.mockResolvedValue(mockStream)

      // カメラ切り替え
      const switchButton = screen.getByRole('button', { name: /switch camera/i })
      fireEvent.click(switchButton)

      // 2回目はfacingMode: 'environment'で呼ばれることを確認
      // このテストは現在失敗する（切り替えロジックが未実装のため）
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment',
          },
          audio: false,
        })
      })
    })

    it('should handle camera switch errors gracefully', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream)
      render(<Camera />)
      
      // カメラ開始
      fireEvent.click(screen.getByText('Start Camera'))
      await waitFor(() => {
        expect(screen.getByText('Stop Camera')).toBeInTheDocument()
      })

      // カメラ切り替え時にエラーが発生する場合をモック
      mockGetUserMedia.mockRejectedValueOnce(new Error('Camera switch failed'))

      // カメラ切り替え
      const switchButton = screen.getByRole('button', { name: /switch camera/i })
      fireEvent.click(switchButton)

      // エラーメッセージが表示されることを確認
      // このテストは現在失敗する（エラーハンドリングが未実装のため）
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Camera switch failed')
      })
    })

    it('should show current facing mode state', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream)
      render(<Camera />)
      
      // カメラ開始
      fireEvent.click(screen.getByText('Start Camera'))
      await waitFor(() => {
        expect(screen.getByText('Stop Camera')).toBeInTheDocument()
      })

      // 初期状態ではフロントカメラ表示
      // このテストは現在失敗する（状態表示が未実装のため）
      expect(screen.getByTestId('facing-mode-indicator')).toHaveTextContent('Front Camera')

      // カメラ切り替え
      const switchButton = screen.getByRole('button', { name: /switch camera/i })
      fireEvent.click(switchButton)

      // リアカメラ表示に変更
      await waitFor(() => {
        expect(screen.getByTestId('facing-mode-indicator')).toHaveTextContent('Rear Camera')
      })
    })
  })
})
