import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { PhotoData, AppState } from '../types';
import { CONFIG, COLORS } from '../constants';

interface PhotoProps {
  data: PhotoData;
  appState: AppState;
  isFocused: boolean;
}

const PhotoPlane: React.FC<PhotoProps> = ({ data, appState, isFocused }) => {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // Load texture
  const texture = useLoader(THREE.TextureLoader, data.url);
  texture.minFilter = THREE.LinearFilter;
  
  // Frame geometry
  const width = 1;
  const height = 1 / data.aspectRatio;
  const frameWidth = 0.05;

  useFrame((state) => {
    if (!meshRef.current) return;

    let targetPos = new THREE.Vector3();
    let targetScale = 1;
    // We will handle rotation via LookAt for scattered/focus

    if (appState === AppState.TREE) {
      targetPos.set(...data.position);
      // Face outward from center
      const angle = Math.atan2(targetPos.x, targetPos.z);
      meshRef.current.rotation.set(0, angle, 0);
      targetScale = 0.8;
    } else if (appState === AppState.FOCUS && isFocused) {
      // Bring to front center
      targetPos.set(0, 0, 10); // Very close to camera
      meshRef.current.lookAt(state.camera.position);
      targetScale = 4.0;
    } else if (appState === AppState.FOCUS && !isFocused) {
      // Fade out/Push back others
       targetPos.set(...data.randomPosition);
       targetScale = 0.5;
       meshRef.current.lookAt(state.camera.position);
    } else {
      // SCATTERED
      targetPos.set(...data.randomPosition);
      
      // Billboard effect: Face camera so user can see the photo
      meshRef.current.lookAt(state.camera.position);

      targetScale = 2.0; // Larger in scattered state to be visible
      
      // Floating effect
      targetPos.y += Math.sin(state.clock.elapsedTime + Number(data.id)) * 0.1;
    }

    // Lerp transform
    meshRef.current.position.lerp(targetPos, CONFIG.TRANSITION_SPEED);
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, CONFIG.TRANSITION_SPEED));
    
    // Opacity handling for material (if needed)
    if (materialRef.current) {
        const targetOpacity = (appState === AppState.FOCUS && !isFocused) ? 0.2 : 1.0;
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Photo Content */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={materialRef} map={texture} side={THREE.DoubleSide} transparent />
      </mesh>

      {/* Frame/Backing */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width + frameWidth, height + frameWidth, 0.02]} />
        <meshStandardMaterial color={COLORS.GOLD} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
};

interface CloudProps {
  photos: PhotoData[];
  appState: AppState;
  focusedPhotoId: string | null;
}

const PhotoCloud: React.FC<CloudProps> = ({ photos, appState, focusedPhotoId }) => {
  return (
    <group>
      {photos.map((photo) => (
        <PhotoPlane 
          key={photo.id} 
          data={photo} 
          appState={appState}
          isFocused={photo.id === focusedPhotoId}
        />
      ))}
    </group>
  );
};

export default PhotoCloud;