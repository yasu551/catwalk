import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FaceEffects } from './FaceEffects'
import { type FaceRegion, type GaitClassification } from '../types/gait'

describe('FaceEffects', () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D

  beforeEach(() => {
    // キャンバスとコンテキストをモック
    mockContext = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      closePath: vi.fn(),
      globalAlpha: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '16px Arial'
    } as unknown as CanvasRenderingContext2D

    // HTMLCanvasElement.prototype.getContextをモック
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext)
    
    vi.clearAllMocks()
  })

  // テスト用のモックデータ
  const createMockFaceRegion = (): FaceRegion => ({
    centerX: 0.5,
    centerY: 0.4,
    width: 0.35,   // より大きくして MIN_FACE_SIZE (0.08) を満たす
    height: 0.3,   // width * height = 0.105 > 0.08
    confidence: 0.9, // MIN_CONFIDENCE (0.7) を満たす
    landmarks: [
      { x: 0.45, y: 0.35, z: 0 }, // 左目付近
      { x: 0.55, y: 0.35, z: 0 }, // 右目付近
      { x: 0.5, y: 0.45, z: 0 },  // 鼻付近
      { x: 0.5, y: 0.5, z: 0 }    // 口付近
    ]
  })

  const createCatwalkClassification = (): GaitClassification => ({
    pattern: 'catwalk',
    confidence: 0.88,
    metrics: {
      stabilityScore: 85.0,
      regularityScore: 88.0,
      linearityScore: 92.0
    }
  })

  const createDrunkClassification = (): GaitClassification => ({
    pattern: 'drunk',
    confidence: 0.75,
    metrics: {
      stabilityScore: 25.0,
      regularityScore: 30.0,
      linearityScore: 20.0
    }
  })

  // 🔴 RED: 猫エフェクト描画のテスト（まだ実装されていない）
  it('should render cat effects for catwalk pattern', () => {
    const mockFaceRegion = createMockFaceRegion()
    const mockClassification = createCatwalkClassification()

    // この関数はまだ実装されていないので失敗する
    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // エフェクトが適用されたキャンバスが描画されることを確認
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Face effects visualization')
  })

  // 🔴 RED: 猫耳描画のテスト（まだ実装されていない）
  it('should draw cat ears for catwalk classification', async () => {
    const mockFaceRegion = createMockFaceRegion()
    const mockClassification = createCatwalkClassification()

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // 描画が非同期なので少し待つ
    await waitFor(() => {
      expect(mockContext.ellipse).toHaveBeenCalled()
      expect(mockContext.fill).toHaveBeenCalled()
    })
  })

  // 🔴 RED: 猫ひげ描画のテスト（まだ実装されていない）
  it('should draw cat whiskers for catwalk classification', async () => {
    const mockFaceRegion = createMockFaceRegion()
    const mockClassification = createCatwalkClassification()

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // ひげが線として描画されることを確認（実装後にパスする）
    await waitFor(() => {
      expect(mockContext.moveTo).toHaveBeenCalled()
      expect(mockContext.lineTo).toHaveBeenCalled()
      expect(mockContext.stroke).toHaveBeenCalled()
    })
  })

  // 🔴 RED: 酔っぱらいエフェクト描画のテスト（まだ実装されていない）
  it('should render drunk effects for drunk pattern', () => {
    const mockFaceRegion = createMockFaceRegion()
    const mockClassification = createDrunkClassification()

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // 酔っぱらいエフェクトが描画されることを確認
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  // 🔴 RED: 赤ら顔エフェクトのテスト（まだ実装されていない）
  it('should draw flushed face effect for drunk classification', async () => {
    const mockFaceRegion = createMockFaceRegion()
    const mockClassification = createDrunkClassification()

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // 赤ら顔効果（赤い円）が描画されることを確認（実装後にパスする）
    await waitFor(() => {
      expect(mockContext.arc).toHaveBeenCalled()
      expect(mockContext.fill).toHaveBeenCalled()
    })
  })

  // 🔴 RED: ふらつき演出のテスト（まだ実装されていない）
  it('should apply swaying animation for drunk classification', () => {
    const mockFaceRegion = createMockFaceRegion()
    const mockClassification = createDrunkClassification()

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
        enableAnimation={true}
      />
    )

    // アニメーションが有効な場合の特別な処理を確認（実装後にパスする）
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  // 🔴 RED: 複数顔への同時エフェクト適用のテスト（まだ実装されていない）
  it('should apply effects to multiple faces simultaneously', async () => {
    const mockFaceRegion1 = createMockFaceRegion()
    const mockFaceRegion2 = {
      ...createMockFaceRegion(),
      centerX: 0.3,
      centerY: 0.6
    }
    const mockClassification = createCatwalkClassification()

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion1, mockFaceRegion2]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // 複数の顔にエフェクトが適用されることを確認（実装後にパスする）
    // 描画メソッドが呼ばれることを期待（複数の顔に対応）
    await waitFor(() => {
      expect(mockContext.ellipse).toHaveBeenCalled() // 複数回呼ばれることを確認
      expect(mockContext.ellipse.mock.calls.length).toBeGreaterThanOrEqual(4) // 最低4回以上
    })
  })

  // 🔴 RED: 顔が小さすぎる場合のエフェクト無効化テスト（まだ実装されていない）
  it('should not apply effects to faces that are too small', () => {
    const smallFace = {
      ...createMockFaceRegion(),
      width: 0.03,
      height: 0.04,
      confidence: 0.5
    }
    const mockClassification = createCatwalkClassification()

    render(
      <FaceEffects
        faceRegions={[smallFace]}
        gaitClassification={mockClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // 小さすぎる顔にはエフェクトが適用されないことを確認（実装後にパスする）
    expect(mockContext.ellipse).not.toHaveBeenCalled()
  })

  // 🔴 RED: 未知パターンでのエフェクト無効化テスト（まだ実装されていない）
  it('should not apply effects for unknown gait pattern', () => {
    const mockFaceRegion = createMockFaceRegion()
    const unknownClassification: GaitClassification = {
      pattern: 'unknown',
      confidence: 0.3,
      metrics: {
        stabilityScore: 50.0,
        regularityScore: 45.0,
        linearityScore: 55.0
      }
    }

    render(
      <FaceEffects
        faceRegions={[mockFaceRegion]}
        gaitClassification={unknownClassification}
        canvasWidth={640}
        canvasHeight={480}
      />
    )

    // 未知パターンではエフェクトが適用されないことを確認（実装後にパスする）
    expect(mockContext.ellipse).not.toHaveBeenCalled()
    expect(mockContext.arc).not.toHaveBeenCalled()
  })
})