import { useCommentsContext } from '../contexts/CommentsContext';

export const useComments = () => {
  return useCommentsContext();
};
