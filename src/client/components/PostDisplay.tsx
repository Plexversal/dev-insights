import React from 'react';
import { navigateTo } from '@devvit/web/client';
import { usePosts } from '../hooks/usePosts';
import { cleanFlairText } from '../lib/cleanFlairText';

interface PostDisplayProps {
  postId: string | null;
}

export const PostDisplay: React.FC<PostDisplayProps> = ({ postId }) => {
  const { posts, loading, subredditName, refreshPosts, postCount } = usePosts();

  const handlePostClick = (permalink: string) => {
    navigateTo(`https://www.reddit.com${permalink}`);
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
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

  return (
    <div className="w-full max-w-2xl p-4 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#eaeaea] dark:border-[#2a2a2a]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Posts ({postCount})
        </h2>
        {/* <button
          onClick={refreshPosts}
          disabled={loading}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button> */}
      </div>

      {/* Posts List - Horizontal Scroll */}
      <div className="overflow-x-auto pb-2">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">📝</div>
            <div>No posts yet.</div>
          </div>
        ) : (
          <div className="flex gap-3" style={{ minHeight: '165px' }}>
            {posts.map((post) => {
              const media = getPostMedia(post);

              return (
                <div
                  key={post.id}
                  className="flex-shrink-0 w-[220px] min-h-[165px] p-3 bg-gray-50 dark:bg-[#272729] rounded-lg border-l-4 border-green-400 dark:border-green-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#343536] transition-colors flex flex-col"
                  onClick={() => handlePostClick(post.permalink)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {post.authorName}
                    </span>
                    {post.userFlairText && cleanFlairText(post.userFlairText) && (
                      <span
                        className="text-xs px-[6px] rounded-[1.25rem] flex-shrink-0"
                        style={{
                          backgroundColor: post.flairBgColor === 'transparent' ? '#E4E4E4' : (post.flairBgColor || '#E4E4E4'),
                          color: post.flairTextColor || '#000000'
                        }}
                      >
                        {cleanFlairText(post.userFlairText)}
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-sm mb-2 line-clamp-1 dark:text-gray-100">
                    {post.title}
                  </div>

                  {media ? (
                    <img
                      src={media.url}
                      alt={post.title}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                  ) : post.body ? (
                    <div className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-3 flex-1">
                      {post.body}
                    </div>
                  ) : null}

                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                    {formatTimeAgo(post.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
