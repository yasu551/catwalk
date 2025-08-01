// MediaPipe Pose connections definition
// Based on the standard MediaPipe pose model
export const POSE_CONNECTIONS: [number, number][] = [
  // Face connections
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  
  // Body connections
  [9, 10], // mouth corners
  
  // Shoulder to shoulder
  [11, 12],
  
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  
  // Right arm  
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  
  // Torso
  [11, 23], [12, 24], [23, 24],
  
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
]