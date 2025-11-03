import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ModProvider } from './contexts/ModContext';
import { MainPostsProvider } from './contexts/MainPostsContext';
import { SeparatePostsProvider } from './contexts/SeparatePostsContext';
import { CommentsProvider } from './contexts/CommentsContext';
import { SubredditSettingsProvider } from './contexts/SubredditSettingsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SubredditSettingsProvider>
      <ModProvider>
        <MainPostsProvider>
          <SeparatePostsProvider>
            <CommentsProvider>
              <App />
            </CommentsProvider>
          </SeparatePostsProvider>
        </MainPostsProvider>
      </ModProvider>
    </SubredditSettingsProvider>
  </StrictMode>
);
