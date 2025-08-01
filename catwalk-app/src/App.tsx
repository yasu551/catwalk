import { useState } from 'react'
import { Camera } from './components/Camera'
import { PoseDetector } from './components/PoseDetector'
import './App.css'

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const handleStream = (newStream: MediaStream) => {
    setStream(newStream)
    // Get video element reference from Camera component
    const video = document.querySelector('video') as HTMLVideoElement
    setVideoElement(video)
  }

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
          <div className="pose-section">
            <h2>姿勢検出</h2>
            <PoseDetector videoElement={videoElement} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
