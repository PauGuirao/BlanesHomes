import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n'

// Add preload hint for hero image
const preloadHeroImage = () => {
  const linkElement = document.createElement('link');
  linkElement.rel = 'preload';
  linkElement.as = 'image';
  linkElement.href = '/images/hero-right.webp';
  linkElement.type = 'image/webp';
  linkElement.fetchPriority = 'high';
  document.head.appendChild(linkElement);
};

// Execute preload before React renders
preloadHeroImage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
