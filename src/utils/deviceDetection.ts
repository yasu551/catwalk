/**
 * デバイス検出ユーティリティ
 * モバイルデバイスの判定とカメラの適切なfacingModeを決定する
 */

/**
 * ユーザーエージェントとタッチ機能に基づいてモバイルデバイスを検出
 * @returns モバイルデバイスの場合true、そうでなければfalse
 */
export function isMobileDevice(): boolean {
  // サーバーサイドレンダリング対応
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // タッチ機能の検出
  const hasTouchScreen = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 ||
                        (navigator as any).msMaxTouchPoints > 0

  // ユーザーエージェントの検出
  const mobileUserAgentRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  const isMobileUserAgent = mobileUserAgentRegex.test(navigator.userAgent)

  // 画面サイズによる判定（小さい画面をモバイルとみなす）
  const isSmallScreen = window.screen.width <= 768 || window.screen.height <= 768

  // いずれかの条件に該当すればモバイルデバイスと判定
  return hasTouchScreen || isMobileUserAgent || isSmallScreen
}

/**
 * デバイスタイプに基づいて適切なカメラfacingModeを決定
 * @returns モバイルデバイスの場合'environment'（リアカメラ）、そうでなければ'user'（フロントカメラ）
 */
export function getDefaultCameraFacingMode(): 'user' | 'environment' {
  return isMobileDevice() ? 'environment' : 'user'
}

/**
 * デバイス情報を取得（デバッグ用）
 * @returns デバイス検出に使用される情報
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      hasTouch: false,
      userAgent: 'SSR',
      screenWidth: 0,
      screenHeight: 0,
      defaultFacingMode: 'user' as const
    }
  }

  const hasTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 ||
                   (navigator as any).msMaxTouchPoints > 0

  const isMobile = isMobileDevice()

  return {
    isMobile,
    hasTouch,
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    defaultFacingMode: getDefaultCameraFacingMode()
  }
}