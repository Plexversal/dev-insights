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
  currentPage: number;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}

export const CommentDisplay: React.FC<CommentDisplayProps> = ({ postId, currentPage, onPageChange, isMobile }) => {
  const { comments, loading, loadingMore, subredditName, refreshComments, loadMoreComments, hasMore, commentCount, commentsPerPage } = useComments();
  const { isMod, loading: modLoading } = useMod()
  const [deletingComments, setDeletingComments] = React.useState<Set<string>>(new Set());

  // Show 2 comments on mobile, 4 on desktop
  const commentsPerView = isMobile ? 2 : 4;
  const visibleComments = comments.slice(currentPage * commentsPerView, (currentPage + 1) * commentsPerView);

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

  const renderComment = (comment: any) => {
    return (
      <div
        key={comment.id}
        className="h-full p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-600 dark:border-l-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors flex flex-col"
        onClick={() => handleCommentClick(comment.url)}
      >
        <div className="flex flex-col min-[600px]:flex-row gap-1 min-[600px]:items-center mb-2 flex-shrink-0">
          {comment.userFlairText && cleanFlairText(comment.userFlairText) && (
            <span
              className="text-xs px-[6px] rounded-[1.25rem] self-start flex-shrink-0 min-[600px]:order-2"
              style={{
                backgroundColor: comment.flairBgColor === 'transparent' ? '#E4E4E4' : (comment.flairBgColor || '#E4E4E4'),
                color: comment.flairTextColor || '#000000'
              }}
            >
              {cleanFlairText(comment.userFlairText)}
            </span>
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate min-[600px]:order-1">
            {comment.authorName}
          </span>
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-5 flex-1 overflow-hidden">
          {comment.body}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2 mt-auto">
          <span className="truncate flex-1 min-w-0">{formatTimeAgo(comment.timestamp)} → {comment.repliedToUser}</span>
          {isMod && (
            <button
              onClick={(e) => handleDeleteComment(comment.id, e)}
              disabled={deletingComments.has(comment.id)}
              className="w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full flex-shrink-0 ml-2 p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
    <>

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
          {/* Grid Layout: 1 column on mobile (<600px), 2x2 grid on desktop (>=600px) */}
          <div className="grid grid-cols-1 min-[600px]:grid-cols-2 gap-3" style={{ height: '300px' }}>
            {visibleComments[0] && renderComment(visibleComments[0])}
            {visibleComments[1] && renderComment(visibleComments[1])}
            {!isMobile && visibleComments[2] && renderComment(visibleComments[2])}
            {!isMobile && visibleComments[3] && renderComment(visibleComments[3])}
          </div>
        </>
      )}
    </>
  );
};
