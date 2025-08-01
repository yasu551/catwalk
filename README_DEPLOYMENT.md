# Catwalk App - Vercel Deployment Guide

## Prerequisites

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Ensure the project builds successfully:
   ```bash
   npm run build
   ```

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy the project:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Connect your GitHub repository to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: `Vite`
     - Build Command: `npm run vercel-build`
     - Output Directory: `dist`
     - Install Command: `npm install`

## Configuration Files

- `vercel.json`: Vercel deployment configuration
- `.vercelignore`: Files to ignore during deployment
- Package.json includes `vercel-build` script

## Important Notes

### MediaPipe WASM Files

The app uses MediaPipe models that are loaded from Google's CDN:
- Face Landmarker: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker.task`
- Pose Landmarker: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`

These models are loaded at runtime and don't need to be included in the deployment.

### CORS Headers

The `vercel.json` configuration includes necessary CORS headers for MediaPipe:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

### Camera Permissions

The app requires camera permissions to function. Ensure your deployment:
1. Uses HTTPS (Vercel provides this automatically)
2. Handles camera permission errors gracefully

## Testing Deployment

After deployment, test these features:
1. Camera access and video stream
2. Pose detection and landmark visualization
3. Face detection and effects
4. Gait analysis and classification
5. Mobile responsiveness

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript compilation: `npm run lint`
- Run tests: `npm test -- --run`

### Runtime Errors
- Check browser console for MediaPipe loading errors
- Verify camera permissions are granted
- Test on different browsers (Chrome, Firefox, Safari)

### Performance Issues
- MediaPipe models are loaded on first use
- Consider implementing loading states for better UX
- Monitor network usage for model downloads