import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MoodBoard from './src/components/MoodBoard';
import useMoodStore from './src/store/moodStore';

function App() {
  const { setQuotes, setImages, setAudioFiles } = useMoodStore();

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const [quotesResponse, moodsResponse] = await Promise.all([
          fetch('/assets/quotes.json'),
          fetch('/data/moods.json')
        ]);

        const quotes = await quotesResponse.json();
        const moods = await moodsResponse.json();

        setQuotes(quotes);
        setImages(moods.images || []);
        setAudioFiles(moods.audio || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [setQuotes, setImages, setAudioFiles]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MoodBoard />} />
      </Routes>
    </Router>
  );
}

export default App;
