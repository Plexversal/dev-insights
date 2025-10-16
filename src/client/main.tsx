import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ModProvider } from './contexts/ModContext';
import { PostsProvider } from './contexts/PostsContext';
import { CommentsProvider } from './contexts/CommentsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModProvider>
      <PostsProvider>
        <CommentsProvider>
          <App />
        </CommentsProvider>
      </PostsProvider>
    </ModProvider>
  </StrictMode>
);
