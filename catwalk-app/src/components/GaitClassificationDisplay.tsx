import React from 'react'
import { type GaitClassification } from '../types/gait'

interface GaitClassificationDisplayProps {
  classification: GaitClassification
  showAnimation?: boolean
  showDetails?: boolean
  className?: string
}

export const GaitClassificationDisplay: React.FC<GaitClassificationDisplayProps> = ({
  classification,
  showAnimation = false,
  showDetails = false,
  className = ''
}) => {
  // パターンに基づく表示情報の取得
  const getPatternInfo = () => {
    switch (classification.pattern) {
      case 'catwalk':
        return {
          label: 'キャットウォーク (秩序的)',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: '👑',
          description: '直線的で安定した歩行パターンです。バランスが良く、規則性があります。'
        }
      case 'drunk':
        return {
          label: '酔歩 (不規則)',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          icon: '🍺',
          description: '不安定で不規則な歩行パターンです。重心の揺れが大きく、直線性が低いです。'
        }
      default:
        return {
          label: '判定中 (分析中)',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          icon: '🤔',
          description: 'データを分析中です。より多くのデータが必要です。'
        }
    }
  }

  const patternInfo = getPatternInfo()
  const confidencePercentage = (classification.confidence * 100).toFixed(1)

  return (
    <div className={`gait-classification-display ${className}`}>
      <div className={`rounded-lg p-6 ${patternInfo.bgColor} border-2 border-gray-200`}>
        {/* メイン判定結果 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{patternInfo.icon}</span>
            <div>
              <h3 className={`text-lg font-bold ${patternInfo.textColor}`}>
                {patternInfo.label}
              </h3>
              <p className="text-sm text-gray-600">
                信頼度: <span className="font-semibold">{confidencePercentage}%</span>
              </p>
            </div>
          </div>
          
          {/* 信頼度バー */}
          <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${patternInfo.color} transition-all duration-500`}
              style={{ width: `${Math.min(100, classification.confidence * 100)}%` }}
            />
          </div>
        </div>

        {/* アニメーション要素 */}
        {showAnimation && (
          <div 
            data-testid="classification-animation"
            className={`w-full h-2 ${patternInfo.color} rounded animate-pulse mb-4`}
          />
        )}

        {/* メトリクス表示 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${patternInfo.textColor}`}>
              {classification.metrics.stabilityScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">安定性スコア</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${patternInfo.textColor}`}>
              {classification.metrics.regularityScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">規則性スコア</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${patternInfo.textColor}`}>
              {classification.metrics.linearityScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">直線性スコア</div>
          </div>
        </div>

        {/* 詳細情報 */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <h4 className="font-semibold text-gray-800 mb-2">判定根拠</h4>
            <p className="text-sm text-gray-700 mb-3">
              {patternInfo.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">安定性スコア:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{classification.metrics.stabilityScore.toFixed(1)}</span>
                  <div className="w-16 h-2 bg-gray-200 rounded">
                    <div 
                      className={`h-full ${patternInfo.color} rounded`}
                      style={{ width: `${Math.min(100, classification.metrics.stabilityScore)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">規則性スコア:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{classification.metrics.regularityScore.toFixed(1)}</span>
                  <div className="w-16 h-2 bg-gray-200 rounded">
                    <div 
                      className={`h-full ${patternInfo.color} rounded`}
                      style={{ width: `${Math.min(100, classification.metrics.regularityScore)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">直線性スコア:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{classification.metrics.linearityScore.toFixed(1)}</span>
                  <div className="w-16 h-2 bg-gray-200 rounded">
                    <div 
                      className={`h-full ${patternInfo.color} rounded`}
                      style={{ width: `${Math.min(100, classification.metrics.linearityScore)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GaitClassificationDisplay