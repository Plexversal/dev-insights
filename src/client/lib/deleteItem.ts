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
    } else {
      console.error(`Failed to delete ${type.slice(0, -1)}`);
    }
  } catch (error) {
    console.error(`Error deleting ${type.slice(0, -1)}:`, error);
  }
};
