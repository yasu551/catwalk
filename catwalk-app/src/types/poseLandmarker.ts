// MediaPipe Pose Landmarker types for the new @mediapipe/tasks-vision API

export interface PoseLandmarkerResults {
  landmarks: Array<Array<{x: number, y: number, z: number}>>
  worldLandmarks?: Array<Array<{x: number, y: number, z: number}>>
  segmentationMasks?: any[] // Using any for now due to MediaPipe's MPMask type
  image?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
}

export interface PoseLandmarkerProps {
  videoElement?: HTMLVideoElement
  onResults?: (results: PoseLandmarkerResults) => void
  numPoses?: number
  minPoseDetectionConfidence?: number
  minPosePresenceConfidence?: number
  minTrackingConfidence?: number
  outputSegmentationMasks?: boolean
  runningMode?: 'IMAGE' | 'VIDEO'
}

// Normalized landmark from MediaPipe Tasks Vision
export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

// World landmark from MediaPipe Tasks Vision (3D coordinates in meters)
export interface WorldLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

// Configuration options for Pose Landmarker
export interface PoseLandmarkerOptions {
  baseOptions: {
    modelAssetPath: string
    delegate?: 'CPU' | 'GPU'
  }
  runningMode: 'IMAGE' | 'VIDEO'
  numPoses?: number
  minPoseDetectionConfidence?: number
  minPosePresenceConfidence?: number
  minTrackingConfidence?: number
  outputSegmentationMasks?: boolean
}

// Pose connections for drawing
export const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
] as const