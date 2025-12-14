
export const COLORS = {
  EMERALD_DARK: '#002010',
  EMERALD_LIGHT: '#006b3e',
  GOLD: '#FFD700',
  GOLD_DARK: '#AA8800',
  RED: '#D40000',
  WHITE: '#F0F0F0',
  PEARL: '#FDFDFD',
  LIGHT_WARM: '#FFCC44',
};

export const CONFIG = {
  PARTICLE_COUNT: 400,
  TREE_HEIGHT: 10,
  TREE_RADIUS_BOTTOM: 4,
  CAMERA_Z: 16, // Increased from 12 to 16 to fit the whole tree
  TRANSITION_SPEED: 0.05, // Lerp factor
  PINCH_THRESHOLD: 0.05,
};

// Default photos cleared to ensure only local uploads are used
export const DEFAULT_PHOTOS: string[] = [];
