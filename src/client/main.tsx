import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ModProvider } from './contexts/ModContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModProvider>
      <App />
    </ModProvider>
  </StrictMode>
);
