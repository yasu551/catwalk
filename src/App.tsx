import { useState, useEffect } from 'react'
import { Camera } from './components/Camera'
import { PoseLandmarkerDetector } from './components/PoseLandmarkerDetector'
import { TrajectoryVisualization } from './components/TrajectoryVisualization'
import { GaitClassificationDisplay } from './components/GaitClassificationDisplay'
import { ErrorBoundary } from './components/ErrorBoundary'
import { globalTrajectoryTracker } from './utils/trajectoryTracker'
import { classifyGaitPattern } from './utils/gaitAnalysis'
import { type GaitClassification } from './types/gait'
import './App.css'

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [gaitClassification, setGaitClassification] = useState<GaitClassification | null>(null)

  // 統合されたストリーム更新ハンドラー
  const handleStreamAndCameraChange = async (
    stream: MediaStream, 
    facingMode?: 'user' | 'environment'
  ) => {
    setStream(stream)
    
    // video element更新を待機（非同期処理のタイミング対応）
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const video = document.querySelector('video')
    if (video) {
      // video elementが見つかった場合は常に設定（streamの確認は一度だけ）
      setVideoElement(video as HTMLVideoElement)
      
      if (facingMode) {
        console.log('Camera switched to:', facingMode)
      }
      
      // streamが設定されていない場合のみ警告
      if (video.srcObject !== stream) {
        console.warn('Video element stream not yet set, but element found')
      }
    } else {
      // video elementが見つからない場合の警告
      console.warn('Video element not found or stream not set:', { 
        videoFound: false, 
        streamSet: false
      })
    }
  }

  const handleStream = (newStream: MediaStream) => {
    handleStreamAndCameraChange(newStream)
  }

  const handleCameraChange = (facingMode: 'user' | 'environment') => {
    // カメラ切り替え時は既存のstreamを保持しつつvideo elementを更新
    if (stream) {
      handleStreamAndCameraChange(stream, facingMode)
    } else {
      console.warn('Camera change requested but no stream available')
    }
  }

  // リアルタイム歩行分析の更新（最適化版）
  useEffect(() => {
    if (!stream) return

    let lastAnalysisTime = 0
    const ANALYSIS_THROTTLE = 800 // 800msに短縮（応答性向上）
    
    const updateGaitClassification = () => {
      const currentTime = Date.now()
      
      // スロットリング（CPU負荷軽減）
      if (currentTime - lastAnalysisTime < ANALYSIS_THROTTLE) {
        return
      }
      
      const trajectory = globalTrajectoryTracker.getRecentCenterOfGravity(15) // 20→15に削減（処理軽量化）
      if (trajectory.length >= 5) {
        const classification = classifyGaitPattern(trajectory)
        setGaitClassification(classification)
        lastAnalysisTime = currentTime
      }
    }

    // より頻繁な更新間隔（応答性向上）
    const interval = setInterval(updateGaitClassification, 600) // 1000→600msに短縮

    return () => clearInterval(interval)
  }, [stream])

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>歩行分析アプリ - Catwalk</h1>
          <p>カメラで歩行を撮影し、キャットウォークか酔歩かを判定します</p>
        </header>

        <main className="app-main" role="main">
        <section className="camera-section" aria-labelledby="camera-heading">
          <h2 id="camera-heading">カメラ映像</h2>
          <Camera onStream={handleStream} onCameraChange={handleCameraChange} />
        </section>

        {stream && videoElement && (
          <>
            <section className="pose-section" aria-labelledby="pose-heading">
              <h2 id="pose-heading">姿勢検出</h2>
              <PoseLandmarkerDetector videoElement={videoElement} />
            </section>

            <section className="trajectory-section" aria-labelledby="trajectory-heading">
              <h2 id="trajectory-heading">歩行軌跡分析</h2>
              <TrajectoryVisualization 
                width={600} 
                height={400} 
                className="trajectory-visualization-main"
              />
            </section>

            <section className="classification-section" aria-labelledby="classification-heading">
              <h2 id="classification-heading">歩行パターン判定</h2>
              {gaitClassification ? (
                <GaitClassificationDisplay 
                  classification={gaitClassification}
                  showAnimation={true}
                  showDetails={true}
                  className="gait-classification-main"
                />
              ) : (
                <div className="classification-loading" role="status" aria-live="polite">
                  <p>歩行データを収集中...</p>
                  <div className="loading-indicator" aria-hidden="true">
                    <div className="spinner"></div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
