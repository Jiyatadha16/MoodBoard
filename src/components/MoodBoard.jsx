import React, { useEffect, useRef } from 'react';
import useMoodStore from '../store/moodStore';
import useAudio from '../hooks/useAudio';
import useParticles from '../hooks/useParticles';

const MoodBoard = () => {
  const {
    quotes,
    images,
    audioFiles,
    soundEnabled,
    chimeEnabled,
    particlesEnabled,
    currentTheme,
    toggleSound,
    toggleChime,
    toggleParticles,
    setTheme,
    markQuoteUsed,
    markImageUsed,
    markAudioUsed
  } = useMoodStore();

  const canvasRef = useRef(null);
  const { initAudio, playChime, playAmbient, stopAmbient } = useAudio();
  const { initParticles, updateParticles } = useParticles(canvasRef);

  useEffect(() => {
    if (canvasRef.current && particlesEnabled) {
      initParticles();
    }
  }, [particlesEnabled, initParticles]);

  useEffect(() => {
    if (soundEnabled) {
      initAudio();
    }
  }, [soundEnabled, initAudio]);

  const generateNewVibe = () => {
    // Your vibe generation logic here
    // This will be similar to your original changeVibe function
    // but adapted to use React state and refs
  };

  return (
    <div className={`mood-board theme-${currentTheme}`}>
      <canvas
        ref={canvasRef}
        className={`particles-canvas ${particlesEnabled ? 'active' : ''}`}
      />
      
      <div className="controls">
        <button onClick={toggleSound}>
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
        <button onClick={toggleChime}>
          {chimeEnabled ? 'Chime On' : 'Chime Off'}
        </button>
        <button onClick={toggleParticles}>
          {particlesEnabled ? 'Particles On' : 'Particles Off'}
        </button>
        <button onClick={generateNewVibe}>New Vibe</button>
      </div>

      {/* Add your quote display, image display, and other UI elements here */}
    </div>
  );
};

export default MoodBoard;