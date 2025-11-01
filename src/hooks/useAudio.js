import { useState, useCallback } from 'react';

const useAudio = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [filterNode, setFilterNode] = useState(null);
  const [chimeBuffer, setChimeBuffer] = useState(null);
  const [ambientBuffers, setAmbientBuffers] = useState([]);

  const initAudio = useCallback(async () => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    gain.connect(filter);
    filter.connect(context.destination);

    setAudioContext(context);
    setGainNode(gain);
    setFilterNode(filter);

    // Load chime sound
    try {
      const response = await fetch('/assets/audio/chime.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      setChimeBuffer(audioBuffer);
    } catch (error) {
      console.error('Error loading chime:', error);
    }
  }, []);

  const playChime = useCallback(() => {
    if (!audioContext || !chimeBuffer || !gainNode) return;

    const source = audioContext.createBufferSource();
    source.buffer = chimeBuffer;
    source.connect(gainNode);
    source.start();
  }, [audioContext, chimeBuffer, gainNode]);

  const playAmbient = useCallback((buffer) => {
    if (!audioContext || !gainNode) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();

    return source;
  }, [audioContext, gainNode]);

  const stopAmbient = useCallback((source) => {
    if (source) {
      source.stop();
    }
  }, []);

  return {
    initAudio,
    playChime,
    playAmbient,
    stopAmbient,
    audioContext,
    gainNode,
    filterNode,
  };
};

export default useAudio;