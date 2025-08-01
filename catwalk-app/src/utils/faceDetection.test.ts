import { describe, it, expect } from 'vitest'
import { 
  extractFaceRegions, 
  getFacePart, 
  estimateFaceOrientation, 
  isFaceSuitableForEffects,
  FACE_LANDMARKS 
} from './faceDetection'
import { type FaceLandmark, type FaceMeshResults } from '../types/gait'

describe('Face Detection Utils', () => {
  // テスト用のモックランドマークデータを作成
  const createMockLandmarks = (count: number = 468): FaceLandmark[] => {
    const landmarks: FaceLandmark[] = []
    
    for (let i = 0; i < count; i++) {
      // 顔の形に近似した座標を生成
      const angle = (i / count) * 2 * Math.PI
      const radiusX = 0.15 + Math.random() * 0.05
      const radiusY = 0.2 + Math.random() * 0.05
      
      landmarks.push({
        x: 0.5 + radiusX * Math.cos(angle),
        y: 0.5 + radiusY * Math.sin(angle),
        z: Math.random() * 0.1 - 0.05
      })
    }
    
    return landmarks
  }

  const createMockVideoElement = (): HTMLVideoElement => {
    const video = document.createElement('video')
    Object.defineProperty(video, 'videoWidth', { value: 640, writable: false })
    Object.defineProperty(video, 'videoHeight', { value: 480, writable: false })
    return video
  }

  // 🔴 RED: 顔領域抽出のテスト
  it('should extract face regions from Face Mesh results', () => {
    const mockLandmarks = createMockLandmarks()
    const mockResults: FaceMeshResults = {
      multiFaceLandmarks: [mockLandmarks],
      image: createMockVideoElement()
    }

    const regions = extractFaceRegions(mockResults)

    expect(regions).toHaveLength(1)
    expect(regions[0]).toHaveProperty('centerX')
    expect(regions[0]).toHaveProperty('centerY')
    expect(regions[0]).toHaveProperty('width')
    expect(regions[0]).toHaveProperty('height')
    expect(regions[0]).toHaveProperty('confidence')
    expect(regions[0]).toHaveProperty('landmarks')

    // 座標が正規化範囲内にあることを確認
    expect(regions[0].centerX).toBeGreaterThanOrEqual(0)
    expect(regions[0].centerX).toBeLessThanOrEqual(1)
    expect(regions[0].centerY).toBeGreaterThanOrEqual(0)
    expect(regions[0].centerY).toBeLessThanOrEqual(1)

    // 信頼度が妥当であることを確認
    expect(regions[0].confidence).toBeGreaterThan(0)
    expect(regions[0].confidence).toBeLessThanOrEqual(1)
  })

  // 🔴 RED: 複数顔検出のテスト
  it('should handle multiple faces in results', () => {
    const mockLandmarks1 = createMockLandmarks()
    const mockLandmarks2 = createMockLandmarks()
    
    const mockResults: FaceMeshResults = {
      multiFaceLandmarks: [mockLandmarks1, mockLandmarks2],
      image: createMockVideoElement()
    }

    const regions = extractFaceRegions(mockResults)

    expect(regions).toHaveLength(2)
    expect(regions[0].landmarks).toEqual(mockLandmarks1)
    expect(regions[1].landmarks).toEqual(mockLandmarks2)
  })

  // 🔴 RED: 空の結果処理のテスト
  it('should handle empty Face Mesh results', () => {
    const mockResults: FaceMeshResults = {
      multiFaceLandmarks: [],
      image: createMockVideoElement()
    }

    const regions = extractFaceRegions(mockResults)
    expect(regions).toHaveLength(0)

    // undefined の場合もテスト
    const emptyResults: FaceMeshResults = {
      multiFaceLandmarks: undefined,
      image: createMockVideoElement()
    }

    const emptyRegions = extractFaceRegions(emptyResults)
    expect(emptyRegions).toHaveLength(0)
  })

  // 🔴 RED: 顔部位抽出のテスト
  it('should extract specific face parts correctly', () => {
    const mockLandmarks = createMockLandmarks()
    
    // 左目のランドマークを取得
    const leftEyeLandmarks = getFacePart(mockLandmarks, FACE_LANDMARKS.LEFT_EYE)
    
    expect(leftEyeLandmarks).toHaveLength(FACE_LANDMARKS.LEFT_EYE.length)
    expect(leftEyeLandmarks[0]).toEqual(mockLandmarks[FACE_LANDMARKS.LEFT_EYE[0]])

    // 口のランドマークを取得
    const lipsLandmarks = getFacePart(mockLandmarks, FACE_LANDMARKS.LIPS)
    expect(lipsLandmarks).toHaveLength(FACE_LANDMARKS.LIPS.length)
  })

  // 🔴 RED: 無効インデックス処理のテスト
  it('should handle invalid landmark indices gracefully', () => {
    const mockLandmarks = createMockLandmarks(100) // 少ないランドマーク数
    
    // 範囲外のインデックスを含む部位を要求
    const invalidIndices = [50, 200, 300, 500] // 一部が範囲外
    const results = getFacePart(mockLandmarks, invalidIndices)
    
    // 有効なインデックスのみが返されることを確認
    expect(results).toHaveLength(1) // インデックス50のみ有効
    expect(results[0]).toEqual(mockLandmarks[50])
  })

  // 🔴 RED: 顔向き推定のテスト
  it('should estimate face orientation correctly', () => {
    const mockLandmarks = createMockLandmarks()
    
    const orientation = estimateFaceOrientation(mockLandmarks)
    
    expect(orientation).toHaveProperty('yaw')
    expect(orientation).toHaveProperty('pitch')
    expect(orientation).toHaveProperty('roll')

    // 角度が妥当な範囲内にあることを確認
    expect(Math.abs(orientation.yaw)).toBeLessThanOrEqual(Math.PI)
    expect(Math.abs(orientation.pitch)).toBeLessThanOrEqual(Math.PI)
    expect(Math.abs(orientation.roll)).toBeLessThanOrEqual(Math.PI)
  })

  // 🔴 RED: 不十分なランドマークでの向き推定テスト
  it('should handle insufficient landmarks for orientation estimation', () => {
    const fewLandmarks = createMockLandmarks(100) // 標準の468より少ない
    
    const orientation = estimateFaceOrientation(fewLandmarks)
    
    // デフォルト値が返されることを確認
    expect(orientation.yaw).toBe(0)
    expect(orientation.pitch).toBe(0)
    expect(orientation.roll).toBe(0)
  })

  // 🔴 RED: エフェクト適用適性判定のテスト
  it('should correctly determine if face is suitable for effects', () => {
    // 大きくて信頼度の高い顔
    const largeFace = {
      centerX: 0.5,
      centerY: 0.5,
      width: 0.3,
      height: 0.4,
      confidence: 0.85,
      landmarks: createMockLandmarks()
    }

    expect(isFaceSuitableForEffects(largeFace)).toBe(true)

    // 小さすぎる顔
    const smallFace = {
      centerX: 0.5,
      centerY: 0.5,
      width: 0.05,
      height: 0.05,
      confidence: 0.9,
      landmarks: createMockLandmarks()
    }

    expect(isFaceSuitableForEffects(smallFace)).toBe(false)

    // 信頼度が低い顔
    const lowConfidenceFace = {
      centerX: 0.5,
      centerY: 0.5,
      width: 0.2,
      height: 0.3,
      confidence: 0.5,
      landmarks: createMockLandmarks()
    }

    expect(isFaceSuitableForEffects(lowConfidenceFace)).toBe(false)
  })

  // 🔴 RED: 境界ケースのテスト
  it('should handle edge cases in face region extraction', () => {
    // 極端に小さいランドマーク数
    const tinyLandmarks = createMockLandmarks(1)
    const mockResults: FaceMeshResults = {
      multiFaceLandmarks: [tinyLandmarks],
      image: createMockVideoElement()
    }

    const regions = extractFaceRegions(mockResults)
    expect(regions).toHaveLength(1)
    expect(regions[0].confidence).toBeLessThanOrEqual(1)
    expect(regions[0].confidence).toBeGreaterThan(0)
  })
})