import { useEffect, useRef, useState } from 'react'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { calculateCenterOfGravity } from '../utils/centerOfGravity'
import { globalTrajectoryTracker } from '../utils/trajectoryTracker'
import { type PoseLandmark } from '../types/gait'
import { type PoseLandmarkerResults, type PoseLandmarkerProps, POSE_CONNECTIONS } from '../types/poseLandmarker'

export function PoseLandmarkerDetector({ 
  videoElement, 
  onResults,
  numPoses = 1,
  minPoseDetectionConfidence = 0.5,
  minPosePresenceConfidence = 0.5,
  minTrackingConfidence = 0.5,
  outputSegmentationMasks = false,
  runningMode = 'VIDEO'
}: PoseLandmarkerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initialized = useRef(false)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MediaPipe Pose Landmarkerを初期化
  useEffect(() => {
    if (initialized.current) {
      console.log('PoseLandmarkerDetector: Already initialized, skipping')
      return
    }

    console.log('PoseLandmarkerDetector: Starting initialization')
    initialized.current = true

    const initializePoseLandmarker = async () => {
      try {
        setError(null)
        
        console.log('PoseLandmarkerDetector: Creating FilesetResolver')
        
        // FilesetResolverでWASMファイルを設定
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        console.log('PoseLandmarkerDetector: Creating PoseLandmarker instance')
        
        // PoseLandmarkerを作成
        const poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: runningMode,
          numPoses: Math.min(numPoses, 2), // 最大2に制限（パフォーマンス向上）
          minPoseDetectionConfidence: minPoseDetectionConfidence,
          minPosePresenceConfidence: minPosePresenceConfidence,
          minTrackingConfidence: minTrackingConfidence,
          outputSegmentationMasks: outputSegmentationMasks
        });
        
        console.log('PoseLandmarkerDetector: Initialization completed successfully')
        setPoseLandmarker(poseLandmarkerInstance)
        setIsInitialized(true)
      } catch (err) {
        console.error('PoseLandmarkerDetector: Initialization failed:', err)
        initialized.current = false
        const errorMessage = err instanceof Error ? err.message : 'Pose Landmarker initialization failed'
        setError(errorMessage)
      }
    }

    initializePoseLandmarker()

    return () => {
      if (initialized.current) {
        poseLandmarker?.close()
        initialized.current = false
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [numPoses, minPoseDetectionConfidence, minPosePresenceConfidence, minTrackingConfidence, outputSegmentationMasks, runningMode])

  // ビデオフレーム処理 (videoElement変更時の再初期化対応)
  useEffect(() => {
    // 既存のanimation frameをクリーンアップ（video element変更時）
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    if (poseLandmarker && videoElement && isInitialized && canvasRef.current) {
      console.log('PoseLandmarkerDetector: Starting frame processing with new video element')
      
      const processVideoFrame = () => {
        if (!poseLandmarker || !videoElement || !canvasRef.current) {
          return
        }

        try {
          // ビデオフレームを処理
          const results = poseLandmarker.detectForVideo(videoElement, performance.now())
          
          const canvasElement = canvasRef.current
          const canvasCtx = canvasElement.getContext('2d')!
          
          // キャンバスサイズを調整
          canvasElement.width = videoElement.videoWidth
          canvasElement.height = videoElement.videoHeight

          // キャンバスをクリア
          canvasCtx.save()
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
          canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

          // 姿勢ランドマークを描画
          if (results.landmarks && results.landmarks.length > 0) {
            for (const landmarks of results.landmarks) {
              // ランドマークを手動で描画
              canvasCtx.fillStyle = '#FF0000'
              for (const landmark of landmarks) {
                const x = landmark.x * canvasElement.width
                const y = landmark.y * canvasElement.height
                canvasCtx.beginPath()
                canvasCtx.arc(x, y, 2, 0, 2 * Math.PI)
                canvasCtx.fill()
              }
              
              // 接続線を手動で描画
              canvasCtx.strokeStyle = '#00FF00'
              canvasCtx.lineWidth = 2
              for (const [start, end] of POSE_CONNECTIONS) {
                if (landmarks[start] && landmarks[end]) {
                  canvasCtx.beginPath()
                  canvasCtx.moveTo(
                    landmarks[start].x * canvasElement.width,
                    landmarks[start].y * canvasElement.height
                  )
                  canvasCtx.lineTo(
                    landmarks[end].x * canvasElement.width,
                    landmarks[end].y * canvasElement.height
                  )
                  canvasCtx.stroke()
                }
              }

              // 重心計算と軌跡追跡
              try {
                // MediaPipeの結果をPoseLandmark形式に変換
                const poseLandmarks: PoseLandmark[] = landmarks.map(landmark => ({
                  x: landmark.x,
                  y: landmark.y,
                  z: landmark.z,
                  visibility: landmark.visibility
                }))

                // 重心を計算
                const cog = calculateCenterOfGravity(poseLandmarks, Date.now())
                
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
          }

          canvasCtx.restore()

          // 結果をコールバックに渡す
          if (onResults) {
            const poseLandmarkerResults: PoseLandmarkerResults = {
              landmarks: results.landmarks || [],
              worldLandmarks: results.worldLandmarks,
              segmentationMasks: results.segmentationMasks,
              image: videoElement
            }
            onResults(poseLandmarkerResults)
          }
        } catch (err) {
          console.error('PoseLandmarkerDetector: Frame processing error:', err)
        }

        // 次のフレームを処理
        animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      }

      // フレーム処理を開始
      processVideoFrame()
    } else if (!videoElement) {
      console.log('PoseLandmarkerDetector: Video element is null, stopping frame processing')
    }

    return () => {
      if (animationFrameRef.current) {
        console.log('PoseLandmarkerDetector: Cleaning up animation frame')
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    }
  }, [poseLandmarker, videoElement, isInitialized, onResults])

  if (error) {
    return (
      <div className="pose-landmarker-detector-error" role="alert">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="pose-landmarker-detector">
      <canvas
        ref={canvasRef}
        className="pose-landmarker-canvas"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto',
          border: '1px solid #ccc',
        }}
      />
      {!isInitialized && (
        <div className="pose-landmarker-loading">Initializing pose landmark detection...</div>
      )}
    </div>
  )
}

export default PoseLandmarkerDetector