import { type FaceLandmark, type FaceRegion, type FaceMeshResults } from '../types/gait'

/**
 * Face Mesh結果から顔領域情報を抽出する
 */
export function extractFaceRegions(results: FaceMeshResults): FaceRegion[] {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    return []
  }

  return results.multiFaceLandmarks.map((landmarks, index) => {
    // 顔の境界ボックスを計算
    const bounds = calculateFaceBounds(landmarks)
    
    // 信頼度は検出されたランドマーク数に基づいて推定
    const confidence = Math.min(1.0, landmarks.length / 468) // 468は標準的なランドマーク数

    return {
      centerX: bounds.centerX,
      centerY: bounds.centerY,
      width: bounds.width,
      height: bounds.height,
      confidence,
      landmarks
    }
  })
}

/**
 * 顔ランドマークから境界ボックスを計算
 */
function calculateFaceBounds(landmarks: FaceLandmark[]): {
  centerX: number
  centerY: number
  width: number
  height: number
} {
  if (landmarks.length === 0) {
    return { centerX: 0.5, centerY: 0.5, width: 0, height: 0 }
  }

  // 最小・最大座標を効率的に計算
  let minX = 1, maxX = 0, minY = 1, maxY = 0

  for (const landmark of landmarks) {
    if (landmark.x < minX) minX = landmark.x
    if (landmark.x > maxX) maxX = landmark.x
    if (landmark.y < minY) minY = landmark.y
    if (landmark.y > maxY) maxY = landmark.y
  }

  const width = maxX - minX
  const height = maxY - minY
  const centerX = minX + width / 2
  const centerY = minY + height / 2

  return { centerX, centerY, width, height }
}

/**
 * 特定の顔部位のランドマーク番号を取得
 */
export const FACE_LANDMARKS = {
  // 目の周り（基本的な位置）
  LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  
  // 口の周り
  LIPS: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
  
  // 鼻
  NOSE_TIP: [1, 2],
  
  // 顎のライン
  JAWLINE: [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323]
} as const

/**
 * 指定した部位のランドマークを取得
 */
export function getFacePart(landmarks: FaceLandmark[], partIndices: readonly number[]): FaceLandmark[] {
  return partIndices
    .filter(index => index < landmarks.length && index >= 0)
    .map(index => landmarks[index])
}

/**
 * 顔の向きを推定（簡易版）
 */
export function estimateFaceOrientation(landmarks: FaceLandmark[]): {
  yaw: number   // 左右の向き（ラジアン）
  pitch: number // 上下の向き（ラジアン）
  roll: number  // 傾き（ラジアン）
} {
  if (landmarks.length < 468) {
    return { yaw: 0, pitch: 0, roll: 0 }
  }

  // 簡易的な顔向き推定（鼻先と目の位置から）
  const noseTip = landmarks[1] // 鼻先
  const leftEye = landmarks[33] // 左目内側
  const rightEye = landmarks[263] // 右目内側

  // 左右の向き（yaw）: 鼻の位置から推定
  const eyeDistance = Math.abs(leftEye.x - rightEye.x)
  const noseToCenterDistance = Math.abs(noseTip.x - (leftEye.x + rightEye.x) / 2)
  const yaw = eyeDistance > 0 ? (noseToCenterDistance / eyeDistance - 0.5) * Math.PI / 2 : 0

  // 上下の向き（pitch）: 鼻と目の高さの関係から推定
  const eyeY = (leftEye.y + rightEye.y) / 2
  const pitch = (noseTip.y - eyeY) * Math.PI

  // 傾き（roll）: 両目の傾きから推定
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)

  return { yaw, pitch, roll }
}

/**
 * 顔領域が十分に大きく、エフェクト適用に適しているかを判定
 */
export function isFaceSuitableForEffects(faceRegion: FaceRegion): boolean {
  const MIN_FACE_SIZE = 0.08 // 画面の8%以上
  const MIN_CONFIDENCE = 0.7 // 信頼度70%以上
  
  const faceArea = faceRegion.width * faceRegion.height
  
  return faceArea >= MIN_FACE_SIZE && faceRegion.confidence >= MIN_CONFIDENCE
}