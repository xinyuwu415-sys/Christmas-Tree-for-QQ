import React, { useEffect, useRef, useState } from 'react';
import { GestureType, HandLandmark } from '../types';
import { detectGesture, getHandVector } from '../services/gestureService';

// Define minimal interface for MediaPipe Results since we are using global script
interface Results {
    multiHandLandmarks: HandLandmark[][];
    image: any;
    multiHandedness?: any;
}

interface Props {
  onGestureDetect: (gesture: GestureType) => void;
  onHandMove: (vector: { x: number; y: number }) => void;
}

const HandTracker: React.FC<Props> = ({ onGestureDetect, onHandMove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastGestureRef = useRef<GestureType>(GestureType.NONE);
  const gestureDebounceRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    let hands: any = null;
    let stream: MediaStream | null = null;
    let requestAnimationId: number;
    let isProcessing = false;

    const setupHands = () => {
      if (!videoRef.current) return null;

      // Access global Hands class loaded via script tag
      const Hands = (window as any).Hands;
      
      if (!Hands) {
        console.error("MediaPipe Hands script not loaded");
        return null;
      }

      const handsInstance = new Hands({
        locateFile: (file: string) => {
          // MUST match the version in index.html exactly
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        },
      });

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handsInstance.onResults((results: Results) => {
        if (!isMounted) return;
        
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
          onGestureDetect(GestureType.NONE);
          return;
        }

        const landmarks = results.multiHandLandmarks[0] as HandLandmark[];
        
        // 1. Detect Gesture
        const gesture = detectGesture(landmarks);
        
        // Debounce gesture changes slightly to prevent flickering
        const now = Date.now();
        if (gesture !== lastGestureRef.current && now - gestureDebounceRef.current > 200) {
          lastGestureRef.current = gesture;
          gestureDebounceRef.current = now;
          onGestureDetect(gesture);
        } else if (gesture === lastGestureRef.current) {
          onGestureDetect(gesture);
        }

        // 2. Track Hand Position for Camera
        const vector = getHandVector(landmarks);
        onHandMove(vector);
      });
      
      return handsInstance;
    };

    const startCamera = async () => {
      try {
        hands = setupHands();
        if (!hands) return;

        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: "user" 
            } 
        });
        
        // If unmounted while waiting for stream, clean up immediately
        if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            // Wait for video metadata to load and play
            await new Promise<void>((resolve) => {
                if (videoRef.current) {
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().then(() => resolve());
                    };
                }
            });
            
            if (!isMounted) return;
            setIsLoaded(true);
            
            const sendFrame = async () => {
                if (!isMounted) return;

                if (videoRef.current && videoRef.current.readyState >= 2 && !isProcessing) {
                   isProcessing = true;
                   try {
                     await hands.send({ image: videoRef.current });
                   } catch(e) {
                     // Log error but don't crash app. 
                     // 'Memory access out of bounds' usually happens if we send data to a closed instance.
                     // The isMounted check above helps prevent that.
                     console.error("Hands send error", e);
                   }
                   isProcessing = false;
                }
                
                // Only request next frame if still mounted
                if (isMounted) {
                    requestAnimationId = requestAnimationFrame(sendFrame);
                }
            }
            sendFrame();
        }
      } catch (e) {
        console.error("Error accessing webcam:", e);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (requestAnimationId) cancelAnimationFrame(requestAnimationId);
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      if (hands) {
          try {
            hands.close();
          } catch(e) {
            console.error("Error closing hands instance:", e);
          }
      }
    };
  }, [onGestureDetect, onHandMove]);

  return (
    <div className="absolute top-4 left-4 z-50 rounded-lg overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(0,255,100,0.3)]">
      {/* Hidden processing video */}
      <video
        ref={videoRef}
        className="w-32 h-24 object-cover transform -scale-x-100 opacity-80" // Mirror the video
        playsInline
        muted
      />
      {!isLoaded && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs text-white">Loading Vision...</div>}
    </div>
  );
};

export default HandTracker;