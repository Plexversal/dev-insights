import { reddit } from '@devvit/web/server';

interface OwnerCheckResult {
  isOwner: boolean;
  username?: string;
  error?: string;
}

const APP_OWNER_USERNAME = 'PlexversalHD'; // Only this user can access protected routes

export const checkAppOwner = async (): Promise<OwnerCheckResult> => {
  try {
    const currentUser = await reddit.getCurrentUser();

    if (!currentUser) {
      return {
        isOwner: false,
        error: 'No user found'
      };
    }

    const isOwner = currentUser.username.toLowerCase() === APP_OWNER_USERNAME.toLowerCase();

    return {
      isOwner,
      username: currentUser.username
    };
  } catch (error) {
    console.error('Error checking app owner:', error);
    return {
      isOwner: false,
      error: 'Owner validation error'
    };
  }
};
