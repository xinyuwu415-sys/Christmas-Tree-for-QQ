
import React, { useRef, Suspense } from 'react';
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
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Load texture
  const texture = useLoader(THREE.TextureLoader, data.url);
  texture.minFilter = THREE.LinearFilter;
  // Use sRGB encoding for correct color in StandardMaterial
  texture.colorSpace = THREE.SRGBColorSpace;
  
  // Frame geometry
  const width = 1;
  const height = 1 / data.aspectRatio;
  const frameWidth = 0.05;

  useFrame((state) => {
    if (!meshRef.current) return;

    let targetPos = new THREE.Vector3();
    let targetScale = 1;
    
    // Check if this photo should be zoomed (Front & Center)
    // Applies in FOCUS state AND in SCATTERED state (Slideshow)
    const shouldZoom = isFocused && (appState === AppState.FOCUS || appState === AppState.SCATTERED);

    if (appState === AppState.TREE) {
      targetPos.set(...data.position);
      // Face outward from center
      const angle = Math.atan2(targetPos.x, targetPos.z);
      meshRef.current.rotation.set(0, angle, 0);
      targetScale = 0.8;
    } else if (shouldZoom) {
      // Bring to front center for viewing
      const zDepth = appState === AppState.SCATTERED ? 10 : 12; 
      targetPos.set(0, 0, zDepth); 
      meshRef.current.lookAt(state.camera.position);
      targetScale = 4.0;
    } else {
      // Background / Scattered state
      targetPos.set(...data.randomPosition);
      
      // Billboard effect: Face camera
      meshRef.current.lookAt(state.camera.position);

      if (appState === AppState.FOCUS) {
          // Manual focus background: shrink and push back
          targetScale = 0.5;
      } else {
          // Normal Scattered background
          targetScale = 2.0; 
      }
      
      // Floating effect
      targetPos.y += Math.sin(state.clock.elapsedTime + Number(data.id.split('-')[1] || 0)) * 0.1;
    }

    // Lerp transform
    meshRef.current.position.lerp(targetPos, CONFIG.TRANSITION_SPEED);
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, CONFIG.TRANSITION_SPEED));
    
    // Opacity handling
    if (materialRef.current) {
        let targetOpacity = 1.0;
        
        if (appState === AppState.FOCUS && !isFocused) {
             // Deep dim for manual focus background
            targetOpacity = 0.2;
        } else if (appState === AppState.SCATTERED && !isFocused && !shouldZoom) {
             // Slight dim for slideshow background
             targetOpacity = 0.6;
        }

        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Photo Content - Using Standard Material to avoid Bloom/Glow */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial 
            ref={materialRef} 
            map={texture} 
            side={THREE.DoubleSide} 
            transparent 
            roughness={0.8} // Matte finish like paper
            metalness={0.1}
            envMapIntensity={0.5}
        />
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
        <Suspense key={photo.id} fallback={null}>
            <PhotoPlane 
              data={photo} 
              appState={appState}
              isFocused={photo.id === focusedPhotoId}
            />
        </Suspense>
      ))}
    </group>
  );
};

export default PhotoCloud;
