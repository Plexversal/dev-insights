import React from 'react';
import { navigateTo } from '@devvit/web/client';
import { useComments } from '../hooks/useComments';
import { cleanFlairText } from '../lib/cleanFlairText';
import { formatTimeAgo } from '../lib/formatTimeAgo';
import { deleteItem } from '../lib/deleteItem';
import { TrashCanIcon } from '../lib/icons/TrashCanIcon';
import { useMod } from '../contexts/ModContext';
import { ScrollButtons } from './ScrollButtons';

interface CommentDisplayProps {
  postId: string | null;
}

export const CommentDisplay: React.FC<CommentDisplayProps> = ({ postId }) => {
  const { comments, loading, loadingMore, subredditName, refreshComments, loadMoreComments, hasMore, commentCount, commentsPerPage } = useComments();
  const { isMod, loading: modLoading } = useMod()
  const [deletingComments, setDeletingComments] = React.useState<Set<string>>(new Set());
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Disabled scroll wheel to comply with Reddit rules
  // React.useEffect(() => {
  //   const container = scrollContainerRef.current;
  //   if (!container) return;

  //   const handleWheel = (e: WheelEvent) => {
  //     if (e.deltaY !== 0) {
  //       e.preventDefault();
  //       container.scrollLeft += e.deltaY;
  //     }
  //   };

  //   container.addEventListener('wheel', handleWheel, { passive: false });
  //   return () => container.removeEventListener('wheel', handleWheel);
  // }, []);

  const handleCommentClick = (commentUrl: string) => {
    navigateTo(commentUrl);
  };

  const handleDeleteComment = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (deletingComments.has(commentId)) return; // Prevent multiple clicks

    setDeletingComments(prev => new Set(prev).add(commentId));
    await deleteItem(commentId, 'comments', refreshComments);
    // Keep button disabled while refresh is in progress
  };

  // Clear deleting state when loading completes
  React.useEffect(() => {
    if (!loading) {
      setDeletingComments(new Set());
    }
  }, [loading]);

  const debugRedis = async () => {
    try {
      const response = await fetch(`/api/debug/redis`);
      const data = await response.json();
      console.log('Redis Debug Data:', data);
      alert(`Redis Debug - Check console for details. Count: ${data.count}, Key exists: ${data.keyExists}`);
    } catch (error) {
      console.error('Debug error:', error);
      alert('Debug failed - check console');
    }
  };

  return (
    <div className="relative w-full max-w-2xl p-4 pt-8 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#eaeaea] dark:border-[#2a2a2a]">
      {/* Header - Overlapping */}
      <div className="absolute top-2 left-2 z-10 bg-white dark:bg-[#1a1a1a] px-2 rounded">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-[2px]">
          Comments ({commentCount > commentsPerPage ? `${commentsPerPage}+` : commentCount})
        </h2>
      </div>

      {/* Comments List - Horizontal Scroll Single Row */}
      <ScrollButtons scrollContainerRef={scrollContainerRef} />
      <div ref={scrollContainerRef} className="overflow-x-hidden pb-2">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">⏳</div>
            <div>Loading comments...</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">💬</div>
            <div>No comments yet.</div>
          </div>
        ) : (
          <div className="flex gap-3" style={{ minHeight: '120px' }}>
            {comments.map((comment, index) => (
            <div
              key={comment.id}
              className="flex-shrink-0 w-[280px] h-[120px] p-2 bg-gray-50 dark:bg-[#272729] rounded-lg border-l-4 border-blue-400 dark:border-blue-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#343536] transition-colors flex flex-col"
              onClick={() => handleCommentClick(comment.url)}
            >
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {comment.authorName}
                </span>
                {comment.userFlairText && cleanFlairText(comment.userFlairText) && (
                  <span
                    className="text-xs px-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: comment.flairBgColor === 'transparent' ? '#E4E4E4' : (comment.flairBgColor || '#E4E4E4'),
                      color: comment.flairTextColor || '#000000'
                    }}
                  >
                    {cleanFlairText(comment.userFlairText)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 mb-1 line-clamp-3 flex-1 overflow-hidden">
                {comment.body}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-1">
                <span className="truncate flex-1 min-w-0">{formatTimeAgo(comment.timestamp)} → {comment.repliedToUser}</span>
                {
                  isMod && <button
                  onClick={(e) => handleDeleteComment(comment.id, e)}
                  disabled={deletingComments.has(comment.id)}
                  className="w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full flex-shrink-0 ml-2 p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete from app (only mods can see this)"
                >
                  {<TrashCanIcon className="w-full h-full" fill="currentColor" />}
                </button>
                }
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="flex-shrink-0 w-[280px] h-[120px] p-2 bg-gray-50 dark:bg-[#272729] rounded-lg border-l-4 border-blue-400 dark:border-blue-500 flex items-center justify-center">
              <button
                onClick={loadMoreComments}
                disabled={loadingMore}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};
