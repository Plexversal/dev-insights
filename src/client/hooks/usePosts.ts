import { usePostsContext } from '../contexts/PostsContext';

export const usePosts = () => {
  return usePostsContext();
};
