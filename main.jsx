import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Updated filename
import './styles.css';       // ensure styles.css exists at this path

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
