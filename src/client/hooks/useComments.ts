import { useCallback, useEffect, useState } from 'react';
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

const COMMENTS_PER_PAGE = 50;

export const useComments = () => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchComments = useCallback(async (appendMode = false) => {
    const currentOffset = appendMode ? offset : 0;
    console.log(`[useComments] Fetching global comments (offset: ${currentOffset})`);

    if (appendMode) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/comments?offset=${currentOffset}&limit=${COMMENTS_PER_PAGE}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: CommentsResponse = await res.json();
      console.log(`[useComments] Response:`, data);

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
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, []);

  // Refresh comments manually (reset to beginning)
  const refreshComments = useCallback(() => {
    setOffset(0);
    fetchComments(false);
  }, [fetchComments]);

  // Load more comments
  const loadMoreComments = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchComments(true);
    }
  }, [fetchComments, loadingMore, hasMore]);

  return {
    comments,
    loading,
    loadingMore,
    subredditName,
    refreshComments,
    loadMoreComments,
    hasMore,
    commentCount: totalCount,
    commentsPerPage: COMMENTS_PER_PAGE
  };
};
