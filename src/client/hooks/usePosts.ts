import { useCallback, useEffect, useState } from 'react';
import { PostData } from '../../shared/types/post';

interface PostsResponse {
  status: string;
  subredditName: string;
  posts: PostData[];
  count: number;
  totalCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

const POSTS_PER_PAGE = 25;

export const usePosts = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchPosts = useCallback(async (appendMode = false) => {
    const currentOffset = appendMode ? offset : 0;
    console.log(`[usePosts] Fetching global posts (offset: ${currentOffset})`);

    if (appendMode) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/posts?offset=${currentOffset}&limit=${POSTS_PER_PAGE}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PostsResponse = await res.json();
      console.log(`[usePosts] Response:`, data);

      if (data.status !== 'success') throw new Error('Unexpected response');

      if (appendMode) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setSubredditName(data.subredditName);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setOffset(data.offset + data.count);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, []);

  // Refresh posts manually (reset to beginning)
  const refreshPosts = useCallback(() => {
    setOffset(0);
    fetchPosts(false);
  }, [fetchPosts]);

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(true);
    }
  }, [fetchPosts, loadingMore, hasMore]);

  return {
    posts,
    loading,
    loadingMore,
    subredditName,
    refreshPosts,
    loadMorePosts,
    hasMore,
    postCount: totalCount,
    postsPerPage: POSTS_PER_PAGE
  };
};
