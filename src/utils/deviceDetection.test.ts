import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isMobileDevice, getDefaultCameraFacingMode, getDeviceInfo } from './deviceDetection'

// グローバルオブジェクトのモック
const mockWindow = {
  screen: {
    width: 1920,
    height: 1080
  }
}

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxTouchPoints: 0
}

describe('deviceDetection', () => {
  beforeEach(() => {
    // window と navigator をモック
    Object.defineProperty(globalThis, 'window', {
      value: mockWindow,
      writable: true
    })
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('isMobileDevice', () => {
    it('should return false for desktop with no touch', () => {
      // デスクトップ設定
      mockWindow.screen.width = 1920
      mockWindow.screen.height = 1080
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockNavigator.maxTouchPoints = 0
      delete (mockWindow as any).ontouchstart

      expect(isMobileDevice()).toBe(false)
    })

    it('should return true for device with touch screen', () => {
      // タッチスクリーン設定
      ;(mockWindow as any).ontouchstart = true
      mockNavigator.maxTouchPoints = 5

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for iPhone user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for Android user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for iPad user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15'

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for small screen devices', () => {
      // 小さい画面設定
      mockWindow.screen.width = 375
      mockWindow.screen.height = 667
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      delete (mockWindow as any).ontouchstart
      mockNavigator.maxTouchPoints = 0

      expect(isMobileDevice()).toBe(true)
    })

    it('should return false for SSR environment', () => {
      // window を undefined に設定
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true
      })

      expect(isMobileDevice()).toBe(false)
    })
  })

  describe('getDefaultCameraFacingMode', () => {
    it('should return "environment" for mobile devices', () => {
      // モバイル設定
      ;(mockWindow as any).ontouchstart = true
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'

      expect(getDefaultCameraFacingMode()).toBe('environment')
    })

    it('should return "user" for desktop devices', () => {
      // デスクトップ設定
      mockWindow.screen.width = 1920
      mockWindow.screen.height = 1080
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      delete (mockWindow as any).ontouchstart
      mockNavigator.maxTouchPoints = 0

      expect(getDefaultCameraFacingMode()).toBe('user')
    })
  })

  describe('getDeviceInfo', () => {
    it('should return correct device info for desktop', () => {
      // デスクトップ設定
      mockWindow.screen.width = 1920
      mockWindow.screen.height = 1080
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      delete (mockWindow as any).ontouchstart
      mockNavigator.maxTouchPoints = 0

      const deviceInfo = getDeviceInfo()

      expect(deviceInfo).toEqual({
        isMobile: false,
        hasTouch: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        screenWidth: 1920,
        screenHeight: 1080,
        defaultFacingMode: 'user'
      })
    })

    it('should return correct device info for mobile', () => {
      // モバイル設定
      ;(mockWindow as any).ontouchstart = true
      mockNavigator.maxTouchPoints = 5
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
      mockWindow.screen.width = 375
      mockWindow.screen.height = 667

      const deviceInfo = getDeviceInfo()

      expect(deviceInfo).toEqual({
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        screenWidth: 375,
        screenHeight: 667,
        defaultFacingMode: 'environment'
      })
    })

    it('should return SSR safe values when window is undefined', () => {
      // SSR環境をシミュレート
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true
      })

      const deviceInfo = getDeviceInfo()

      expect(deviceInfo).toEqual({
        isMobile: false,
        hasTouch: false,
        userAgent: 'SSR',
        screenWidth: 0,
        screenHeight: 0,
        defaultFacingMode: 'user'
      })
    })
  })

  describe('edge cases', () => {
    it('should handle msMaxTouchPoints for IE/Edge', () => {
      // IE/Edge設定
      delete (mockWindow as any).ontouchstart
      mockNavigator.maxTouchPoints = 0
      ;(mockNavigator as any).msMaxTouchPoints = 5

      expect(isMobileDevice()).toBe(true)
    })

    it('should handle mixed conditions (desktop size but mobile user agent)', () => {
      // デスクトップサイズだがモバイルUA
      mockWindow.screen.width = 1920
      mockWindow.screen.height = 1080
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'
      delete (mockWindow as any).ontouchstart
      mockNavigator.maxTouchPoints = 0

      expect(isMobileDevice()).toBe(true)
    })

    it('should handle tablet-sized screens', () => {
      // タブレットサイズ
      mockWindow.screen.width = 768
      mockWindow.screen.height = 1024
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      delete (mockWindow as any).ontouchstart
      mockNavigator.maxTouchPoints = 0

      expect(isMobileDevice()).toBe(true)
    })
  })
})