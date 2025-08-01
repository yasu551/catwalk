/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  optimizeDeps: {
    exclude: ['@mediapipe/pose', '@mediapipe/face_mesh', '@mediapipe/camera_utils', '@mediapipe/drawing_utils']
  },
  define: {
    global: 'globalThis',
  },
})
