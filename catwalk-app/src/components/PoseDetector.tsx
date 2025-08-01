import { useEffect, useRef, useState } from 'react'
import { Pose, type Results, POSE_CONNECTIONS } from '@mediapipe/pose'
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'

interface PoseDetectorProps {
  videoElement?: HTMLVideoElement
  onResults?: (results: Results) => void
}

export function PoseDetector({ videoElement, onResults }: PoseDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pose, setPose] = useState<Pose | null>(null)
  const [camera, setCamera] = useState<MediaPipeCamera | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MediaPipe Poseを初期化
  useEffect(() => {
    const initializePose = async () => {
      try {
        const poseInstance = new Pose({
          locateFile: file => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          },
        })

        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        poseInstance.onResults((results: Results) => {
          if (canvasRef.current) {
            const canvasElement = canvasRef.current
            const canvasCtx = canvasElement.getContext('2d')!

            canvasCtx.save()
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)

            // 姿勢のランドマークを描画
            if (results.poseLandmarks) {
              drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2,
              })
              drawLandmarks(canvasCtx, results.poseLandmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 2,
              })
            }

            canvasCtx.restore()
          }

          onResults?.(results)
        })

        await poseInstance.initialize()
        setPose(poseInstance)
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pose initialization failed')
      }
    }

    initializePose()

    return () => {
      pose?.close()
    }
    // onResultsは親コンポーネントから渡されるが、初期化時のみ設定すればよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // カメラストリームを設定
  useEffect(() => {
    if (pose && videoElement && isInitialized) {
      try {
        const cameraInstance = new MediaPipeCamera(videoElement, {
          onFrame: async () => {
            if (canvasRef.current) {
              canvasRef.current.width = videoElement.videoWidth
              canvasRef.current.height = videoElement.videoHeight
            }
            await pose.send({ image: videoElement })
          },
          width: 640,
          height: 480,
        })

        setCamera(cameraInstance)
        cameraInstance.start()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Camera setup failed')
      }
    }

    return () => {
      camera?.stop()
    }
  }, [pose, videoElement, isInitialized, camera])

  if (error) {
    return (
      <div className="pose-detector-error" role="alert">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="pose-detector">
      <canvas
        ref={canvasRef}
        className="pose-canvas"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto',
          border: '1px solid #ccc',
        }}
      />
      {!isInitialized && <div className="pose-loading">Initializing pose detection...</div>}
    </div>
  )
}
