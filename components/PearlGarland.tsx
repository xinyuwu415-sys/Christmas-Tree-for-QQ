import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleData, AppState } from '../types';
import { COLORS, CONFIG } from '../constants';

interface Props {
  appState: AppState;
  data: ParticleData[];
}

const PearlGarland: React.FC<Props> = ({ appState, data }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Updated Material: Pure White
  // Using pure white emissive color and zero metalness to eliminate any grey/silver perception.
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',        
    roughness: 0.3,          
    metalness: 0.0,          // Set to 0 to avoid metallic/silver look
    emissive: '#FFFFFF',     // Pure white glow
    emissiveIntensity: 0.8,  // High intensity for brightness
    clearcoat: 1.0,          
    clearcoatRoughness: 0.1,
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    data.forEach((particle, i) => {
      let target: THREE.Vector3;
      
      if (appState === AppState.TREE) {
        target = new THREE.Vector3(...particle.position);
      } else {
        target = new THREE.Vector3(...particle.randomPosition);
        // Floating effect
        const time = state.clock.getElapsedTime();
        target.y += Math.sin(time + particle.id) * 0.03;
        target.x += Math.cos(time + particle.id * 0.5) * 0.03;
      }

      meshRef.current!.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      dummy.position.lerp(target, CONFIG.TRANSITION_SPEED);
      
      // Scale logic
      const targetScale = particle.scale;
      dummy.scale.setScalar(THREE.MathUtils.lerp(dummy.scale.x, targetScale, 0.1));

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, data.length]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  );
};

export default PearlGarland;