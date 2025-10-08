import React from 'react';
import { navigateTo } from '@devvit/web/client';
import { useComments } from '../hooks/useComments';
import { cleanFlairText } from '../lib/cleanFlairText';
import { formatTimeAgo } from '../lib/formatTimeAgo';
import { deleteItem } from '../lib/deleteItem';
import { TrashCanIcon } from '../lib/icons/TrashCanIcon';
import { useMod } from '../contexts/ModContext';

interface CommentDisplayProps {
  postId: string | null;
}

export const CommentDisplay: React.FC<CommentDisplayProps> = ({ postId }) => {
  const { comments, loading, loadingMore, subredditName, refreshComments, loadMoreComments, hasMore, commentCount, commentsPerPage } = useComments();
  const { isMod, loading: modLoading } = useMod()
  const [deletingComments, setDeletingComments] = React.useState<Set<string>>(new Set());

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
    <div className="w-full max-w-2xl p-4 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#eaeaea] dark:border-[#2a2a2a]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Comments ({commentCount > commentsPerPage ? `${commentsPerPage}+` : commentCount})
        </h2>
        {/* <div className="flex gap-2">
          <button
            onClick={refreshComments}
            disabled={loading}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={debugRedis}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Debug Redis
          </button>
        </div> */}
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
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
          <>
            {comments.map((comment, index) => (
            <div
              key={comment.id}
              className="p-3 bg-gray-50 dark:bg-[#272729] rounded-lg border-l-4 border-blue-400 dark:border-blue-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#343536] transition-colors"
              onClick={() => handleCommentClick(comment.url)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100 min-[600px]:text-base text-sm">
                    {comment.authorName}
                  </span>
                  {comment.userFlairText && cleanFlairText(comment.userFlairText) && (
                    <span
                      className="min-[600px]:text-xs text-[10px] px-[6px] rounded-[1.25rem]"
                      style={{
                        backgroundColor: comment.flairBgColor === 'transparent' ? '#E4E4E4' : (comment.flairBgColor || '#E4E4E4'),
                        color: comment.flairTextColor || '#000000'
                      }}
                    >
                      {cleanFlairText(comment.userFlairText)}
                    </span>
                  )}
                  <span className="min-[600px]:text-xs text-[10px] text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(comment.timestamp)}
                  </span>
                  {/* <span className="text-xs text-green-600">
                    ↑{comment.score}
                  </span> */}
                </div>
                <div className="min-[600px]:text-xs text-[10px] text-blue-600 dark:text-blue-400">
                  Click to view →
                </div>
              </div>
              <div className="min-[600px]:text-sm text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
                {comment.body}
              </div>
              <div className="flex items-center justify-between min-[600px]:text-xs text-[10px] text-gray-500 dark:text-gray-400 font-mono border-t border-gray-200 dark:border-gray-600 pt-[6px]">
                <span className="line-clamp-1">Replied to {comment.repliedToUser} &middot; {comment.parentPostTitle}</span>
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
            <div className="flex justify-center pt-3">
              <button
                onClick={loadMoreComments}
                disabled={loadingMore}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingMore ? 'Loading...' : 'Load More Comments'}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};
