import { useEffect, useRef } from 'react'
import { type FaceRegion, type GaitClassification } from '../types/gait'
import { isFaceSuitableForEffects } from '../utils/faceDetection'

interface FaceEffectsProps {
  faceRegions: FaceRegion[]
  gaitClassification: GaitClassification
  canvasWidth: number
  canvasHeight: number
  enableAnimation?: boolean
  className?: string
}

export function FaceEffects({
  faceRegions,
  gaitClassification,
  canvasWidth,
  canvasHeight,
  enableAnimation = false,
  className = ''
}: FaceEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // キャンバスサイズを設定
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const drawEffects = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // エフェクト適用可能な顔のみフィルタリング
      const suitableFaces = faceRegions.filter(isFaceSuitableForEffects)

      if (suitableFaces.length === 0) return

      // パターンに応じてエフェクトを適用
      switch (gaitClassification.pattern) {
        case 'catwalk':
          suitableFaces.forEach(face => drawCatEffects(ctx, face, canvasWidth, canvasHeight))
          break
        case 'drunk':
          suitableFaces.forEach(face => drawDrunkEffects(ctx, face, canvasWidth, canvasHeight, enableAnimation))
          break
        default:
          // 'unknown' パターンではエフェクトを適用しない
          break
      }
    }

    if (enableAnimation) {
      const animate = () => {
        drawEffects()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      drawEffects()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [faceRegions, gaitClassification, canvasWidth, canvasHeight, enableAnimation])

  return (
    <div className={`face-effects ${className}`}>
      <canvas
        ref={canvasRef}
        className="face-effects-canvas"
        role="img"
        aria-label="Face effects visualization"
        style={{
          width: '100%',
          maxWidth: `${canvasWidth}px`,
          height: 'auto',
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10
        }}
      />
    </div>
  )
}

/**
 * 猫エフェクトを描画（キャットウォーク用）
 */
function drawCatEffects(
  ctx: CanvasRenderingContext2D,
  face: FaceRegion,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save()

  const faceX = face.centerX * canvasWidth
  const faceY = face.centerY * canvasHeight
  const faceWidth = face.width * canvasWidth
  const faceHeight = face.height * canvasHeight

  // 猫耳を描画
  drawCatEars(ctx, faceX, faceY, faceWidth, faceHeight)

  // 猫ひげを描画
  drawCatWhiskers(ctx, faceX, faceY, faceWidth, faceHeight)

  ctx.restore()
}

/**
 * 猫耳を描画
 */
function drawCatEars(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number) {
  const earSize = Math.min(width, height) * 0.3
  const earOffsetX = width * 0.35
  const earOffsetY = height * 0.4

  // 左耳
  ctx.fillStyle = '#FFA500' // オレンジ色
  ctx.beginPath()
  ctx.ellipse(
    centerX - earOffsetX,
    centerY - earOffsetY,
    earSize * 0.8,
    earSize,
    -Math.PI / 6, // 左に傾ける
    0,
    2 * Math.PI
  )
  ctx.fill()

  // 右耳
  ctx.beginPath()
  ctx.ellipse(
    centerX + earOffsetX,
    centerY - earOffsetY,
    earSize * 0.8,
    earSize,
    Math.PI / 6, // 右に傾ける
    0,
    2 * Math.PI
  )
  ctx.fill()

  // 耳の内側（ピンク）
  ctx.fillStyle = '#FFB6C1'
  
  // 左耳内側
  ctx.beginPath()
  ctx.ellipse(
    centerX - earOffsetX,
    centerY - earOffsetY,
    earSize * 0.4,
    earSize * 0.6,
    -Math.PI / 6,
    0,
    2 * Math.PI
  )
  ctx.fill()

  // 右耳内側
  ctx.beginPath()
  ctx.ellipse(
    centerX + earOffsetX,
    centerY - earOffsetY,
    earSize * 0.4,
    earSize * 0.6,
    Math.PI / 6,
    0,
    2 * Math.PI
  )
  ctx.fill()
}

/**
 * 猫ひげを描画
 */
function drawCatWhiskers(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number) {
  const whiskerLength = width * 0.4
  const whiskerOffset = height * 0.1

  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  // 左側のひげ
  for (let i = 0; i < 3; i++) {
    const y = centerY + (i - 1) * whiskerOffset
    ctx.beginPath()
    ctx.moveTo(centerX - width * 0.2, y)
    ctx.lineTo(centerX - width * 0.2 - whiskerLength, y + (i - 1) * 5)
    ctx.stroke()
  }

  // 右側のひげ
  for (let i = 0; i < 3; i++) {
    const y = centerY + (i - 1) * whiskerOffset
    ctx.beginPath()
    ctx.moveTo(centerX + width * 0.2, y)
    ctx.lineTo(centerX + width * 0.2 + whiskerLength, y + (i - 1) * 5)
    ctx.stroke()
  }
}

/**
 * 酔っぱらいエフェクトを描画
 */
function drawDrunkEffects(
  ctx: CanvasRenderingContext2D,
  face: FaceRegion,
  canvasWidth: number,
  canvasHeight: number,
  enableAnimation: boolean
) {
  ctx.save()

  const faceX = face.centerX * canvasWidth
  const faceY = face.centerY * canvasHeight
  const faceWidth = face.width * canvasWidth
  const faceHeight = face.height * canvasHeight

  // アニメーション用の時間ベースオフセット
  const time = enableAnimation ? Date.now() / 1000 : 0
  const swayOffset = enableAnimation ? Math.sin(time * 2) * 5 : 0

  // 赤ら顔エフェクト
  drawFlushedCheeks(ctx, faceX + swayOffset, faceY, faceWidth, faceHeight)

  // ふらつき表現（目をぐるぐる）
  if (enableAnimation) {
    drawDizzyEyes(ctx, faceX + swayOffset, faceY, faceWidth, faceHeight, time)
  }

  ctx.restore()
}

/**
 * 赤ら顔エフェクトを描画
 */
function drawFlushedCheeks(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number) {
  const cheekSize = Math.min(width, height) * 0.15
  const cheekOffsetX = width * 0.25
  const cheekOffsetY = height * 0.1

  ctx.fillStyle = 'rgba(255, 99, 99, 0.6)' // 半透明の赤
  
  // 左頬
  ctx.beginPath()
  ctx.arc(centerX - cheekOffsetX, centerY + cheekOffsetY, cheekSize, 0, 2 * Math.PI)
  ctx.fill()

  // 右頬
  ctx.beginPath()
  ctx.arc(centerX + cheekOffsetX, centerY + cheekOffsetY, cheekSize, 0, 2 * Math.PI)
  ctx.fill()
}

/**
 * ぐるぐる目のエフェクトを描画
 */
function drawDizzyEyes(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number, time: number) {
  const eyeSize = Math.min(width, height) * 0.08
  const eyeOffsetX = width * 0.15
  const eyeOffsetY = height * 0.15

  ctx.strokeStyle = '#FFD700' // 金色
  ctx.lineWidth = 3
  ctx.lineCap = 'round'

  // 左目のぐるぐる
  drawSpiral(ctx, centerX - eyeOffsetX, centerY - eyeOffsetY, eyeSize, time)

  // 右目のぐるぐる
  drawSpiral(ctx, centerX + eyeOffsetX, centerY - eyeOffsetY, eyeSize, time * 1.2)
}

/**
 * スパイラル（ぐるぐる）を描画
 */
function drawSpiral(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number, time: number) {
  const turns = 3
  const steps = 50
  
  ctx.beginPath()
  
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * turns * 2 * Math.PI + time
    const radius = (i / steps) * size
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  
  ctx.stroke()
}

export default FaceEffects