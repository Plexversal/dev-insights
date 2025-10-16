import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CommentData } from '../../shared/types/comment';

interface CommentsResponse {
  status: string;
  subredditName: string;
  comments: CommentData[];
  count: number;
  totalCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

interface CommentsContextType {
  comments: CommentData[];
  loading: boolean;
  loadingMore: boolean;
  subredditName: string;
  hasMore: boolean;
  commentCount: number;
  commentsPerPage: number;
  refreshComments: () => void;
  loadMoreComments: () => void;
  initialized: boolean;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

const COMMENTS_PER_PAGE = 50;

interface CommentsProviderProps {
  children: ReactNode;
}

export const CommentsProvider: React.FC<CommentsProviderProps> = ({ children }) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const fetchComments = useCallback(async (appendMode = false) => {
    const currentOffset = appendMode ? offset : 0;
    console.log(`[CommentsContext] Fetching comments (offset: ${currentOffset})`);

    if (appendMode) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/comments?offset=${currentOffset}&limit=${COMMENTS_PER_PAGE}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: CommentsResponse = await res.json();
      console.log(`[CommentsContext] Response:`, data);

      if (data.status !== 'success') throw new Error('Unexpected response');

      if (appendMode) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }

      setSubredditName(data.subredditName);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setOffset(data.offset + data.count);
      setInitialized(true);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  const refreshComments = useCallback(() => {
    setOffset(0);
    fetchComments(false);
  }, [fetchComments]);

  const loadMoreComments = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchComments(true);
    }
  }, [fetchComments, loadingMore, hasMore]);

  // Initialize data on first mount
  React.useEffect(() => {
    if (!initialized) {
      fetchComments(false);
    }
  }, [initialized, fetchComments]);

  const value: CommentsContextType = {
    comments,
    loading,
    loadingMore,
    subredditName,
    hasMore,
    commentCount: totalCount,
    commentsPerPage: COMMENTS_PER_PAGE,
    refreshComments,
    loadMoreComments,
    initialized
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useCommentsContext = (): CommentsContextType => {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error('useCommentsContext must be used within a CommentsProvider');
  }
  return context;
};
