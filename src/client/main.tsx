import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ModProvider } from './contexts/ModContext';
import { PostsProvider } from './contexts/PostsContext';
import { CommentsProvider } from './contexts/CommentsContext';
import { SubredditSettingsProvider } from './contexts/SubredditSettingsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SubredditSettingsProvider>
      <ModProvider>
        <PostsProvider>
          <CommentsProvider>
            <App />
          </CommentsProvider>
        </PostsProvider>
      </ModProvider>
    </SubredditSettingsProvider>
  </StrictMode>
);
