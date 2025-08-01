import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { type GaitClassification } from '../types/gait'
import GaitClassificationDisplay from './GaitClassificationDisplay'

describe('GaitClassificationDisplay', () => {
  // 🔴 RED: キャットウォーク判定結果の表示テスト
  it('should display catwalk classification correctly', () => {
    const catwalkResult: GaitClassification = {
      pattern: 'catwalk',
      confidence: 0.92,
      metrics: {
        stabilityScore: 88.5,
        regularityScore: 92.0,
        linearityScore: 95.3
      }
    }

    // この関数はまだ実装されていないので失敗する
    render(<GaitClassificationDisplay classification={catwalkResult} />)

    expect(screen.getByText(/キャットウォーク/)).toBeInTheDocument()
    expect(screen.getByText(/92\.0%/)).toBeInTheDocument() // 信頼度
    expect(screen.getByText('88.5')).toBeInTheDocument() // 安定性スコア
    expect(screen.getByText('92.0')).toBeInTheDocument() // 規則性スコア
    expect(screen.getByText('95.3')).toBeInTheDocument() // 直線性スコア
  })

  // 🔴 RED: 酔歩判定結果の表示テスト
  it('should display drunk walk classification correctly', () => {
    const drunkResult: GaitClassification = {
      pattern: 'drunk',
      confidence: 0.78,
      metrics: {
        stabilityScore: 25.2,
        regularityScore: 18.7,
        linearityScore: 12.4
      }
    }

    render(<GaitClassificationDisplay classification={drunkResult} />)

    expect(screen.getByText(/酔歩/)).toBeInTheDocument()
    expect(screen.getByText(/78\.0%/)).toBeInTheDocument() // 信頼度
    expect(screen.getByText('25.2')).toBeInTheDocument() // 安定性スコア
    expect(screen.getByText('18.7')).toBeInTheDocument() // 規則性スコア
    expect(screen.getByText('12.4')).toBeInTheDocument() // 直線性スコア
  })

  // 🔴 RED: 不明パターンの表示テスト
  it('should display unknown pattern correctly', () => {
    const unknownResult: GaitClassification = {
      pattern: 'unknown',
      confidence: 0.35,
      metrics: {
        stabilityScore: 55.8,
        regularityScore: 48.2,
        linearityScore: 62.1
      }
    }

    render(<GaitClassificationDisplay classification={unknownResult} />)

    expect(screen.getByText(/判定中/)).toBeInTheDocument()
    expect(screen.getByText(/35\.0%/)).toBeInTheDocument() // 信頼度
  })

  // 🔴 RED: リアルタイム判定更新のテスト
  it('should update classification results in real-time', () => {
    const initialResult: GaitClassification = {
      pattern: 'unknown',
      confidence: 0.2,
      metrics: {
        stabilityScore: 45.0,
        regularityScore: 50.0,
        linearityScore: 40.0
      }
    }

    const { rerender } = render(<GaitClassificationDisplay classification={initialResult} />)
    expect(screen.getByText(/判定中/)).toBeInTheDocument()

    // 判定結果が更新される
    const updatedResult: GaitClassification = {
      pattern: 'catwalk',
      confidence: 0.87,
      metrics: {
        stabilityScore: 85.0,
        regularityScore: 88.0,
        linearityScore: 90.0
      }
    }

    rerender(<GaitClassificationDisplay classification={updatedResult} />)
    expect(screen.getByText(/キャットウォーク/)).toBeInTheDocument()
    expect(screen.getByText(/87\.0%/)).toBeInTheDocument()
  })

  // 🔴 RED: アニメーション効果のテスト
  it('should show visual feedback with appropriate animations', () => {
    const catwalkResult: GaitClassification = {
      pattern: 'catwalk',
      confidence: 0.95,
      metrics: {
        stabilityScore: 92.0,
        regularityScore: 90.0,
        linearityScore: 96.0
      }
    }

    render(<GaitClassificationDisplay classification={catwalkResult} showAnimation={true} />)

    // アニメーション要素の存在確認
    const animatedElement = screen.getByTestId('classification-animation')
    expect(animatedElement).toBeInTheDocument()
    expect(animatedElement).toHaveClass('animate-pulse') // または適切なアニメーションクラス
  })

  // 🔴 RED: 判定根拠の詳細表示テスト
  it('should show detailed classification reasoning when requested', () => {
    const detailedResult: GaitClassification = {
      pattern: 'catwalk',
      confidence: 0.89,
      metrics: {
        stabilityScore: 87.5,
        regularityScore: 84.2,
        linearityScore: 92.8
      }
    }

    render(
      <GaitClassificationDisplay 
        classification={detailedResult} 
        showDetails={true} 
      />
    )

    // 詳細情報セクションの表示確認
    expect(screen.getByText('判定根拠')).toBeInTheDocument()
    expect(screen.getByText('安定性スコア:')).toBeInTheDocument()
    expect(screen.getByText('規則性スコア:')).toBeInTheDocument()
    expect(screen.getByText('直線性スコア:')).toBeInTheDocument()
    
    // getAllByText を使用して複数の要素が存在することを確認
    expect(screen.getAllByText('87.5')).toHaveLength(2) // メイン表示と詳細表示の両方
    expect(screen.getAllByText('84.2')).toHaveLength(2)
    expect(screen.getAllByText('92.8')).toHaveLength(2)
    
    // 判定理由の説明
    expect(screen.getByText(/直線的で安定した歩行パターン/)).toBeInTheDocument()
  })
})