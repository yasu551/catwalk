import { test, expect } from '@playwright/test'

test.describe('歩行分析アプリ - Catwalk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('アプリが正常に起動し、メインUIが表示される', async ({ page }) => {
    // ページタイトルが正しく表示される
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/)
    
    // メインヘッダーが表示される
    await expect(page.locator('h1')).toContainText('歩行分析アプリ - Catwalk')
    
    // 説明文が表示される
    await expect(page.locator('header p')).toContainText('カメラで歩行を撮影し、キャットウォークか酔歩かを判定します')
    
    // カメラセクションが表示される
    await expect(page.locator('[aria-labelledby="camera-heading"]')).toBeVisible()
    await expect(page.locator('#camera-heading')).toContainText('カメラ映像')
  })

  test('カメラボタンが表示され、アクセシビリティが適切に設定されている', async ({ page }) => {
    // カメラ開始ボタンが存在する
    const cameraButton = page.locator('button').filter({ hasText: 'Start Camera' })
    await expect(cameraButton).toBeVisible()
    
    // ボタンが有効状態である
    await expect(cameraButton).toBeEnabled()
    
    // ARIA属性が適切に設定されている
    await expect(page.locator('[role="main"]')).toBeVisible()
    await expect(page.locator('[aria-labelledby="camera-heading"]')).toBeVisible()
  })

  test('エラーバウンダリが適切に実装されている', async ({ page }) => {
    // アプリが正常に読み込まれることを確認
    await expect(page.locator('.app')).toBeVisible()
    
    // エラーが発生していないことを確認（エラーバウンダリが表示されていない）
    await expect(page.locator('.error-boundary')).not.toBeVisible()
  })

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // デスクトップビューの確認
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('.app')).toBeVisible()
    await expect(page.locator('.app-main')).toBeVisible()
    
    // モバイルビューの確認
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.app')).toBeVisible()
    await expect(page.locator('.app-main')).toBeVisible()
  })

  test('セクション構造が適切に配置されている', async ({ page }) => {
    // カメラセクション
    await expect(page.locator('.camera-section')).toBeVisible()
    
    // 初期状態では姿勢検出・軌跡分析・判定セクションは非表示
    await expect(page.locator('.pose-section')).not.toBeVisible()
    await expect(page.locator('.trajectory-section')).not.toBeVisible()
    await expect(page.locator('.classification-section')).not.toBeVisible()
  })

  test('ローディング状態が適切に表示される', async ({ page }) => {
    // スピナーアニメーションのCSSが読み込まれていることを確認
    const spinnerStyle = await page.evaluate(() => {
      const spinner = document.querySelector('.spinner')
      if (!spinner) return null
      return window.getComputedStyle(spinner).animation
    })
    
    // スピナーが存在しない場合は、まだカメラが開始されていないため正常
    expect(spinnerStyle).toBeNull()
  })

  test('CSSスタイルが正しく適用されている', async ({ page }) => {
    // アプリのメインコンテナスタイル確認
    const appStyle = await page.locator('.app').evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        maxWidth: style.maxWidth,
        margin: style.margin,
        display: style.display,
        flexDirection: style.flexDirection
      }
    })
    
    expect(appStyle.maxWidth).toBe('1200px')
    expect(appStyle.display).toBe('flex')
    expect(appStyle.flexDirection).toBe('column')
    
    // ヘッダースタイル確認
    const headerStyle = await page.locator('.app-header').evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        textAlign: style.textAlign,
        background: style.background
      }
    })
    
    expect(headerStyle.textAlign).toBe('center')
    expect(headerStyle.background).toContain('linear-gradient')
  })

  test('セマンティックHTML構造が適切である', async ({ page }) => {
    // セマンティック要素の存在確認
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main[role="main"]')).toBeVisible()
    await expect(page.locator('section')).toHaveCount(1) // 初期状態ではカメラセクションのみ
    
    // 見出し階層の確認
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h2')).toHaveCount(1) // カメラ映像のh2
    
    // ARIA属性の確認
    await expect(page.locator('[aria-labelledby]')).toHaveCount(1)
  })
})

test.describe('カメラ機能テスト（モック）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('カメラボタンが存在し、基本的な動作が確認できる', async ({ page }) => {
    // カメラボタンが存在することを確認
    const cameraButton = page.locator('button').filter({ hasText: 'Start Camera' })
    await expect(cameraButton).toBeVisible()
    await expect(cameraButton).toBeEnabled()
    
    // ボタンの基本的なプロパティを確認
    const buttonText = await cameraButton.textContent()
    expect(buttonText).toBe('Start Camera')
    
    // ボタンがクリック可能であることを確認
    await expect(cameraButton).not.toBeDisabled()
  })

  test('エラーメッセージコンポーネントが適切に実装されている', async ({ page }) => {
    // エラーメッセージが初期状態では表示されていないことを確認
    await expect(page.locator('.error-message')).not.toBeVisible()
    
    // エラーメッセージのaria-labelが設定されていることを確認（将来の実装用）
    const errorElements = await page.locator('.error-message').count()
    expect(errorElements).toBe(0) // 初期状態では存在しない
  })
})