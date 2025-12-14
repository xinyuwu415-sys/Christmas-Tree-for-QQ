import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleData, AppState } from '../types';
import { COLORS, CONFIG } from '../constants';

interface Props {
  appState: AppState;
  data: ParticleData[];
}

const LightString: React.FC<Props> = ({ appState, data }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Light Material: Emissive for bloom effect
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.LIGHT_WARM,
    emissive: COLORS.LIGHT_WARM,
    emissiveIntensity: 3,
    toneMapped: false, // Important for strong bloom
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    data.forEach((particle, i) => {
      let target: THREE.Vector3;
      
      if (appState === AppState.TREE) {
        target = new THREE.Vector3(...particle.position);
      } else {
        target = new THREE.Vector3(...particle.randomPosition);
        // More active floating for lights
        target.y += Math.sin(time * 1.5 + particle.id) * 0.05;
      }

      meshRef.current!.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      dummy.position.lerp(target, CONFIG.TRANSITION_SPEED);

      // TWINKLE EFFECT
      // Calculate a twinkling scale based on time and ID
      // Base scale is particle.scale
      // We oscillate between 0.5x and 1.2x of base scale
      const twinkle = Math.sin(time * 3 + particle.id * 10); // Fast flicker
      const scaleMultiplier = 0.8 + (twinkle * 0.4); 
      
      const targetScale = particle.scale * scaleMultiplier;
      
      // Smoothly interpolate current scale to target twinkle scale
      dummy.scale.setScalar(THREE.MathUtils.lerp(dummy.scale.x, targetScale, 0.2));

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, data.length]}
    >
      <sphereGeometry args={[0.04, 8, 8]} />
      <primitive object={material} attach="material" />
      {/* Optional: Add a real point light for every N lights if performance allows, 
          but usually bloom is enough for "lights" visual */}
    </instancedMesh>
  );
};

export default LightString;