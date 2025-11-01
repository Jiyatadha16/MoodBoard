import { useState, useCallback } from 'react';

export const useAudioContext = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [filterNode, setFilterNode] = useState(null);
  const [currentSource, setCurrentSource] = useState(null);

  const initAudio = useCallback(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    gain.connect(filter);
    filter.connect(context.destination);

    setAudioContext(context);
    setGainNode(gain);
    setFilterNode(filter);
  }, []);

  const playAmbient = useCallback((buffer) => {
    if (!audioContext || !gainNode) return;

    // Stop current source if any
    if (currentSource) {
      currentSource.stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();

    setCurrentSource(source);
    return source;
  }, [audioContext, gainNode, currentSource]);

  const stopAmbient = useCallback(() => {
    if (currentSource) {
      currentSource.stop();
      setCurrentSource(null);
    }
  }, [currentSource]);

  return {
    audioContext,
    gainNode,
    filterNode,
    initAudio,
    playAmbient,
    stopAmbient
  };
};