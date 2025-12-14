import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, CONFIG } from '../constants';
import { AppState } from '../types';

interface Props {
  appState: AppState;
}

const TreeTopper: React.FC<Props> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create the 5-pointed star shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.8;
    const innerRadius = 0.4;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    
    // Center the geometry so it rotates around its center
    geometry.center();
    return geometry;
  }, []);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Rotate constantly
    groupRef.current.rotation.y += delta * 0.8;
    
    // Float logic
    let targetY = CONFIG.TREE_HEIGHT / 2 + 0.8; // Position slightly above the tree tip
    
    if (appState !== AppState.TREE) {
      targetY += 1.5; // Float higher when scattered
    }
    
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      CONFIG.TRANSITION_SPEED
    );
  });

  return (
    <group ref={groupRef} position={[0, CONFIG.TREE_HEIGHT / 2, 0]}>
      <mesh geometry={starGeometry}>
        <meshStandardMaterial 
          color={COLORS.GOLD} 
          emissive={COLORS.GOLD} 
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.9}
          toneMapped={false}
        />
      </mesh>
      
       {/* Point Light for Glow */}
       <pointLight color={COLORS.GOLD} intensity={3} distance={8} decay={2} />
    </group>
  );
};

export default TreeTopper;