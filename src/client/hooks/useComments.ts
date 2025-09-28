import { useCallback, useEffect, useState } from 'react';
import { CommentData } from '../../shared/types/comment';

interface CommentsResponse {
  status: string;
  subredditName: string;
  comments: CommentData[];
  count: number;
}

export const useComments = () => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');

  const fetchComments = useCallback(async () => {
    console.log(`[useComments] Fetching global comments`);

    setLoading(true);
    try {
      const res = await fetch(`/api/comments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: CommentsResponse = await res.json();
      console.log(`[useComments] Response:`, data);

      if (data.status !== 'success') throw new Error('Unexpected response');

      setComments(data.comments);
      setSubredditName(data.subredditName);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Refresh comments manually
  const refreshComments = useCallback(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    subredditName,
    refreshComments,
    commentCount: comments.length
  };
};