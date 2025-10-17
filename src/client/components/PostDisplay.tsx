import React from 'react';
import { navigateTo } from '@devvit/web/client';
import { usePosts } from '../hooks/usePosts';
import { cleanFlairText } from '../lib/cleanFlairText';
import { formatTimeAgo } from '../lib/formatTimeAgo';
import { deleteItem } from '../lib/deleteItem';
import { TrashCanIcon } from '../lib/icons/TrashCanIcon';
import { useMod } from '../contexts/ModContext';
import { trackAnalytics } from '../lib/trackAnalytics';

interface PostDisplayProps {
  postId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const PostDisplay: React.FC<PostDisplayProps> = ({ postId, currentPage, onPageChange }) => {
  const { posts, loading, loadingMore, subredditName, refreshPosts, loadMorePosts, hasMore, postCount, postsPerPage } = usePosts();
  const { isMod, loading: modLoading } = useMod()
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const [deletingPosts, setDeletingPosts] = React.useState<Set<string>>(new Set());

  // Show 3 posts at a time (1 large + 2 small)
  const postsPerView = 3;
  const visiblePosts = posts.slice(currentPage * postsPerView, (currentPage + 1) * postsPerView);

  const handlePostClick = (permalink: string) => {
    trackAnalytics(); // Track user interaction
    navigateTo(`https://www.reddit.com${permalink}`);
  };

  const handleUsernameClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post card click
    trackAnalytics(); // Track user interaction
    navigateTo(`https://www.reddit.com/user/${username}/`);
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (deletingPosts.has(postId)) return; // Prevent multiple clicks

    trackAnalytics(); // Track user interaction
    setDeletingPosts(prev => new Set(prev).add(postId));
    await deleteItem(postId, 'posts', refreshPosts);
    // Keep button disabled while refresh is in progress
  };

  // Clear deleting state when loading completes
  React.useEffect(() => {
    if (!loading) {
      setDeletingPosts(new Set());
    }
  }, [loading]);

  const handleImageError = (postId: string) => {
    setImageErrors(prev => new Set(prev).add(postId));
  };

  const getPostMedia = (post: any) => {
    // Priority: thumbnail > image > first gallery image
    if (post.thumbnail && post.thumbnail !== '') {
      return { type: 'image', url: post.thumbnail };
    }
    if (post.image && post.image !== '') {
      return { type: 'image', url: post.image };
    }
    if (post.galleryImages && post.galleryImages !== '') {
      try {
        const images = JSON.parse(post.galleryImages);
        if (images.length > 0) {
          return { type: 'image', url: images[0].url || images[0] };
        }
      } catch (e) {
        console.error('Failed to parse gallery images', e);
      }
    }
    return null;
  };

  const renderPost = (post: any, isLarge: boolean, isMostRecent: boolean = false) => {
    const media = getPostMedia(post);

    // On mobile (<600px), render all posts with the small post layout (horizontal)
    // On desktop (>=600px), differentiate between large and small posts
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
    const useSmallLayout = !isLarge || isMobile;

    if (useSmallLayout && !isLarge) {
      // Small post layout: horizontal on desktop (>600px), vertical on mobile
      return (
        <div
          key={post.id}
          className="h-full w-full p-2 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-600 dark:border-l-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors flex flex-col min-[600px]:flex-row gap-2"
          onClick={() => handlePostClick(post.permalink)}
        >
          {/* Mobile: Wrap username, title, and media together */}
          <div className="flex min-[600px]:hidden flex-col gap-2 flex-1">
            {/* Username - shown on mobile for all posts at the very top */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="font-medium text-gray-600 dark:text-gray-400 text-xs text-[14px] truncate underline cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                onClick={(e) => handleUsernameClick(post.authorName, e)}
              >
                {post.authorName}
              </span>
              {post.userFlairText && cleanFlairText(post.userFlairText) && (
                <span
                  className="text-[10px] px-1.5 rounded-[1.25rem] flex-shrink-0"
                  style={{
                    backgroundColor: post.flairBgColor === 'transparent' ? '#E4E4E4' : (post.flairBgColor || '#E4E4E4'),
                    color: post.flairTextColor || '#000000'
                  }}
                >
                  {cleanFlairText(post.userFlairText)}
                </span>
              )}
            </div>

            {/* Title for non-media posts on mobile - shown right after username */}
            {!media && (
              <div className="font-semibold text-base text-[22px] dark:text-gray-100 line-clamp-3">
                {post.title}
              </div>
            )}

            {/* Media on mobile */}
            {media && (
              <div className="w-full h-28 flex-shrink-0 overflow-hidden rounded-md relative">
                {imageErrors.has(post.id) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-[#1a1a1a] text-[10px] text-gray-600 dark:text-gray-400 text-center px-2">
                    <span>Media</span>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <img
                      src={media.url}
                      alt={post.title}
                      className="w-full h-full object-cover brightness-90"
                      onError={() => handleImageError(post.id)}
                    />
                  </div>
                )}

                {/* Title overlay - shown on mobile only */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                  <div className="font-semibold text-white text-[18px] line-clamp-2">
                    {post.title}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content on top (mobile) or right (desktop) - only shown on desktop */}
          <div className="hidden min-[600px]:flex flex-col min-h-0 overflow-hidden min-[600px]:order-2 flex-1">
            {/* Username - shown on desktop only */}
            <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
              <span
                className="font-medium text-gray-600 dark:text-gray-400 text-xs text-[14px] truncate underline cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                onClick={(e) => handleUsernameClick(post.authorName, e)}
              >
                {post.authorName}
              </span>
              {post.userFlairText && cleanFlairText(post.userFlairText) && (
                <span
                  className="text-[10px] px-1.5 rounded-[1.25rem] flex-shrink-0"
                  style={{
                    backgroundColor: post.flairBgColor === 'transparent' ? '#E4E4E4' : (post.flairBgColor || '#E4E4E4'),
                    color: post.flairTextColor || '#000000'
                  }}
                >
                  {cleanFlairText(post.userFlairText)}
                </span>
              )}
            </div>

            {/* Title - shown on desktop only */}
            <div className={`font-semibold text-base text-[22px] dark:text-gray-100 mb-1 flex-shrink-0 ${media ? 'line-clamp-2' : 'line-clamp-6'}`}>
              {post.title}
            </div>

            {/* Timestamp only on desktop */}
            <div className="flex items-center justify-between text-[14px] text-gray-500 dark:text-gray-400 flex-shrink-0 mt-auto">
              <span>{formatTimeAgo(post.timestamp)}</span>
              {isMod && (
                <button
                  onClick={(e) => handleDeletePost(post.id, e)}
                  disabled={deletingPosts.has(post.id)}
                  className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete from app (only mods can see this)"
                >
                  <TrashCanIcon className="w-full h-full" fill="currentColor" />
                </button>
              )}
            </div>
          </div>

          {/* Media on desktop only - left side */}
          {media && (
            <div className="hidden min-[600px]:block w-2/5 h-full flex-shrink-0 overflow-hidden rounded-md relative min-[600px]:order-1">
              {imageErrors.has(post.id) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-[#1a1a1a] text-[10px] text-gray-600 dark:text-gray-400 text-center px-2">
                  <span>Media</span>
                </div>
              ) : (
                <div className="w-full h-full">
                  <img
                    src={media.url}
                    alt={post.title}
                    className="w-full h-full object-cover brightness-90"
                    onError={() => handleImageError(post.id)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Timestamp - on mobile at bottom, on desktop hidden (shown in content div) */}
          <div className="flex min-[600px]:hidden items-center justify-between text-[14px] text-gray-500 dark:text-gray-400 flex-shrink-0 mt-auto">
            <span>{formatTimeAgo(post.timestamp)}</span>
            {isMod && (
              <button
                onClick={(e) => handleDeletePost(post.id, e)}
                disabled={deletingPosts.has(post.id)}
                className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete from app (only mods can see this)"
              >
                <TrashCanIcon className="w-full h-full" fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      );
    }

    // On mobile, use the small post layout for large posts too
    if (isMobile) {
      return (
        <div
          key={post.id}
          className="h-full w-full p-2 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-600 dark:border-l-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors flex flex-col gap-2"
          onClick={() => handlePostClick(post.permalink)}
          style={{ maxHeight: '100%', overflow: 'hidden' }}
        >
          {/* Username - at top on mobile */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="font-medium text-gray-600 dark:text-gray-400 text-xs text-[14px] truncate underline cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
              onClick={(e) => handleUsernameClick(post.authorName, e)}
            >
              {post.authorName}
            </span>
            {post.userFlairText && cleanFlairText(post.userFlairText) && (
              <span
                className="text-[10px] px-1.5 rounded-[1.25rem] flex-shrink-0"
                style={{
                  backgroundColor: post.flairBgColor === 'transparent' ? '#E4E4E4' : (post.flairBgColor || '#E4E4E4'),
                  color: post.flairTextColor || '#000000'
                }}
              >
                {cleanFlairText(post.userFlairText)}
              </span>
            )}
          </div>

          {/* Horizontal layout: media on left, content on right */}
          <div className="flex flex-row gap-2 flex-1 min-h-0">
            {/* Media on left */}
            {media && (
              <div className="w-2/5 h-full flex-shrink-0 overflow-hidden rounded-md relative">
                {imageErrors.has(post.id) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-[#1a1a1a] text-[10px] text-gray-600 dark:text-gray-400 text-center px-2">
                    <span>Media</span>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <img
                      src={media.url}
                      alt={post.title}
                      className="w-full h-full object-cover brightness-90"
                      onError={() => handleImageError(post.id)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Content on right */}
            <div className="flex flex-col min-h-0 overflow-hidden flex-1">
              <div className="font-semibold text-base text-[22px] dark:text-gray-100 overflow-hidden line-clamp-2">
                {post.title}
              </div>
            </div>
          </div>

          {/* Timestamp at bottom */}
          <div className="flex items-center justify-between text-[14px] text-gray-500 dark:text-gray-400 flex-shrink-0">
            <div className="flex items-center gap-2">
              {isMostRecent && (
                <div className="flex items-center gap-1 dark:bg-black/60 dark:backdrop-blur-sm px-2 py-1 rounded-md">
                  <span className="text-green-500 dark:text-green-400 text-base leading-none flex items-center">•</span>
                  <span className="text-green-500 dark:text-green-400 text-xs font-semibold">Most Recent</span>
                </div>
              )}
              <span>{formatTimeAgo(post.timestamp)}</span>
            </div>
            {isMod && (
              <button
                onClick={(e) => handleDeletePost(post.id, e)}
                disabled={deletingPosts.has(post.id)}
                className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete from app (only mods can see this)"
              >
                <TrashCanIcon className="w-full h-full" fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      );
    }

    // Large post layout for desktop (original)
    return (
      <div
        key={post.id}
        className="h-full w-full p-2 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-600 dark:border-l-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors flex flex-col"
        onClick={() => handlePostClick(post.permalink)}
        style={{ maxHeight: '100%', overflow: 'hidden' }}
      >
        <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
          <span
            className="font-medium text-gray-600 dark:text-gray-400 text-xs text-[14px] truncate underline cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
            onClick={(e) => handleUsernameClick(post.authorName, e)}
          >
            {post.authorName}
          </span>
          {post.userFlairText && cleanFlairText(post.userFlairText) && (
            <span
              className="text-[10px] px-1.5 rounded-[1.25rem] flex-shrink-0"
              style={{
                backgroundColor: post.flairBgColor === 'transparent' ? '#E4E4E4' : (post.flairBgColor || '#E4E4E4'),
                color: post.flairTextColor || '#000000'
              }}
            >
              {cleanFlairText(post.userFlairText)}
            </span>
          )}
        </div>

        <div className={`font-semibold text-base text-[22px] mb-1 dark:text-gray-100 flex-shrink-0 ${media ? 'line-clamp-2' : 'line-clamp-6'}`}>
          {post.title}
        </div>

        {media && (
          <div className="flex-1 w-full min-h-0 mb-1 overflow-hidden rounded-md relative">
            {imageErrors.has(post.id) ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-[#1a1a1a] text-[10px] text-gray-600 dark:text-gray-400 text-center px-2">
                <span>Post contains media</span>
                <span className="text-[9px] text-blue-600 dark:text-blue-400">
                  Click to view →
                </span>
              </div>
            ) : (
              <div className="w-full h-full">
                <img
                  src={media.url}
                  alt={post.title}
                  className="w-full h-full object-cover brightness-90"
                  onError={() => handleImageError(post.id)}
                />
              </div>
            )}
          </div>
        )}

        {/* Spacer for non-media posts to push timestamp down */}
        {!media && <div className="flex-1" />}

        <div className="flex items-center justify-between text-[14px] text-gray-500 dark:text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isMostRecent && (
              <div className="flex items-center gap-1 dark:bg-black/60 dark:backdrop-blur-sm px-2 py-1 rounded-md">
                <span className="text-green-500 dark:text-green-400 text-base leading-none flex items-center">•</span>
                <span className="text-green-500 dark:text-green-400 text-xs font-semibold">Most Recent</span>
              </div>
            )}
            <span>{formatTimeAgo(post.timestamp)}</span>
          </div>
          {isMod && (
            <button
              onClick={(e) => handleDeletePost(post.id, e)}
              disabled={deletingPosts.has(post.id)}
              className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete from app (only mods can see this)"
            >
              <TrashCanIcon className="w-full h-full" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    );
  };

      
  return (
    < >
     {/* Header */}
      {/* <div className="absolute top-2 left-2 z-10 bg-white dark:bg-[#1a1a1a] px-2 rounded">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-[2px]">
          Posts ({postCount > postsPerPage ? `${postsPerPage}+` : postCount})
        </h2>
      </div> */}

      {/* Content */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-lg mb-2">⏳</div>
          <div>Loading posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-lg mb-2">📝</div>
          <div>No posts yet.</div>
        </div>
      ) : (
        <>
          {/* Gallery Layout: Big post on top, small posts side-by-side below on mobile (<600px), side-by-side grid on desktop (>=600px) */}
          <div className="flex flex-col min-[600px]:flex-row min-[600px]:h-[360px] w-full gap-2">
            {/* Big Post */}
            <div className="w-full min-[600px]:w-1/2 h-[160px] min-[600px]:h-full overflow-hidden rounded-lg">
              {visiblePosts[0] && renderPost(visiblePosts[0], true, currentPage === 0)}
            </div>

            {/* Small Posts - side by side on mobile, stacked on desktop */}
            <div className="w-full min-[600px]:w-1/2 min-[600px]:h-full flex flex-row min-[600px]:flex-col gap-2">
              <div className="w-1/2 min-[600px]:w-full h-[200px] min-[600px]:h-1/2 rounded-lg">
                {visiblePosts[1] && renderPost(visiblePosts[1], false)}
              </div>
              <div className="w-1/2 min-[600px]:w-full h-[200px] min-[600px]:h-1/2 rounded-lg">
                {visiblePosts[2] && renderPost(visiblePosts[2], false)}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
