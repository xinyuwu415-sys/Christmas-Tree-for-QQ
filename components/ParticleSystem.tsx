import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleData, AppState } from '../types';
import { COLORS, CONFIG } from '../constants';

interface Props {
  appState: AppState;
  particles: ParticleData[];
}

const ParticleSystem: React.FC<Props> = ({ appState, particles }) => {
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const cubeRef = useRef<THREE.InstancedMesh>(null);
  const caneRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Filter particles by type
  const { spheres, cubes, canes } = useMemo(() => {
    return {
      spheres: particles.filter(p => p.type === 'sphere'),
      cubes: particles.filter(p => p.type === 'cube'),
      canes: particles.filter(p => p.type === 'cane'),
    };
  }, [particles]);

  // Material setup - highly reflective/shiny for Christmas ornaments
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.GOLD, // Base color, will be overridden by instance color
    roughness: 0.1,
    metalness: 0.8,
    emissive: new THREE.Color(COLORS.GOLD_DARK),
    emissiveIntensity: 0.2,
  }), []);

  // Helper to update colors for a mesh
  const updateColors = (mesh: THREE.InstancedMesh | null, data: ParticleData[]) => {
    if (mesh) {
      data.forEach((p, i) => {
        const color = new THREE.Color(p.color);
        mesh.setColorAt(i, color);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  };

  useEffect(() => {
    updateColors(sphereRef.current, spheres);
    updateColors(cubeRef.current, cubes);
    updateColors(caneRef.current, canes);
  }, [spheres, cubes, canes]);

  // Helper to animate particles
  const animateParticles = (
    mesh: THREE.InstancedMesh | null, 
    data: ParticleData[], 
    state: any, 
    delta: number
  ) => {
    if (!mesh) return;

    data.forEach((particle, i) => {
      // Determine target position based on state
      let target: THREE.Vector3;
      
      if (appState === AppState.TREE) {
        target = new THREE.Vector3(...particle.position);
      } else {
        // SCATTERED or FOCUS
        target = new THREE.Vector3(...particle.randomPosition);
        
        // Add subtle floating movement in scattered state
        const time = state.clock.getElapsedTime();
        target.y += Math.sin(time + particle.id) * 0.02;
        target.x += Math.cos(time + particle.id) * 0.02;
      }

      // Get current instance matrix
      mesh.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Lerp position
      dummy.position.lerp(target, CONFIG.TRANSITION_SPEED);

      // Rotate particles slightly for shine
      dummy.rotation.x += delta * 0.5;
      dummy.rotation.y += delta * 0.5;

      // Scale animation for open/close
      const targetScale = particle.scale;
      dummy.scale.setScalar(THREE.MathUtils.lerp(dummy.scale.x, targetScale, 0.1));

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, delta) => {
    animateParticles(sphereRef.current, spheres, state, delta);
    animateParticles(cubeRef.current, cubes, state, delta);
    animateParticles(caneRef.current, canes, state, delta);
  });

  return (
    <group>
      {/* Spheres */}
      {spheres.length > 0 && (
        <instancedMesh
          ref={sphereRef}
          args={[undefined, undefined, spheres.length]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[0.15, 16, 16]} />
          <primitive object={material} attach="material" />
        </instancedMesh>
      )}

      {/* Cubes (Gifts) */}
      {cubes.length > 0 && (
        <instancedMesh
          ref={cubeRef}
          args={[undefined, undefined, cubes.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <primitive object={material} attach="material" />
        </instancedMesh>
      )}

      {/* Canes (Cylinders) */}
      {canes.length > 0 && (
        <instancedMesh
          ref={caneRef}
          args={[undefined, undefined, canes.length]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <primitive object={material} attach="material" />
        </instancedMesh>
      )}
    </group>
  );
};

export default ParticleSystem;