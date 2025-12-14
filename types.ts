export enum AppState {
  TREE = 'TREE',
  SCATTERED = 'SCATTERED',
  FOCUS = 'FOCUS'
}

export enum GestureType {
  NONE = 'NONE',
  FIST = 'FIST',       // Close tree
  OPEN_PALM = 'OPEN',  // Scatter tree
  PINCH = 'PINCH',     // Grab/Focus photo
  POINT = 'POINT'      // Navigation (not strictly used but good to have)
}

export interface ParticleData {
  id: number;
  position: [number, number, number]; // Target position in Tree state
  randomPosition: [number, number, number]; // Target position in Scattered state
  type: 'sphere' | 'cube' | 'cane';
  color: string;
  scale: number;
}

export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number]; // Tree position
  randomPosition: [number, number, number]; // Scattered position
  aspectRatio: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
