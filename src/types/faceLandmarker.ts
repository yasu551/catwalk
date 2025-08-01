// MediaPipe Face Landmarker types for the new @mediapipe/tasks-vision API

export interface FaceLandmarkerResults {
  faceLandmarks: Array<Array<{x: number, y: number, z: number}>>
  faceBlendshapes?: Array<Array<{categoryName: string, score: number}>>
  facialTransformationMatrixes?: Array<Array<number>>
  image?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
}

export interface FaceLandmarkerProps {
  videoElement?: HTMLVideoElement
  onResults?: (results: FaceLandmarkerResults) => void
  numFaces?: number
  minFaceDetectionConfidence?: number
  outputFaceBlendshapes?: boolean
  runningMode?: 'IMAGE' | 'VIDEO'
}

// Normalized landmark from MediaPipe Tasks Vision
export interface NormalizedLandmark {
  x: number
  y: number
  z: number
}

// Face blendshape from MediaPipe Tasks Vision
export interface FaceBlendshape {
  categoryName: string
  score: number
}

// Face landmarks result structure
export interface FaceLandmarks {
  landmarks: NormalizedLandmark[]
}

// Configuration options for Face Landmarker
export interface FaceLandmarkerOptions {
  baseOptions: {
    modelAssetPath: string
    delegate?: 'CPU' | 'GPU'
  }
  runningMode: 'IMAGE' | 'VIDEO'
  numFaces?: number
  minFaceDetectionConfidence?: number
  minFacePresenceConfidence?: number
  minTrackingConfidence?: number
  outputFaceBlendshapes?: boolean
  outputFacialTransformationMatrixes?: boolean
}