import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { GameProvider } from './app/GameContext';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Laneway Tycoon could not find its application root.');

createRoot(root).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
