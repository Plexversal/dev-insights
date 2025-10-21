import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

export interface PostsContextType {
  posts: PostData[];
  loading: boolean;
  loadingMore: boolean;
  subredditName: string;
  hasMore: boolean;
  postCount: number;
  postsPerPage: number;
  refreshPosts: () => void;
  loadMorePosts: () => void;
  initialized: boolean;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

const POSTS_PER_PAGE = 25;

interface PostsProviderProps {
  children: ReactNode;
}

export const PostsProvider: React.FC<PostsProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const fetchPosts = useCallback(async (appendMode = false) => {
    const currentOffset = appendMode ? offset : 0;
    // console.log(`[PostsContext] Fetching posts (offset: ${currentOffset})`);

    if (appendMode) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/posts?offset=${currentOffset}&limit=${POSTS_PER_PAGE}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PostsResponse = await res.json();
      // console.log(`[PostsContext] Response:`, data);

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
      setInitialized(true);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  const refreshPosts = useCallback(() => {
    setOffset(0);
    fetchPosts(false);
  }, [fetchPosts]);

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(true);
    }
  }, [fetchPosts, loadingMore, hasMore]);

  // Initialize data on first mount
  React.useEffect(() => {
    if (!initialized) {
      fetchPosts(false);
    }
  }, [initialized, fetchPosts]);

  const value: PostsContextType = {
    posts,
    loading,
    loadingMore,
    subredditName,
    hasMore,
    postCount: totalCount,
    postsPerPage: POSTS_PER_PAGE,
    refreshPosts,
    loadMorePosts,
    initialized
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePostsContext = (): PostsContextType => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePostsContext must be used within a PostsProvider');
  }
  return context;
};
