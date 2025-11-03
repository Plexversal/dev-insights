import { useInit } from './hooks/useInit';
import { PostDisplay } from './components/PostDisplay';
import { CommentDisplay } from './components/CommentDisplay';
import Footer from './components/Footer';
import { ScrollButtons } from './components/ScrollButtons';
import { useMainPosts } from './contexts/MainPostsContext';
import { useSeparatePosts } from './contexts/SeparatePostsContext';
import { useComments } from './hooks/useComments';
import { useSubredditSettings } from './contexts/SubredditSettingsContext';
import { useState, useEffect } from 'react';
import { trackAnalytics } from './lib/trackAnalytics';
import { Notification } from './lib/icons/Notification';
import { useNotifications } from './hooks/useNotifications';
import { parseSeparateTabFormat } from './lib/parseSeparateTabFormat';

export const App = () => {
  const { username, postId } = useInit();
  const { postsButtonName, commentsButtonName, bottomSubtitle, disabledComments, separateTabPostFlair1, loading: settingsLoading } = useSubredditSettings();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'separateTab'>('posts');
  const [postsPage, setPostsPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);
  const [separateTabPage, setSeparateTabPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  // Parse separate tab setting
  const separateTabConfig = parseSeparateTabFormat(separateTabPostFlair1);

  // Use separate hooks for main and separate tab posts
  const mainPosts = useMainPosts();
  const separatePosts = useSeparatePosts();
  const { comments, loadMoreComments, hasMore: commentsHasMore, loading: commentsLoading, loadingMore: commentsLoadingMore } = useComments();
  // const { isEnabled: notificationsEnabled, loading: notificationsLoading, toggleNotifications } = useNotifications();

  // Update filters when separate tab config changes
  useEffect(() => {
    const flairFilter = separateTabConfig?.flairText;
    mainPosts.setFlairFilter(flairFilter);
    separatePosts.setFlairFilter(flairFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [separateTabConfig?.flairText]);

  // Track window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabSwitch = (tab: 'posts' | 'comments' | 'separateTab') => {
    trackAnalytics(); // Track user interaction
    setActiveTab(tab);
  };

  return (
    <div className="flex relative flex-col items-center min-h-screen gap-4 p-2">

      {/* Tabbed Interface */}
      <div className="w-full max-w-2xl flex-1">
        {/* Tab Buttons */}
          {!settingsLoading && (
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
                  {postsButtonName}
                </button>
                {separateTabConfig && (
                  <button
                    onClick={() => handleTabSwitch('separateTab')}
                    className={`py-2 px-4 text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'separateTab'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                        : 'bg-transparent text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    style={{ borderRadius: '18px' }}
                  >
                    {separateTabConfig.tabName}
                  </button>
                )}
                {!disabledComments && (
                  <button
                    onClick={() => handleTabSwitch('comments')}
                    className={`py-2 px-4 text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'comments'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                        : 'bg-transparent text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    style={{ borderRadius: '18px' }}
                  >
                    {commentsButtonName}
                  </button>
                )}
              </div>
              {/* <div>
                {!notificationsLoading && (
                  <button
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
                )}
              </div> */}
            </div>
          )}

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <PostDisplay
            currentPage={postsPage}
            posts={mainPosts.posts}
            loading={mainPosts.loading}
            refreshPosts={mainPosts.refreshPosts}
          />
        ) : activeTab === 'separateTab' ? (
          <PostDisplay
            currentPage={separateTabPage}
            posts={separatePosts.posts}
            loading={separatePosts.loading}
            refreshPosts={separatePosts.refreshPosts}
          />
        ) : !disabledComments ? (
          <CommentDisplay postId={postId} currentPage={commentsPage} onPageChange={setCommentsPage} isMobile={isMobile} />
        ) : null}
      </div>

      {/* Navigation Buttons - positioned above footer */}
      <div className="w-full max-w-2xl relative">
        {activeTab === 'posts' ? (
          <ScrollButtons
            currentPage={postsPage}
            setPage={setPostsPage}
            totalItems={mainPosts.posts.length}
            itemsPerPage={3}
            hasMoreToLoad={mainPosts.hasMore}
            loadMore={mainPosts.loadMorePosts}
            loadingMore={mainPosts.loadingMore}
          />
        ) : activeTab === 'separateTab' ? (
          <ScrollButtons
            currentPage={separateTabPage}
            setPage={setSeparateTabPage}
            totalItems={separatePosts.posts.length}
            itemsPerPage={3}
            hasMoreToLoad={separatePosts.hasMore}
            loadMore={separatePosts.loadMorePosts}
            loadingMore={separatePosts.loadingMore}
          />
        ) : (
          <ScrollButtons
            currentPage={commentsPage}
            setPage={setCommentsPage}
            totalItems={comments.length}
            itemsPerPage={isMobile ? 2 : 4}
            hasMoreToLoad={commentsHasMore}
            loadMore={loadMoreComments}
            loadingMore={commentsLoadingMore}
          />
        )}
      </div>

      <Footer subtitle={bottomSubtitle} loading={settingsLoading} />

    </div>
  );
};
