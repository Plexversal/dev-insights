import { useInit } from './hooks/useInit';
import { PostDisplay } from './components/PostDisplay';
import { CommentDisplay } from './components/CommentDisplay';
import Footer from './components/Footer';
import { ScrollButtons } from './components/ScrollButtons';
import { usePosts } from './hooks/usePosts';
import { useComments } from './hooks/useComments';
import { useState, useEffect } from 'react';
import { trackAnalytics } from './lib/trackAnalytics';
import { Notification } from './lib/icons/Notification';
import { useNotifications } from './hooks/useNotifications';

export const App = () => {
  const { username, postId } = useInit();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [postsPage, setPostsPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  const { posts, loadMorePosts, hasMore: postsHasMore, loading: postsLoading, loadingMore: postsLoadingMore } = usePosts();
  const { comments, loadMoreComments, hasMore: commentsHasMore, loading: commentsLoading, loadingMore: commentsLoadingMore } = useComments();
  const { isEnabled: notificationsEnabled, loading: notificationsLoading, toggleNotifications } = useNotifications();

  // Track window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation handlers for posts
  const handlePostsNext = async () => {
    const postsPerView = 3;
    const totalPages = Math.ceil(posts.length / postsPerView);

    if (postsPage >= totalPages - 1 && postsHasMore) {
      await loadMorePosts();
    }
    setPostsPage(prev => prev + 1);
  };

  const handlePostsPrev = () => {
    setPostsPage(prev => Math.max(0, prev - 1));
  };

  // Navigation handlers for comments
  const handleCommentsNext = async () => {
    const commentsPerView = isMobile ? 2 : 4;
    const totalPages = Math.ceil(comments.length / commentsPerView);

    if (commentsPage >= totalPages - 1 && commentsHasMore) {
      await loadMoreComments();
    }
    setCommentsPage(prev => prev + 1);
  };

  const handleCommentsPrev = () => {
    setCommentsPage(prev => Math.max(0, prev - 1));
  };

  // Calculate navigation state for current tab
  const postsPerView = 3;
  const commentsPerView = isMobile ? 2 : 4;
  const postsTotalPages = Math.ceil(posts.length / postsPerView);
  const commentsTotalPages = Math.ceil(comments.length / commentsPerView);

  const canGoPrev = activeTab === 'posts' ? postsPage > 0 : commentsPage > 0;
  const canGoNext = activeTab === 'posts'
    ? (postsPage < postsTotalPages - 1 || postsHasMore)
    : (commentsPage < commentsTotalPages - 1 || commentsHasMore);
  const loading = activeTab === 'posts' ? postsLoadingMore : commentsLoadingMore;

  const handleNext = activeTab === 'posts' ? handlePostsNext : handleCommentsNext;
  const handlePrev = activeTab === 'posts' ? handlePostsPrev : handleCommentsPrev;

  const handleTabSwitch = (tab: 'posts' | 'comments') => {
    trackAnalytics(); // Track user interaction
    setActiveTab(tab);
  };

  console.log(`[App] Current postId: ${postId}`);
  return (
    <div className="flex relative flex-col items-center min-h-screen gap-4 p-2">

      {/* Tabbed Interface */}
      <div className="w-full max-w-2xl flex-1">
        {/* Tab Buttons */}
        <div className="flex justify-between pb-2 mb-3 border-b border-gray-300 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabSwitch('posts')}
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
              onClick={() => handleTabSwitch('comments')}
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
          <div>
            {
              !notificationsLoading && <button
              onClick={toggleNotifications}
              disabled={notificationsLoading}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={notificationsEnabled ? 'Notifications enabled - Click to disable' : 'Notifications disabled - Click to enable'}
            >
              <Notification
                color="currentColor"
                className="text-gray-900 dark:text-gray-200 transition-transform duration-200 hover:scale-110"
                filled={notificationsEnabled}
              />
            </button>
            }
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <PostDisplay postId={postId} currentPage={postsPage} onPageChange={setPostsPage} />
        ) : (
          <CommentDisplay postId={postId} currentPage={commentsPage} onPageChange={setCommentsPage} isMobile={isMobile} />
        )}
      </div>

      {/* Navigation Buttons - positioned above footer */}
      <div className="w-full max-w-2xl relative">
        <ScrollButtons
          onPrevious={handlePrev}
          onNext={handleNext}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          loading={loading}
        />
      </div>

      <Footer />

    </div>
  );
};
