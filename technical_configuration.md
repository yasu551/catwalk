# 歩行分析Webアプリ 技術構成

## フロントエンド

- **フレームワーク**: React.js
- **UIコンポーネントライブラリ**: shadcn/ui
- **スタイリング**: Tailwind CSS

## 姿勢推定・骨格検出

- **MediaPipe Pose（JavaScript版）**

## 顔認識・特殊効果

- **MediaPipe Face Mesh（JavaScript版）**
- **顔エフェクト適用ライブラリ**: TensorFlow.js または OpenCV.js

## 歩行パターン分析・機械学習モデル

- **分析ライブラリ**: TensorFlow.js
- **アルゴリズム**: ニューラルネットワーク / SVM / ランダムフォレストなど

## 映像処理・表示

- **映像取得**: WebRTC
- **映像描画と加工**: HTML5 Canvas / WebGL

## データ可視化

- **グラフ描画**: Chart.js または Plotly.js

## ホスティング

- **プラットフォーム**: Vercel または Netlify

## その他

- **バージョン管理**: GitHub
- **パッケージ管理**: yarn
