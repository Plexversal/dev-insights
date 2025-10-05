import React from 'react';
import { navigateTo } from '@devvit/web/client';
import { useComments } from '../hooks/useComments';
import { cleanFlairText } from '../lib/cleanFlairText';

interface CommentDisplayProps {
  postId: string | null;
}

export const CommentDisplay: React.FC<CommentDisplayProps> = ({ postId }) => {
  const { comments, loading, subredditName, refreshComments, commentCount } = useComments();

  const handleCommentClick = (commentUrl: string) => {
    navigateTo(commentUrl);
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
    <div className="w-full max-w-2xl mx-auto mt-2 p-4 bg-[white] rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#eaeaea]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Comments ({commentCount})
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
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">💬</div>
            <div>No comments yet.</div>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleCommentClick(comment.url)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 min-[600px]:text-base text-sm">
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
                  <span className="min-[600px]:text-xs text-[10px] text-gray-500">
                    {formatTimeAgo(comment.timestamp)}
                  </span>
                  {/* <span className="text-xs text-green-600">
                    ↑{comment.score}
                  </span> */}
                </div>
                <div className="min-[600px]:text-xs text-[10px] text-blue-600">
                  Click to view →
                </div>
              </div>
              <div className="min-[600px]:text-sm text-xs text-gray-700 mb-2 line-clamp-3">
                {comment.body}
              </div>
              <div className="min-[600px]:text-xs text-[10px] text-gray-500 font-mono border-t border-gray-200 pt-[6px] line-clamp-1">
                Replied to {comment.repliedToUser} &middot; {comment.parentPostTitle}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
