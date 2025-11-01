import React, { useEffect, useState, useRef } from 'react';
import { useAudioContext } from './hooks/useAudioContext';
import { useParticles } from './hooks/useParticles';
import { useMoodStore } from './store/moodStore';
import './App.css';

function App() {
  const {
    quotes,
    images,
    audioFiles,
    audioEnabled,
    particlesEnabled,
    chimeEnabled,
    currentTheme,
    ambientLightingEnabled,
    motionTrailsEnabled,
    savedMoods,
    setQuotes,
    setImages,
    setAudioFiles,
    toggleAudio,
    toggleParticles,
    toggleChime,
    setTheme
  } = useMoodStore();

  const { initAudio, playAmbient, stopAmbient } = useAudioContext();
  const { initParticles, stopParticles } = useParticles();

  useEffect(() => {
    // Initialize audio context when enabled
    if (audioEnabled) {
      initAudio();
    }
  }, [audioEnabled, initAudio]);

  const [currentQuote, setCurrentQuote] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const canvasRef = useRef(null);
  const motionTrailsCanvasRef = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [quotesRes, moodsRes] = await Promise.all([
          fetch('/assets/quotes.json'),
          fetch('/data/moods.json')
        ]);

        const quotesData = await quotesRes.json();
        const moodsData = await moodsRes.json();

        setQuotes(quotesData);
        setImages(moodsData.images || []);
        setAudioFiles(moodsData.audio || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [setQuotes, setImages, setAudioFiles]);

  // Initialize particles
  useEffect(() => {
    if (particlesEnabled && canvasRef.current) {
      initParticles(canvasRef.current);
    } else {
      stopParticles();
    }
  }, [particlesEnabled, initParticles, stopParticles]);

  // Initialize motion trails
  useEffect(() => {
    if (motionTrailsEnabled && motionTrailsCanvasRef.current) {
      const ctx = motionTrailsCanvasRef.current.getContext('2d');
      // Initialize motion trails effect
      const handleMouseMove = (e) => {
        if (!ctx) return;
        const { clientX, clientY } = e;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(clientX, clientY, 5, 0, Math.PI * 2);
        ctx.fill();
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [motionTrailsEnabled]);

  // Generate new vibe
  const generateNewVibe = () => {
    // Select random quote
    const availableQuotes = quotes.filter(q => !usedQuotes.has(q.id));
    if (availableQuotes.length > 0) {
      const quote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
      setCurrentQuote(quote);
    }

    // Select random image
    const availableImages = images.filter(img => !usedImages.has(img.id));
    if (availableImages.length > 0) {
      const image = availableImages[Math.floor(Math.random() * availableImages.length)];
      setCurrentImage(image);
    }

    // Select random audio
    const availableAudio = audioFiles.filter(audio => !usedAudios.has(audio.id));
    if (availableAudio.length > 0) {
      const audio = availableAudio[Math.floor(Math.random() * availableAudio.length)];
      setCurrentAudio(audio);
      if (audioEnabled) {
        playAmbient(audio.url);
      }
    }
  };

  return (
    <div className={`app-container theme-${currentTheme}`}>
      <canvas 
        ref={canvasRef}
        className={`particles-canvas ${particlesEnabled ? 'active' : ''}`} 
      />
      
      {motionTrailsEnabled && (
        <canvas 
          ref={motionTrailsCanvasRef}
          className="motion-trails-canvas" 
        />
      )}

      <div className="content">
        {currentQuote && (
          <div className="quote-container">
            <p className="quote-text">{currentQuote.text}</p>
            {currentQuote.author && (
              <p className="quote-author">- {currentQuote.author}</p>
            )}
          </div>
        )}

        {currentImage && (
          <div className="image-container">
            <img 
              src={currentImage.url} 
              alt={currentImage.description || 'Mood image'} 
              className="mood-image"
            />
          </div>
        )}
      </div>

      <div className="controls">
        <button onClick={toggleAudio} className="control-btn">
          {audioEnabled ? 'Sound On' : 'Sound Off'}
        </button>
        <button onClick={toggleChime} className="control-btn">
          {chimeEnabled ? 'Chime On' : 'Chime Off'}
        </button>
        <button onClick={toggleParticles} className="control-btn">
          {particlesEnabled ? 'Particles On' : 'Particles Off'}
        </button>
        <button onClick={generateNewVibe} className="control-btn generate-btn">
          Generate New Vibe
        </button>
        <select 
          value={currentTheme} 
          onChange={(e) => setTheme(e.target.value)}
          className="theme-select"
        >
          <option value="default">Default Theme</option>
          <option value="warm">Warm Theme</option>
          <option value="cool">Cool Theme</option>
          {customThemes.map(theme => (
            <option key={theme.name} value={theme.name}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      {savedMoods.length > 0 && (
        <div className="saved-moods">
          <h3>Saved Moods</h3>
          <div className="mood-list">
            {savedMoods.map((mood, index) => (
              <div key={index} className="saved-mood-item">
                <p>{mood.quote?.text}</p>
                {mood.image && (
                  <img 
                    src={mood.image.url} 
                    alt="Saved mood" 
                    className="saved-mood-image"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;