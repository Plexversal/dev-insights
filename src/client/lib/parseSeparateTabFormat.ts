/**
 * Parses the separate tab format: [Tab Button Name](flair text)
 * @param value - The formatted string
 * @returns Object with tabName and flairText, or null if invalid
 */
export function parseSeparateTabFormat(value: string | null | undefined): {
  tabName: string;
  flairText: string;
} | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const regex = /^\[(.+?)\]\((.+?)\)$/;
  const match = value.match(regex);

  if (!match || !match[1] || !match[2]) {
    return null;
  }

  return {
    tabName: match[1],
    flairText: match[2],
  };
}
