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

export interface MainPostsContextType {
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
  flairFilter: string | undefined | null;
  setFlairFilter: (filter: string | undefined) => void;
}

const MainPostsContext = createContext<MainPostsContextType | undefined>(undefined);

const POSTS_PER_PAGE = 25;

interface MainPostsProviderProps {
  children: ReactNode;
}

export const MainPostsProvider: React.FC<MainPostsProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subredditName, setSubredditName] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialized, setInitialized] = useState(false);
  // Use null to indicate "not initialized yet" vs undefined meaning "no filter"
  const [flairFilter, setFlairFilterState] = useState<string | undefined | null>(null);

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
    // Don't fetch if filter hasn't been set yet
    if (flairFilter === null) {
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
        limit: POSTS_PER_PAGE.toString()
      });

      if (flairFilter) {
        params.append('flairFilter', flairFilter);
        params.append('excludeFlair', 'true'); // Main tab excludes the separator flair
      }

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PostsResponse = await res.json();

      if (data.status !== 'success') throw new Error('Unexpected response');

      if (appendMode) {
        setPosts(prev => {
          const newPosts = [...prev, ...data.posts];
          return newPosts;
        });
      } else {
        setPosts(data.posts);
      }

      setSubredditName(data.subredditName);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setOffset(currentOffset + data.count);
      setInitialized(true);
    } catch (err) {
      console.error('[MainPosts] Failed to fetch posts', err);
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

  // Initialize data when filter is set (not on first mount)
  React.useEffect(() => {
    // Only fetch after filter has been explicitly set by App.tsx
    // flairFilter starts as null, becomes undefined or string after setFlairFilter is called
    if (!initialized && flairFilter !== null) {
      fetchPosts(false);
    }
  }, [initialized, fetchPosts, flairFilter]);

  const value: MainPostsContextType = {
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
    <MainPostsContext.Provider value={value}>
      {children}
    </MainPostsContext.Provider>
  );
};

export const useMainPosts = (): MainPostsContextType => {
  const context = useContext(MainPostsContext);
  if (context === undefined) {
    throw new Error('useMainPosts must be used within a MainPostsProvider');
  }
  return context;
};
