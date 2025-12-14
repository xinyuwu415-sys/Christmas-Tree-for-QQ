import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import ParticleSystem from './ParticleSystem';
import PearlGarland from './PearlGarland';
import LightString from './LightString';
import PhotoCloud from './PhotoCloud';
import TreeTopper from './TreeTopper';
import { AppState, ParticleData, PhotoData } from '../types';
import { COLORS, CONFIG } from '../constants';

interface ExperienceProps {
  appState: AppState;
  particles: ParticleData[];
  pearls: ParticleData[];
  lights: ParticleData[];
  photos: PhotoData[];
  handVector: { x: number, y: number };
  focusedPhotoId: string | null;
}

// Component to handle camera movement based on hand
const CameraController: React.FC<{ handVector: { x: number, y: number }, appState: AppState }> = ({ handVector, appState }) => {
  const { camera, size } = useThree();
  const vec = new THREE.Vector3();

  useFrame(() => {
    // Only control camera in SCATTERED state
    if (appState === AppState.SCATTERED) {
      // Map hand X to azimuth, Hand Y to polar
      // Smooth lerp
      const targetX = handVector.x * 5; // Left/Right pan
      const targetY = handVector.y * 2; // Up/Down pan

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
      camera.lookAt(0, 0, 0);
    } else if (appState === AppState.TREE) {
      // Responsive Camera Z for Tree State
      const aspect = size.width / size.height;
      let targetZ = CONFIG.CAMERA_Z;

      // If portrait mode, pull back further to fit width of tree
      if (aspect < 1) {
        // Simple heuristic: if width is small, we need more Z. 
        // Tree width radius ~4 -> diameter 8. Plus margin ~10.
        // Visible width at Z = 2 * Z * tan(22.5) * aspect.
        // We want Visible Width >= 10.
        // 10 = 2 * Z * 0.414 * aspect => Z = 12 / aspect.
        targetZ = Math.max(CONFIG.CAMERA_Z, 12 / aspect);
      }

      // Reset slowly
      camera.position.lerp(vec.set(0, 0, targetZ), 0.05);
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
};

const Experience: React.FC<ExperienceProps> = ({ 
  appState, 
  particles, 
  pearls,
  lights,
  photos, 
  handVector,
  focusedPhotoId
}) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, CONFIG.CAMERA_Z], fov: 45 }}
      gl={{ alpha: false, antialias: true }}
      className="w-full h-full"
    >
      <color attach="background" args={[COLORS.EMERALD_DARK]} />
      <fog attach="fog" args={[COLORS.EMERALD_DARK, 10, 30]} />

      <CameraController handVector={handVector} appState={appState} />
      
      <ambientLight intensity={0.5} />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color={COLORS.GOLD}
      />
      <pointLight position={[-10, -5, -10]} intensity={1} color="#00ff88" />

      <group rotation={[0, 0, 0]}>
        <ParticleSystem appState={appState} particles={particles} />
        <PearlGarland appState={appState} data={pearls} />
        <LightString appState={appState} data={lights} />
        <PhotoCloud photos={photos} appState={appState} focusedPhotoId={focusedPhotoId} />
        <TreeTopper appState={appState} />
      </group>

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.5} 
          mipmapBlur 
          intensity={2.0} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      <Environment preset="night" />
    </Canvas>
  );
};

export default Experience;