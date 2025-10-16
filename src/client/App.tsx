import { useInit } from './hooks/useInit';
import { PostDisplay } from './components/PostDisplay';
import { CommentDisplay } from './components/CommentDisplay';
import Footer from './components/Footer';
import { useState } from 'react';

export const App = () => {
  const { username, postId } = useInit();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  console.log(`[App] Current postId: ${postId}`);
  return (
    <div className="flex relative flex-col items-center min-h-screen gap-4 bg-white dark:bg-black p-2">

      {/* Tabbed Interface */}
      <div className="w-full max-w-2xl">
        {/* Tab Buttons */}
        <div className="flex gap-2 pb-2 mb-3 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-4 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                : 'bg-transparent text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={{ borderRadius: '18px' }}
          >
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-2 px-4 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                : 'bg-transparent text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={{ borderRadius: '18px' }}
          >
            Official Replies
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <PostDisplay postId={postId} />
        ) : (
          <CommentDisplay postId={postId} />
        )}
      </div>
      <Footer />

    </div>
  );
};
