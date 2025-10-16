import { useInit } from './hooks/useInit';
import { PostDisplay } from './components/PostDisplay';
import { CommentDisplay } from './components/CommentDisplay';
import Header from './components/Header';
import { useState } from 'react';

export const App = () => {
  const { username, postId } = useInit();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  console.log(`[App] Current postId: ${postId}`);
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-white dark:bg-black p-2">
      <Header />

      {/* Tabbed Interface */}
      <div className="w-full max-w-2xl">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-1.5 px-3 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-blue-400 text-white'
                : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3a3a3a]'
            }`}
          >
            Dev Posts
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-1.5 px-3 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-blue-400 text-white'
                : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3a3a3a]'
            }`}
          >
            Dev Comments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <PostDisplay postId={postId} />
        ) : (
          <CommentDisplay postId={postId} />
        )}
      </div>
    </div>
  );
};
