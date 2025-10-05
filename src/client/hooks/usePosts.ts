import { useCallback, useEffect, useState } from 'react';
import { PostData } from '../../shared/types/post';

interface PostsResponse {
  status: string;
  subredditName: string;
  posts: PostData[];
  count: number;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');

  const fetchPosts = useCallback(async () => {
    console.log(`[usePosts] Fetching global posts`);

    setLoading(true);
    try {
      const res = await fetch(`/api/posts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PostsResponse = await res.json();
      console.log(`[usePosts] Response:`, data);

      if (data.status !== 'success') throw new Error('Unexpected response');

      setPosts(data.posts);
      setSubredditName(data.subredditName);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Refresh posts manually
  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    subredditName,
    refreshPosts,
    postCount: posts.length
  };
};
