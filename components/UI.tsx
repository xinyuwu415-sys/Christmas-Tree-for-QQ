import React, { useState, useRef, useEffect } from 'react';
import { AppState, GestureType } from '../types';

interface Props {
  currentGesture: GestureType;
  appState: AppState;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handVector: { x: number; y: number };
}

const UI: React.FC<Props> = ({ currentGesture, appState, onUpload, handVector }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Convert normalized vector (-1 to 1) to screen percentage for cursor
  // Inverting X because webcam is mirrored usually, but handVector logic might vary.
  // Assuming handVector x: -1 (left) to 1 (right)
  const cursorLeft = `${(handVector.x + 1) * 50}%`; 
  const cursorTop = `${(handVector.y + 1) * 50}%`;

  useEffect(() => {
    // Attempt autoplay on mount
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.log("Autoplay prevented. Waiting for user interaction.");
          setIsPlaying(false);
        });
      }
    }
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-40 text-white overflow-hidden">
      <style>{`
        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .shiny-text {
          background: linear-gradient(
            90deg, 
            #FFD700 0%, 
            #FFF8C6 20%, 
            #FFFFFF 50%, 
            #FFF8C6 80%, 
            #FFD700 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shine 3s linear infinite;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        }
      `}</style>

      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/holidays/jingle_bells_instrumental.ogg" />

      {/* Hand Cursor */}
      {currentGesture !== GestureType.NONE && (
        <div 
            className={`absolute w-8 h-8 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out flex items-center justify-center
                ${currentGesture === GestureType.PINCH ? 'border-yellow-400 bg-yellow-400/30 scale-75' : 'border-emerald-400/50 bg-emerald-400/10'}
                shadow-[0_0_15px_rgba(0,255,100,0.5)]
            `}
            style={{ left: cursorLeft, top: cursorTop }}
        >
            <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-end items-start pointer-events-auto gap-4">
        {/* Music Toggle */}
        <button 
          onClick={toggleMusic}
          className={`px-4 py-2 rounded-full border transition-all shadow-[0_0_10px_rgba(0,255,120,0.2)] backdrop-blur-sm flex items-center gap-2
            ${isPlaying 
              ? 'bg-emerald-900/80 hover:bg-emerald-800 border-emerald-500 text-emerald-100' 
              : 'bg-black/60 hover:bg-black/80 border-gray-500 text-gray-300'
            }`}
        >
          {isPlaying ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z"/>
                <path fillRule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z"/>
                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z"/>
              </svg>
              Playing
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                 <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/>
              </svg>
              Music Off
            </>
          )}
        </button>

        <label className="cursor-pointer bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500 text-emerald-100 px-4 py-2 rounded-full transition-all shadow-[0_0_10px_rgba(0,255,120,0.2)] backdrop-blur-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
          </svg>
          Add Photos
          <input type="file" multiple accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      </div>

      {/* Status Overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
        <h1 className={`text-4xl md:text-5xl font-serif shiny-text opacity-0 transition-opacity duration-700 ${appState === AppState.TREE ? 'opacity-100' : ''}`}>
          Merry Christmas QQ
        </h1>
        {appState === AppState.FOCUS && (
             <div className="mt-8 text-2xl text-white font-light tracking-widest animate-pulse">MEMORY</div>
        )}
      </div>

      {/* Footer / Instructions */}
      <div className="flex flex-col gap-4 max-w-md bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <div className="flex items-center justify-between text-sm uppercase tracking-widest text-emerald-400 font-bold mb-2">
          <span>Control Panel</span>
          <span className={`px-2 py-0.5 rounded ${currentGesture !== GestureType.NONE ? 'bg-yellow-500 text-black' : 'bg-white/10'}`}>
             Detected: {currentGesture}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
           <div className={`p-2 rounded flex items-center gap-2 ${appState === AppState.TREE ? 'bg-emerald-900/60 border border-emerald-500' : 'bg-black/20'}`}>
              <span className="text-xl">✊</span>
              <div>
                <p className="font-bold text-white">Fist</p>
                <p>Assemble Tree</p>
              </div>
           </div>
           <div className={`p-2 rounded flex items-center gap-2 ${appState === AppState.SCATTERED ? 'bg-emerald-900/60 border border-emerald-500' : 'bg-black/20'}`}>
              <span className="text-xl">🖐</span>
              <div>
                <p className="font-bold text-white">Open Hand</p>
                <p>Scatter Cloud</p>
              </div>
           </div>
           <div className={`p-2 rounded flex items-center gap-2 ${appState === AppState.SCATTERED ? 'text-yellow-200' : ''}`}>
              <span className="text-xl">👋</span>
              <div>
                <p className="font-bold text-white">Move Hand</p>
                <p>Rotate View</p>
              </div>
           </div>
           <div className={`p-2 rounded flex items-center gap-2 ${appState === AppState.FOCUS ? 'bg-emerald-900/60 border border-emerald-500' : 'bg-black/20'}`}>
              <span className="text-xl">👌</span>
              <div>
                <p className="font-bold text-white">Pinch</p>
                <p>Grab Photo</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UI;