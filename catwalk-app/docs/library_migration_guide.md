# MediaPipe Face Mesh → Face Landmarker Migration Guide

## Overview

This document outlines the migration from the legacy MediaPipe Face Mesh API to the modern MediaPipe Face Landmarker API using `@mediapipe/tasks-vision`. The migration aims to resolve persistent initialization errors and provide a more robust face detection solution.

## Why Migrate?

### Problems with Face Mesh
- Frequent initialization errors and timeouts
- Complex dynamic import requirements
- Module loading issues with Vite/ES modules
- Legacy API with limited ongoing support

### Benefits of Face Landmarker
- Modern Tasks API architecture with better error handling
- Simplified initialization process
- Native TypeScript support
- Support for additional features (blendshapes, transformation matrices)
- More stable and actively maintained

## Migration Steps

### 1. Dependency Updates

#### Remove Old Dependencies
```bash
npm uninstall @mediapipe/face_mesh @mediapipe/camera_utils @mediapipe/drawing_utils
```

#### Add New Dependencies
```bash
npm install @mediapipe/tasks-vision
```

### 2. API Comparison

#### Old Face Mesh API
```typescript
import { FaceMesh, type Results } from '@mediapipe/face_mesh'
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh'

// Initialization
const faceMeshInstance = new FaceMesh({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
})

faceMeshInstance.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})

await faceMeshInstance.initialize()
```

#### New Face Landmarker API
```typescript
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

// Initialization
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
);

const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    delegate: "GPU"
  },
  outputFaceBlendshapes: false,
  runningMode: "VIDEO",
  numFaces: 1
});
```

### 3. Result Structure Changes

#### Old Results (Face Mesh)
```typescript
interface Results {
  multiFaceLandmarks?: Array<Array<{x: number, y: number, z: number}>>
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
}
```

#### New Results (Face Landmarker)
```typescript
interface FaceLandmarkerResult {
  faceLandmarks: Array<Array<{x: number, y: number, z: number}>>
  faceBlendshapes?: Array<Array<{categoryName: string, score: number}>>
  facialTransformationMatrixes?: Array<Array<number>>
}
```

### 4. Key Differences

| Feature | Face Mesh | Face Landmarker |
|---------|-----------|-----------------|
| Package | `@mediapipe/face_mesh` | `@mediapipe/tasks-vision` |
| Initialization | `new FaceMesh()` + `initialize()` | `FaceLandmarker.createFromOptions()` |
| Results Property | `multiFaceLandmarks` | `faceLandmarks` |
| Drawing Utils | Separate package | Built-in `DrawingUtils` |
| Camera Utils | Required separate package | Built-in video processing |
| Blendshapes | Not available | Optional with `outputFaceBlendshapes: true` |
| Running Mode | Not explicit | Explicit `IMAGE` or `VIDEO` modes |

### 5. Component Migration Example

#### Before (FaceMeshDetector.tsx)
```typescript
export function FaceMeshDetector({ videoElement, onResults }: Props) {
  const [faceMesh, setFaceMesh] = useState<FaceMesh | null>(null)
  
  useEffect(() => {
    const initializeFaceMesh = async () => {
      const faceMeshInstance = new FaceMesh({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })
      
      faceMeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      
      faceMeshInstance.onResults((results: Results) => {
        // Handle results with multiFaceLandmarks
        if (results.multiFaceLandmarks) {
          // Process landmarks
        }
      })
      
      await faceMeshInstance.initialize()
      setFaceMesh(faceMeshInstance)
    }
    
    initializeFaceMesh()
  }, [])
}
```

#### After (FaceLandmarkerDetector.tsx)
```typescript
export function FaceLandmarkerDetector({ videoElement, onResults }: Props) {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
  
  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      
      setFaceLandmarker(faceLandmarkerInstance)
    }
    
    initializeFaceLandmarker()
  }, [])
  
  // Process video frames
  useEffect(() => {
    if (faceLandmarker && videoElement) {
      const processFrame = () => {
        const results = faceLandmarker.detectForVideo(videoElement, performance.now())
        
        // Handle results with faceLandmarks (note: different property name)
        if (results.faceLandmarks) {
          // Process landmarks
        }
        
        requestAnimationFrame(processFrame)
      }
      
      processFrame()
    }
  }, [faceLandmarker, videoElement])
}
```

### 6. Vite Configuration Updates

#### Remove from vite.config.ts
```typescript
// Remove these exclusions
optimizeDeps: {
  exclude: ['@mediapipe/face_mesh', '@mediapipe/camera_utils', '@mediapipe/drawing_utils']
}
```

#### Add new configuration (if needed)
```typescript
// Add if encountering issues
optimizeDeps: {
  exclude: ['@mediapipe/tasks-vision']
}
```

### 7. TypeScript Interface Updates

#### Create new types for Face Landmarker
```typescript
// types/faceLandmarker.ts
export interface FaceLandmarkerResults {
  faceLandmarks: Array<Array<{x: number, y: number, z: number}>>
  faceBlendshapes?: Array<Array<{categoryName: string, score: number}>>
  facialTransformationMatrixes?: Array<Array<number>>
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
}

export interface FaceLandmarkerProps {
  videoElement?: HTMLVideoElement
  onResults?: (results: FaceLandmarkerResults) => void
  numFaces?: number
  minFaceDetectionConfidence?: number
  outputFaceBlendshapes?: boolean
}
```

### 8. Error Handling Improvements

#### Old Error-Prone Pattern
```typescript
// Multiple potential failure points
const faceMesh = new FaceMesh({...})
faceMesh.setOptions({...})
faceMesh.onResults(callback)
await faceMesh.initialize() // Often failed
```

#### New Robust Pattern
```typescript
// Single initialization with better error handling
try {
  const vision = await FilesetResolver.forVisionTasks(wasmUrl)
  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, options)
  // Ready to use immediately
} catch (error) {
  console.error('Face Landmarker initialization failed:', error)
}
```

### 9. Performance Considerations

- **Face Landmarker** has better optimized initialization
- **GPU delegation** available through `delegate: "GPU"` option
- **Video mode** is more efficient for continuous processing
- **Reduced memory footprint** compared to Face Mesh

### 10. Testing Checklist

- [ ] Face detection initializes without errors
- [ ] Landmark coordinates are correctly mapped
- [ ] Canvas drawing works with new result structure
- [ ] Video processing performs smoothly
- [ ] Error handling works for network failures
- [ ] Component cleanup prevents memory leaks
- [ ] TypeScript types are correctly defined

## Migration Timeline

1. **Phase 1**: Create migration guide (Current)
2. **Phase 2**: Update dependencies and Vite config
3. **Phase 3**: Migrate FaceMeshDetector component
4. **Phase 4**: Update TypeScript types
5. **Phase 5**: Test and verify functionality

## Rollback Plan

If migration issues arise:
1. Revert to previous package.json
2. Restore original FaceMeshDetector.tsx
3. Re-add Vite optimizeDeps exclusions
4. Document specific issues for future resolution

## Resources

- [Face Landmarker Web Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [MediaPipe Tasks Vision NPM](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- [Official CodePen Example](https://codepen.io/mediapipe-preview/pen/OJBVQJm)