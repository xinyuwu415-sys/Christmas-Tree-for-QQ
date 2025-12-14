import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Experience from './components/Experience';
import UI from './components/UI';
import HandTracker from './components/HandTracker';
import { AppState, GestureType, ParticleData, PhotoData } from './types';
import { CONFIG, DEFAULT_PHOTOS, COLORS } from './constants';
import * as THREE from 'three';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [currentGesture, setCurrentGesture] = useState<GestureType>(GestureType.NONE);
  const [handVector, setHandVector] = useState({ x: 0, y: 0 });
  const [userPhotos, setUserPhotos] = useState<string[]>(DEFAULT_PHOTOS);
  const [focusedPhotoId, setFocusedPhotoId] = useState<string | null>(null);

  // 1. Base Tree Particles (Ornaments)
  const particles = useMemo<ParticleData[]>(() => {
    const temp: ParticleData[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      // Tree Spiral Position
      const y = ((i / (CONFIG.PARTICLE_COUNT - 1)) * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
      const radius = (CONFIG.TREE_HEIGHT / 2 - y) * (CONFIG.TREE_RADIUS_BOTTOM / CONFIG.TREE_HEIGHT);
      const theta = i * goldenAngle;
      
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);

      const rx = (Math.random() - 0.5) * 20;
      const ry = (Math.random() - 0.5) * 20;
      const rz = (Math.random() - 0.5) * 10;

      const isGold = Math.random() > 0.7;
      const color = isGold ? COLORS.GOLD : (Math.random() > 0.5 ? COLORS.RED : COLORS.EMERALD_LIGHT);
      
      // Randomize Shape Type
      const typeRoll = Math.random();
      let type: 'sphere' | 'cube' | 'cane' = 'sphere';
      if (typeRoll > 0.7) type = 'cube';
      if (typeRoll > 0.9) type = 'cane';

      temp.push({
        id: i,
        position: [x, y, z],
        randomPosition: [rx, ry, rz],
        type: type,
        color: color,
        scale: Math.random() * 0.5 + 0.5,
      });
    }
    return temp;
  }, []);

  // 2. Pearl Garland (Double Helix - Strand 1)
  const pearls = useMemo<ParticleData[]>(() => {
    const temp: ParticleData[] = [];
    const count = 300;
    const turns = 5;
    
    for (let i = 0; i < count; i++) {
        const t = i / count;
        const y = (t * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
        // Slightly larger radius than tree to sit on top
        const radius = ((CONFIG.TREE_HEIGHT / 2 - y) * (CONFIG.TREE_RADIUS_BOTTOM / CONFIG.TREE_HEIGHT)) + 0.2; 
        const theta = t * Math.PI * 2 * turns; // Spiral angle

        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);

        const rx = (Math.random() - 0.5) * 25;
        const ry = (Math.random() - 0.5) * 25;
        const rz = (Math.random() - 0.5) * 15;

        temp.push({
            id: i + 10000,
            position: [x, y, z],
            randomPosition: [rx, ry, rz],
            type: 'sphere',
            color: COLORS.PEARL,
            scale: 1, // handled in component
        });
    }
    return temp;
  }, []);

  // 3. Light String (Double Helix - Strand 2, offset by PI)
  const lights = useMemo<ParticleData[]>(() => {
    const temp: ParticleData[] = [];
    const count = 350;
    const turns = 5;
    
    for (let i = 0; i < count; i++) {
        const t = i / count;
        const y = (t * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2);
        const radius = ((CONFIG.TREE_HEIGHT / 2 - y) * (CONFIG.TREE_RADIUS_BOTTOM / CONFIG.TREE_HEIGHT)) + 0.3; 
        // Offset theta by PI (180 deg) to be on opposite side
        const theta = (t * Math.PI * 2 * turns) + Math.PI; 

        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);

        const rx = (Math.random() - 0.5) * 25;
        const ry = (Math.random() - 0.5) * 25;
        const rz = (Math.random() - 0.5) * 15;

        temp.push({
            id: i + 20000,
            position: [x, y, z],
            randomPosition: [rx, ry, rz],
            type: 'sphere',
            color: COLORS.LIGHT_WARM,
            scale: 1, 
        });
    }
    return temp;
  }, []);

  // Generate Photo Data
  const photos = useMemo<PhotoData[]>(() => {
    return userPhotos.map((url, index) => {
       const y = ((index / userPhotos.length) * CONFIG.TREE_HEIGHT) - (CONFIG.TREE_HEIGHT / 2) + 1; 
       const radius = ((CONFIG.TREE_HEIGHT / 2 - y) * (CONFIG.TREE_RADIUS_BOTTOM / CONFIG.TREE_HEIGHT)) + 0.6; 
       const theta = index * (Math.PI * 2 / userPhotos.length) + (Math.PI / 2); // Offset photo angle
       
       const x = radius * Math.cos(theta);
       const z = radius * Math.sin(theta);

       const rx = (Math.random() - 0.5) * 15;
       const ry = (Math.random() - 0.5) * 15;
       const rz = (Math.random() - 0.5) * 5 + 5; 

       return {
         id: `photo-${index}`,
         url,
         position: [x, y, z],
         randomPosition: [rx, ry, rz],
         aspectRatio: 1.5, 
       };
    });
  }, [userPhotos]);

  // Handle Gesture State Transitions
  const handleGestureDetect = useCallback((gesture: GestureType) => {
    setCurrentGesture(gesture);
    
    switch (gesture) {
      case GestureType.FIST:
        if (appState !== AppState.TREE) {
          setAppState(AppState.TREE);
          setFocusedPhotoId(null);
        }
        break;
      case GestureType.OPEN_PALM:
        if (appState !== AppState.SCATTERED) {
          setAppState(AppState.SCATTERED);
          setFocusedPhotoId(null);
        }
        break;
      case GestureType.PINCH:
        if (appState === AppState.SCATTERED) {
          setAppState(AppState.FOCUS);
          // Pick a random photo to focus on
          // In a more advanced version, we could use handVector to pick the closest photo
          const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
          setFocusedPhotoId(randomPhoto.id);
        }
        break;
    }
  }, [appState, photos]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newUrls = Array.from(e.target.files).map((file) => URL.createObjectURL(file as File));
      setUserPhotos(prev => [...prev, ...newUrls]);
    }
  };

  return (
    <div className="w-full h-full relative bg-black">
      <HandTracker 
        onGestureDetect={handleGestureDetect} 
        onHandMove={setHandVector} 
      />
      
      <UI 
        currentGesture={currentGesture} 
        appState={appState} 
        onUpload={handleFileUpload}
        handVector={handVector}
      />

      <Experience 
        appState={appState}
        particles={particles}
        pearls={pearls}
        lights={lights}
        photos={photos}
        handVector={handVector}
        focusedPhotoId={focusedPhotoId}
      />
    </div>
  );
};

export default App;