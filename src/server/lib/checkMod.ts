import { reddit, context, settings, ModeratorPermission } from '@devvit/web/server';

interface ValidationResult {
  isMod: boolean;
  permissions?: ModeratorPermission[];
  error?: any;
}

export const checkMod = async (): Promise<ValidationResult> => {
  try {
    let currentUser = await reddit.getCurrentUser()
    if (!currentUser) {
        return {
          isMod: false
      }
    }
    let permissions = await currentUser?.getModPermissionsForSubreddit(context.subredditName)
    if(permissions) {
      return {
        isMod: permissions.length > 0,
        permissions: permissions
      }
    } else {
      return {
        isMod: false
      }
    }
  } catch (error) {
    console.error('Error validating user:', error);
    return { isMod: false, error: 'Mod Validation error' };
  }
};
