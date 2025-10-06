import { showToast } from "@devvit/web/client";

export const deleteItem = async (
  itemId: string,
  type: 'posts' | 'comments',
  refreshCallback: () => void
): Promise<void> => {
  try {
    const response = await fetch(`/api/${type}/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log(`${type.slice(0, -1)} ${itemId} deleted`);
      refreshCallback(); // Refresh the list
      showToast({
        text: `${type == 'posts' ? 'Post' : 'Comment'} removed from app successfully!`,
        appearance: 'success', // 'neutral' | 'success'
      });
    } else {
      console.error(`Failed to delete ${type.slice(0, -1)}`);
      showToast({
        text: `${type == 'posts' ? 'Post' : 'Comment'} failed to be removed, view browser logs for more info`,
        appearance: 'neutral', // 'neutral' | 'success'
      });
    }
  } catch (error) {
    console.error(`Error deleting ${type.slice(0, -1)}:`, error);
    showToast({
        text: `${type == 'posts' ? 'Post' : 'Comment'} failed to be removed, view browser logs for more info`,
        appearance: 'neutral', // 'neutral' | 'success'
      });
  }
};
