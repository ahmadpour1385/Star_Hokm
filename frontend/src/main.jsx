import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.expand();
  const setVh = () => {
    document.documentElement.style.setProperty(
      '--tg-viewport-height',
      `${tg.viewportStableHeight || tg.viewportHeight}px`
    );
  };
  setVh();
  tg.onEvent('viewportChanged', setVh);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
