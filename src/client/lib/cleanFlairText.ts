export const cleanFlairText = (flairText: string): string => {
  // Remove :emoji: patterns and trim whitespace
  return flairText.replace(/:.+:/g, '').trim();
};
