import { GestureType, HandLandmark } from '../types';
import { CONFIG } from '../constants';

// Helper to calculate Euclidean distance
const distance = (p1: HandLandmark, p2: HandLandmark) => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );
};

export const detectGesture = (landmarks: HandLandmark[]): GestureType => {
  if (!landmarks || landmarks.length < 21) return GestureType.NONE;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const thumbPip = landmarks[2];
  const indexPip = landmarks[6];
  const middlePip = landmarks[10];
  const ringPip = landmarks[14];
  const pinkyPip = landmarks[18];

  // 1. Check for FIST (Fingers curled towards palm)
  // Simple check: Tips are closer to wrist than PIP joints or strictly lower y if hand is upright
  // A robust way for "upright" hand: Tip y > Pip y (screen coordinates: y increases downwards)
  // Let's use distance to wrist. If tips are close to wrist.
  
  const tips = [indexTip, middleTip, ringTip, pinkyTip];
  const pips = [indexPip, middlePip, ringPip, pinkyPip];
  
  // Count extended fingers
  let extendedFingers = 0;
  
  // Thumb is extended if tip is far from index pip
  if (distance(thumbTip, indexPip) > 0.1) extendedFingers++;

  // Other fingers
  // In screen space (normalized), usually y is smaller (higher up) when extended for an upright hand
  // However, rotation matters. Let's use distance from wrist vs pip distance from wrist.
  // If dist(Tip, Wrist) > dist(Pip, Wrist) -> Extended.
  
  tips.forEach((tip, i) => {
    if (distance(tip, wrist) > distance(pips[i], wrist)) {
      extendedFingers++;
    }
  });

  // FIST: 0 or 1 finger extended (thumb might be tricky)
  if (extendedFingers <= 1) {
    return GestureType.FIST;
  }

  // OPEN PALM: 5 fingers extended
  if (extendedFingers === 5) {
    return GestureType.OPEN_PALM;
  }

  // PINCH: Thumb and Index tips are very close
  const pinchDist = distance(thumbTip, indexTip);
  if (pinchDist < CONFIG.PINCH_THRESHOLD) {
    return GestureType.PINCH;
  }

  return GestureType.NONE;
};

// Calculate hand rotation/position for camera control
export const getHandVector = (landmarks: HandLandmark[]) => {
  if (!landmarks || landmarks.length === 0) return { x: 0, y: 0 };
  
  // Use wrist or palm center (approximate with index knuckle 5 and wrist 0)
  const x = landmarks[9].x; // Middle finger knuckle (center of hand)
  const y = landmarks[9].y;
  
  // Normalize to -1 to 1 range (MediaPipe returns 0 to 1)
  return {
    x: (x - 0.5) * 2,
    y: (y - 0.5) * 2
  };
};
