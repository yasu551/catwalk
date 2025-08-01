import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { type FaceLandmarkerResults, type FaceLandmarkerProps } from '../types/faceLandmarker'

export function FaceLandmarkerDetector({ 
  videoElement, 
  onResults,
  numFaces = 1,
  minFaceDetectionConfidence = 0.5,
  outputFaceBlendshapes = false,
  runningMode = 'VIDEO'
}: FaceLandmarkerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initialized = useRef(false)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MediaPipe Face Landmarkerを初期化
  useEffect(() => {
    if (initialized.current) {
      console.log('FaceLandmarkerDetector: Already initialized, skipping')
      return
    }

    console.log('FaceLandmarkerDetector: Starting initialization')
    initialized.current = true

    const initializeFaceLandmarker = async () => {
      try {
        setError(null)
        
        console.log('FaceLandmarkerDetector: Creating FilesetResolver')
        
        // FilesetResolverでWASMファイルを設定
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        console.log('FaceLandmarkerDetector: Creating FaceLandmarker instance')
        
        // FaceLandmarkerを作成
        const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: outputFaceBlendshapes,
          runningMode: runningMode,
          numFaces: Math.min(numFaces, 3), // 最大3に制限（パフォーマンス向上）
          minFaceDetectionConfidence: Math.max(minFaceDetectionConfidence, 0.5),
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        console.log('FaceLandmarkerDetector: Initialization completed successfully')
        setFaceLandmarker(faceLandmarkerInstance)
        setIsInitialized(true)
      } catch (err) {
        console.error('FaceLandmarkerDetector: Initialization failed:', err)
        initialized.current = false
        const errorMessage = err instanceof Error ? err.message : 'Face Landmarker initialization failed'
        setError(errorMessage)
      }
    }

    initializeFaceLandmarker()

    return () => {
      if (initialized.current) {
        faceLandmarker?.close()
        initialized.current = false
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [numFaces, minFaceDetectionConfidence, outputFaceBlendshapes, runningMode])

  // ビデオフレーム処理
  useEffect(() => {
    if (faceLandmarker && videoElement && isInitialized && canvasRef.current) {
      const processVideoFrame = () => {
        if (!faceLandmarker || !videoElement || !canvasRef.current) {
          return
        }

        try {
          // ビデオフレームを処理
          const results = faceLandmarker.detectForVideo(videoElement, performance.now())
          
          const canvasElement = canvasRef.current
          const canvasCtx = canvasElement.getContext('2d')!
          
          // キャンバスサイズを調整
          canvasElement.width = videoElement.videoWidth
          canvasElement.height = videoElement.videoHeight

          // キャンバスをクリア
          canvasCtx.save()
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
          canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

          // 顔ランドマークを描画
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            for (const landmarks of results.faceLandmarks) {
              // ランドマークを手動で描画
              canvasCtx.fillStyle = '#FF0000'
              for (const landmark of landmarks) {
                const x = landmark.x * canvasElement.width
                const y = landmark.y * canvasElement.height
                canvasCtx.beginPath()
                canvasCtx.arc(x, y, 1, 0, 2 * Math.PI)
                canvasCtx.fill()
              }
              
              // 顔の輪郭を手動で描画
              const connections = [
                [10, 338], [338, 297], [297, 332], [332, 284],
                [284, 251], [251, 389], [389, 356], [356, 454],
                [454, 323], [323, 361], [361, 288], [288, 397]
              ]
              
              canvasCtx.strokeStyle = '#C0C0C070'
              canvasCtx.lineWidth = 1
              for (const [start, end] of connections) {
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
            }
          }

          canvasCtx.restore()

          // 結果をコールバックに渡す
          if (onResults) {
            const faceLandmarkerResults: FaceLandmarkerResults = {
              faceLandmarks: results.faceLandmarks || [],
              faceBlendshapes: undefined, // Simplified for now - can be enhanced later
              facialTransformationMatrixes: undefined, // Simplified for now - can be enhanced later
              image: videoElement
            }
            onResults(faceLandmarkerResults)
          }
        } catch (err) {
          console.error('FaceLandmarkerDetector: Frame processing error:', err)
        }

        // 次のフレームを処理
        animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      }

      // フレーム処理を開始
      processVideoFrame()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [faceLandmarker, videoElement, isInitialized, onResults])

  if (error) {
    return (
      <div className="face-landmarker-detector-error" role="alert">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="face-landmarker-detector">
      <canvas
        ref={canvasRef}
        className="face-landmarker-canvas"
        role="img"
        aria-label="Face landmark detection visualization"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto',
          border: '1px solid #ccc',
        }}
      />
      {!isInitialized && (
        <div className="face-landmarker-loading">Initializing face landmark detection...</div>
      )}
    </div>
  )
}

export default FaceLandmarkerDetector