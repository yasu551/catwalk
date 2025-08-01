import { useEffect, useRef, useState } from 'react'
import { FaceMesh, type Results } from '@mediapipe/face_mesh'
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh'
import { type FaceMeshResults } from '../types/gait'

interface FaceMeshDetectorProps {
  videoElement?: HTMLVideoElement
  onResults?: (results: FaceMeshResults) => void
  maxNumFaces?: number
  refineLandmarks?: boolean
  minDetectionConfidence?: number
  minTrackingConfidence?: number
}

export function FaceMeshDetector({ 
  videoElement, 
  onResults,
  maxNumFaces = 1,
  refineLandmarks = true,
  minDetectionConfidence = 0.5,
  minTrackingConfidence = 0.5
}: FaceMeshDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [faceMesh, setFaceMesh] = useState<FaceMesh | null>(null)
  const [camera, setCamera] = useState<MediaPipeCamera | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MediaPipe Face Meshを初期化
  useEffect(() => {
    const initializeFaceMesh = async () => {
      try {
        setError(null)
        
        const faceMeshInstance = new FaceMesh({
          locateFile: file => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          },
        })

        // 精度向上のための最適化設定
        faceMeshInstance.setOptions({
          maxNumFaces: Math.min(maxNumFaces, 3), // 最大3に制限（パフォーマンス向上）
          refineLandmarks: refineLandmarks,
          minDetectionConfidence: Math.max(minDetectionConfidence, 0.6), // 最小0.6に引き上げ
          minTrackingConfidence: Math.max(minTrackingConfidence, 0.6), // 最小0.6に引き上げ
        })

        faceMeshInstance.onResults((results: Results) => {
          if (canvasRef.current) {
            const canvasElement = canvasRef.current
            const canvasCtx = canvasElement.getContext('2d')!

            canvasCtx.save()
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)

            // 顔メッシュを描画
            if (results.multiFaceLandmarks) {
              for (const landmarks of results.multiFaceLandmarks) {
                drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
                  color: '#C0C0C070',
                  lineWidth: 1,
                })
                drawLandmarks(canvasCtx, landmarks, {
                  color: '#FF0000',
                  lineWidth: 1,
                  radius: 1,
                })
              }
            }

            canvasCtx.restore()
          }

          // 結果をコールバックに渡す
          if (onResults) {
            const faceMeshResults: FaceMeshResults = {
              multiFaceLandmarks: results.multiFaceLandmarks,
              image: results.image as HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
            }
            onResults(faceMeshResults)
          }
        })

        await faceMeshInstance.initialize()
        setFaceMesh(faceMeshInstance)
        setIsInitialized(true)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Face Mesh initialization failed'
        setError(errorMessage)
      }
    }

    initializeFaceMesh()

    return () => {
      faceMesh?.close()
    }
  }, [faceMesh, maxNumFaces, refineLandmarks, minDetectionConfidence, minTrackingConfidence, onResults])

  // カメラストリームを設定
  useEffect(() => {
    if (faceMesh && videoElement && isInitialized) {
      try {
        const cameraInstance = new MediaPipeCamera(videoElement, {
          onFrame: async () => {
            if (canvasRef.current) {
              canvasRef.current.width = videoElement.videoWidth
              canvasRef.current.height = videoElement.videoHeight
            }
            await faceMesh.send({ image: videoElement })
          },
          width: 640,
          height: 480,
        })

        setCamera(cameraInstance)
        cameraInstance.start()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Camera setup failed'
        setError(errorMessage)
      }
    }

    return () => {
      camera?.stop()
    }
  }, [faceMesh, videoElement, isInitialized, camera])

  if (error) {
    return (
      <div className="face-mesh-detector-error" role="alert">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="face-mesh-detector">
      <canvas
        ref={canvasRef}
        className="face-mesh-canvas"
        role="img"
        aria-label="Face mesh detection visualization"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto',
          border: '1px solid #ccc',
        }}
      />
      {!isInitialized && (
        <div className="face-mesh-loading">Initializing face detection...</div>
      )}
    </div>
  )
}

export default FaceMeshDetector