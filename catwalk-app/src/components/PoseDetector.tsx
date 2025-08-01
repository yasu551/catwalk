import { useEffect, useRef, useState } from 'react'
import type { Pose, Results } from '@mediapipe/pose'
import type { Camera as MediaPipeCamera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { calculateCenterOfGravity } from '../utils/centerOfGravity'
import { globalTrajectoryTracker } from '../utils/trajectoryTracker'
import { type PoseLandmark } from '../types/gait'
import { POSE_CONNECTIONS } from '../constants/poseConnections'

interface PoseDetectorProps {
  videoElement?: HTMLVideoElement
  onResults?: (results: Results) => void
}

export function PoseDetector({ videoElement, onResults }: PoseDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initialized = useRef(false)
  const [pose, setPose] = useState<Pose | null>(null)
  const [camera, setCamera] = useState<MediaPipeCamera | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MediaPipe Poseを初期化
  useEffect(() => {
    if (initialized.current) {
      console.log('PoseDetector: Already initialized, skipping')
      return
    }

    console.log('PoseDetector: Starting initialization')
    initialized.current = true

    const initializePose = async () => {
      try {
        console.log('PoseDetector: Creating Pose instance')
        
        // Poseクラスを動的インポート
        const { Pose } = await import('@mediapipe/pose')
        
        // タイムアウト付きで初期化
        const poseInstance = await Promise.race([
          new Promise<Pose>((resolve) => {
            const pose = new Pose({
              locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
              },
            })
            resolve(pose)
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Pose initialization timeout')), 10000)
          })
        ])

        console.log('PoseDetector: Setting options')
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

              // 重心計算と軌跡追跡
              try {
                // MediaPipeの結果をPoseLandmark形式に変換
                const landmarks: PoseLandmark[] = results.poseLandmarks.map(landmark => ({
                  x: landmark.x,
                  y: landmark.y,
                  z: landmark.z,
                  visibility: landmark.visibility
                }))

                // 重心を計算
                const cog = calculateCenterOfGravity(landmarks, Date.now())
                
                // 軌跡トラッカーに追加
                globalTrajectoryTracker.addCenterOfGravity(cog)

                // 重心位置をキャンバスに描画
                const cogX = cog.x * canvasElement.width
                const cogY = cog.y * canvasElement.height
                
                canvasCtx.beginPath()
                canvasCtx.arc(cogX, cogY, 8, 0, 2 * Math.PI)
                canvasCtx.fillStyle = '#00FFFF' // シアン色で重心を表示
                canvasCtx.fill()
                canvasCtx.strokeStyle = '#000000'
                canvasCtx.lineWidth = 2
                canvasCtx.stroke()
              } catch (error) {
                // 重心計算に失敗した場合は無視（信頼度が低い等）
                console.debug('Center of gravity calculation failed:', error)
              }
            }

            canvasCtx.restore()
          }

          onResults?.(results)
        })

        console.log('PoseDetector: Initializing pose instance')
        await poseInstance.initialize()
        
        console.log('PoseDetector: Initialization completed successfully')
        setPose(poseInstance)
        setIsInitialized(true)
      } catch (err) {
        console.error('PoseDetector: Initialization failed:', err)
        initialized.current = false
        setError(err instanceof Error ? err.message : 'Pose initialization failed')
      }
    }

    initializePose()

    return () => {
      if (initialized.current) {
        pose?.close()
        initialized.current = false
      }
    }
    // onResultsは親コンポーネントから渡されるが、初期化時のみ設定すればよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // カメラストリームを設定
  useEffect(() => {
    if (pose && videoElement && isInitialized) {
      const setupCamera = async () => {
        try {
          const { Camera } = await import('@mediapipe/camera_utils')
          const cameraInstance = new Camera(videoElement, {
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

      setupCamera()
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
