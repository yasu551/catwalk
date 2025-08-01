import { useState, useEffect } from 'react'
import { Camera } from './components/Camera'
import { PoseDetector } from './components/PoseDetector'
import { TrajectoryVisualization } from './components/TrajectoryVisualization'
import { GaitClassificationDisplay } from './components/GaitClassificationDisplay'
import { globalTrajectoryTracker } from './utils/trajectoryTracker'
import { classifyGaitPattern } from './utils/gaitAnalysis'
import { type GaitClassification } from './types/gait'
import './App.css'

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [gaitClassification, setGaitClassification] = useState<GaitClassification | null>(null)

  const handleStream = (newStream: MediaStream) => {
    setStream(newStream)
    // Get video element reference from Camera component
    const video = document.querySelector('video') as HTMLVideoElement
    setVideoElement(video)
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
    <div className="app">
      <header className="app-header">
        <h1>歩行分析アプリ - Catwalk</h1>
        <p>カメラで歩行を撮影し、キャットウォークか酔歩かを判定します</p>
      </header>

      <main className="app-main">
        <div className="camera-section">
          <h2>カメラ映像</h2>
          <Camera onStream={handleStream} />
        </div>

        {stream && videoElement && (
          <>
            <div className="pose-section">
              <h2>姿勢検出</h2>
              <PoseDetector videoElement={videoElement} />
            </div>

            <div className="trajectory-section">
              <h2>歩行軌跡分析</h2>
              <TrajectoryVisualization 
                width={600} 
                height={400} 
                className="trajectory-visualization-main"
              />
            </div>

            <div className="classification-section">
              <h2>歩行パターン判定</h2>
              {gaitClassification ? (
                <GaitClassificationDisplay 
                  classification={gaitClassification}
                  showAnimation={true}
                  showDetails={true}
                  className="gait-classification-main"
                />
              ) : (
                <div className="classification-loading">
                  <p>歩行データを収集中...</p>
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
