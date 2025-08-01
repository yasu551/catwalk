import { useEffect, useRef, useState } from 'react'

interface CameraProps {
  onStream?: (stream: MediaStream) => void
}

export function Camera({ onStream }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setHasPermission(true)
      onStream?.(stream)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Camera access failed: ${errorMessage}`)
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

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="camera-container">
      <div className="camera-controls">
        <button
          onClick={hasPermission ? stopCamera : startCamera}
          disabled={isLoading}
          className="camera-button"
        >
          {isLoading ? 'Loading...' : hasPermission ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>

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
    </div>
  )
}
