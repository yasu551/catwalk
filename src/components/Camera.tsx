import { useEffect, useRef, useState } from 'react'

interface CameraProps {
  onStream?: (stream: MediaStream) => void
  defaultFacingMode?: 'user' | 'environment'
  onCameraChange?: (facingMode: 'user' | 'environment') => void
}

export function Camera({ onStream, defaultFacingMode = 'user', onCameraChange }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(defaultFacingMode)

  const startCamera = async (newFacingMode?: 'user' | 'environment') => {
    setIsLoading(true)
    setError(null)

    const currentFacingMode = newFacingMode || facingMode

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: currentFacingMode,
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setHasPermission(true)
      if (newFacingMode) {
        setFacingMode(newFacingMode)
        onCameraChange?.(newFacingMode)
      }
      onStream?.(stream)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Camera access failed: ${errorMessage}`)
      setHasPermission(false)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setHasPermission(false)
    }
  }

  // video elementのストリーム設定を待機するヘルパー関数
  const waitForVideoReady = async (stream: MediaStream): Promise<void> => {
    return new Promise<void>((resolve) => {
      const checkVideoReady = () => {
        if (videoRef.current && videoRef.current.srcObject === stream) {
          resolve()
        } else {
          setTimeout(checkVideoReady, 10)
        }
      }
      checkVideoReady()
    })
  }

  // ストリーム取得と設定のヘルパー関数
  const createAndSetStream = async (targetFacingMode: 'user' | 'environment'): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: targetFacingMode,
      },
      audio: false,
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    await waitForVideoReady(stream)
    return stream
  }

  const switchCamera = async () => {
    if (!hasPermission) return
    
    const currentFacingMode = facingMode
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    
    try {
      // 既存のストリームを停止
      stopCamera()
      
      // 新しいfacingModeでストリーム取得と設定
      const stream = await createAndSetStream(newFacingMode)

      // 状態更新
      setHasPermission(true)
      setFacingMode(newFacingMode)

      // コールバック実行（順序保証: onStream -> onCameraChange）
      onStream?.(stream)
      onCameraChange?.(newFacingMode)
      
    } catch (err) {
      // カメラ切り替えに失敗した場合、元のfacingModeに戻す
      console.warn('Camera switch failed, reverting to previous mode:', err)
      setError('Camera switch failed. Reverting to previous camera.')
      
      try {
        // 元のfacingModeでカメラを再開（エラーをクリアしないように）
        const stream = await createAndSetStream(currentFacingMode)
        setHasPermission(true)
        onStream?.(stream)
        // facingModeは変更しない（元の値を保持）
        // エラーメッセージは保持（ユーザーに切り替え失敗を知らせるため）
      } catch (revertErr) {
        // 復旧も失敗した場合
        console.error('Failed to revert to previous camera mode:', revertErr)
        setError('Camera access failed completely. Please refresh the page.')
        setHasPermission(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <section className="camera-container" aria-labelledby="camera-controls-heading">
      <div className="camera-controls" role="group" aria-label="Camera controls">
        <button
          onClick={hasPermission ? stopCamera : () => startCamera()}
          disabled={isLoading}
          className="camera-button"
        >
          {isLoading ? 'Loading...' : hasPermission ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        {hasPermission && (
          <button
            onClick={switchCamera}
            disabled={isLoading}
            className="camera-switch-button"
            aria-label={`Switch to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
            title={`Currently using ${facingMode === 'user' ? 'front' : 'rear'} camera. Click to switch.`}
          >
            🔄 Switch Camera
          </button>
        )}
      </div>
      
      {hasPermission && (
        <div 
          className="facing-mode-indicator" 
          data-testid="facing-mode-indicator"
          role="status"
          aria-live="polite"
          aria-label={`Current camera: ${facingMode === 'user' ? 'front facing' : 'rear facing'}`}
        >
          📷 {facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto',
          display: hasPermission ? 'block' : 'none',
        }}
      />
    </section>
  )
}
