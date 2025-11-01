import { create } from 'zustand';

const useMoodStore = create((set) => ({
  quotes: [],
  images: [],
  audioFiles: [],
  usedQuotes: new Set(),
  usedImages: new Set(),
  usedAudios: new Set(),
  soundEnabled: false,
  chimeEnabled: true,
  particlesEnabled: true,
  currentTheme: 'default',
  savedMoods: [],
  
  setQuotes: (quotes) => set({ quotes }),
  setImages: (images) => set({ images }),
  setAudioFiles: (audioFiles) => set({ audioFiles }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleChime: () => set((state) => ({ chimeEnabled: !state.chimeEnabled })),
  toggleParticles: () => set((state) => ({ particlesEnabled: !state.particlesEnabled })),
  setTheme: (theme) => set({ currentTheme: theme }),
  saveMood: (mood) => set((state) => ({ savedMoods: [...state.savedMoods, mood] })),
  
  markQuoteUsed: (quoteId) => set((state) => ({
    usedQuotes: new Set([...state.usedQuotes, quoteId])
  })),
  markImageUsed: (imageId) => set((state) => ({
    usedImages: new Set([...state.usedImages, imageId])
  })),
  markAudioUsed: (audioId) => set((state) => ({
    usedAudios: new Set([...state.usedAudios, audioId])
  })),
}));

export default useMoodStore;