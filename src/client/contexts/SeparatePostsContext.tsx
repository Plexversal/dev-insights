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

export interface SeparatePostsContextType {
  posts: PostData[];
  loading: boolean;
  loadingMore: boolean;
  subredditName: string;
  hasMore: boolean;
  postCount: number;
  postsPerPage: number;
  refreshPosts: () => void;
  loadMorePosts: () => Promise<void>;
  initialized: boolean;
  flairFilter: string | undefined;
  setFlairFilter: (filter: string | undefined) => void;
}

const SeparatePostsContext = createContext<SeparatePostsContextType | undefined>(undefined);

const POSTS_PER_PAGE = 25;

interface SeparatePostsProviderProps {
  children: ReactNode;
}

export const SeparatePostsProvider: React.FC<SeparatePostsProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [flairFilter, setFlairFilterState] = useState<string | undefined>(undefined);

  const setFlairFilter = useCallback((filter: string | undefined) => {
    // Use a functional update to check if filter changed
    setFlairFilterState(prevFilter => {
      if (prevFilter === filter) {
        // Filter hasn't changed, don't reset anything
        return prevFilter;
      }
      // Filter changed, schedule resets
      setOffset(0);
      setPosts([]);
      setInitialized(false);
      return filter;
    });
  }, []);

  const fetchPosts = useCallback(async (appendMode = false) => {
    // Don't fetch if no filter is set (separate tab is disabled)
    if (!flairFilter) {
      return;
    }

    const currentOffset = appendMode ? offset : 0;

    if (appendMode) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        offset: currentOffset.toString(),
        limit: POSTS_PER_PAGE.toString(),
        flairFilter: flairFilter,
        excludeFlair: 'false' // Separate tab includes only matching flair
      });

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PostsResponse = await res.json();

      if (data.status !== 'success') throw new Error('Unexpected response');
      if (appendMode) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setSubredditName(data.subredditName);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setOffset(currentOffset + data.count);
      setInitialized(true);
    } catch (err) {
      console.error('[SeparatePosts] Failed to fetch posts', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, flairFilter]);

  const refreshPosts = useCallback(() => {
    setOffset(0);
    fetchPosts(false);
  }, [fetchPosts]);

  const loadMorePosts = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await fetchPosts(true);
    }
  }, [fetchPosts, loadingMore, hasMore]);

  // Initialize data when filter is set
  React.useEffect(() => {
    if (flairFilter && !initialized) {
      fetchPosts(false);
    }
  }, [initialized, fetchPosts, flairFilter]);

  const value: SeparatePostsContextType = {
    posts,
    loading,
    loadingMore,
    subredditName,
    hasMore,
    postCount: totalCount,
    postsPerPage: POSTS_PER_PAGE,
    refreshPosts,
    loadMorePosts,
    initialized,
    flairFilter,
    setFlairFilter
  };

  return (
    <SeparatePostsContext.Provider value={value}>
      {children}
    </SeparatePostsContext.Provider>
  );
};

export const useSeparatePosts = (): SeparatePostsContextType => {
  const context = useContext(SeparatePostsContext);
  if (context === undefined) {
    throw new Error('useSeparatePosts must be used within a SeparatePostsProvider');
  }
  return context;
};
