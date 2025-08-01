# カメラ切り替え時の姿勢検出継続実装計画

## 問題概要
カメラをリアに変更すると姿勢検出が機能しなくなる問題を解決する。

## 根本原因分析

### 1. タイミング問題
- `Camera.tsx` の `switchCamera()` でストリーム停止→開始の間に非同期処理が発生
- `onStream` コールバックと `onCameraChange` コールバックの実行順序が不定
- video element への新しいストリーム設定と MediaPipe の認識にズレ

### 2. Video Element 更新不足  
- `App.tsx` の `handleCameraChange` が video element を再取得するが、新しいストリームが設定される前に実行される可能性
- `document.querySelector('video')` のタイミングが不適切

### 3. MediaPipe ライフサイクル問題
- `PoseLandmarkerDetector` が `videoElement` prop の変更を検知しても適切に再初期化されない
- useEffect の依存配列に videoElement が含まれていない可能性

## 実装計画 (TDD方式)

### Phase 1: Camera.tsx ストリーム同期修正

#### RED: テスト作成
- [ ] カメラ切り替え時のコールバック実行順序テスト
- [ ] video element のストリーム設定完了確認テスト
- [ ] 切り替え時の同期エラーテスト

#### GREEN: 実装
- [ ] `switchCamera` 関数でのコールバック順序保証
- [ ] video element の srcObject 設定確認後にコールバック実行
- [ ] Promise チェーンで非同期処理の順序制御

#### REFACTOR: 改善
- [ ] エラーハンドリング強化
- [ ] ログ出力追加
- [ ] コード可読性向上

### Phase 2: App.tsx Stream ハンドリング統合

#### RED: テスト作成  
- [ ] `handleStream` と `handleCameraChange` の連携テスト
- [ ] video element 更新タイミングテスト
- [ ] MediaPipe コンポーネントへの伝播テスト

#### GREEN: 実装
- [ ] `handleStream` での video element 設定確認
- [ ] `handleCameraChange` での重複処理削除
- [ ] 統合されたストリーム更新ハンドラー作成

#### REFACTOR: 改善
- [ ] 重複コード削除
- [ ] エラー処理統一
- [ ] パフォーマンス最適化

### Phase 3: PoseLandmarkerDetector ライフサイクル改善

#### RED: テスト作成
- [ ] videoElement 変更時の再初期化テスト  
- [ ] MediaPipe 処理継続テスト
- [ ] animation frame リセットテスト

#### GREEN: 実装
- [ ] useEffect 依存配列に videoElement 追加
- [ ] video element 変更時の animation frame クリーンアップ
- [ ] MediaPipe 処理の適切な再開始

#### REFACTOR: 改善
- [ ] 不要な再レンダリング削減
- [ ] メモリリーク対策
- [ ] エラー回復機能

### Phase 4: デバッグ支援機能

#### 実装項目
- [ ] 詳細ログ出力 (コンソール)
- [ ] video element readyState 監視  
- [ ] MediaPipe 初期化状態表示
- [ ] タイミング計測とレポート

### Phase 5: E2E テスト拡張

#### テスト項目
- [ ] フロント→リア切り替えテスト
- [ ] リア→フロント切り替えテスト  
- [ ] 姿勢検出継続確認テスト
- [ ] エラー回復テスト

## 技術仕様

### コールバック順序制御
```typescript
// Camera.tsx - switchCamera 修正版
const switchCamera = async () => {
  // 1. 既存ストリーム停止
  stopCamera()
  
  // 2. 新しいストリーム開始
  await startCamera(newFacingMode)
  
  // 3. video element への設定確認
  await waitForVideoReady()
  
  // 4. コールバック実行（順序保証）
  onStream?.(newStream)
  onCameraChange?.(newFacingMode)
}
```

### Video Element 同期確認
```typescript
// App.tsx - 統合ハンドラー
const handleStreamAndCameraChange = async (
  stream: MediaStream, 
  facingMode?: 'user' | 'environment'
) => {
  setStream(stream)
  
  // video element 更新を待機
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const video = document.querySelector('video') as HTMLVideoElement
  if (video && video.srcObject === stream) {
    setVideoElement(video)
  }
}
```

### MediaPipe ライフサイクル
```typescript
// PoseLandmarkerDetector.tsx - useEffect修正
useEffect(() => {
  // video element 変更時の再初期化
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current)
  }
  
  if (poseLandmarker && videoElement && isInitialized) {
    // 新しい video element で処理再開
    processVideoFrame()
  }
}, [poseLandmarker, videoElement, isInitialized, onResults])
```

## 期待される成果

### 機能面
- カメラ切り替え時の姿勢検出継続
- エラー状態からの自動回復
- スムーズなユーザー体験

### 品質面  
- 100% テストカバレッジ
- ログによる問題追跡可能性
- パフォーマンス劣化なし

### 技術面
- 非同期処理の適切な制御
- React ライフサイクルの最適化
- MediaPipe との確実な連携

## 実装スケジュール
1. Phase 1: Camera.tsx 修正 (1-2h)
2. Phase 2: App.tsx 統合 (1h)  
3. Phase 3: PoseLandmarkerDetector 改善 (1-2h)
4. Phase 4: デバッグ支援 (30min)
5. Phase 5: E2E テスト (1h)

**合計**: 4.5-6.5時間