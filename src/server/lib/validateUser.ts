import { reddit, context, settings } from '@devvit/web/server';

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export const validateUser = async (userId: `t2_${string}`): Promise<ValidationResult> => {
  try {
    // Fetch settings
    const [subredditUsers, subredditFlairText, subredditFlairCssclass] = await Promise.all([
      settings.get('subredditUsers'),
      settings.get('subredditFlairText'),
      settings.get('subredditFlairCssclass')
    ]);

    // Parse comma-separated strings into arrays
    const usersArray = (subredditUsers as string || '')
      .split(',')
      .map(u => u.trim().replace(/^u\//, ''))
      .filter(u => u.length > 0);

    const flairTextArray = (subredditFlairText as string || '')
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const cssClassArray = (subredditFlairCssclass as string || '')
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);


    if (
      !usersArray.length &&
      !flairTextArray.length &&
      !cssClassArray.length
    ) {
      return { isValid: false, reason: 'No validation settings configured' };
    }

    // console.log('Validation config >>', { usersArray, flairTextArray, cssClassArray });

    // Fetch user data
    const user = await reddit.getUserById(userId);
    if (!user) {
      return { isValid: false, reason: 'User not found' };
    }

    const userFlair = await user.getUserFlairBySubreddit(context.subredditName);

    // Validation checks (case-insensitive username match)
    const isUserMatch = usersArray.some(u => u.toLowerCase() === user.username.toLowerCase());
    const isFlairTextMatch = userFlair?.flairText
      ? flairTextArray.some(ft => userFlair.flairText!.toLowerCase().includes(ft.toLowerCase()))
      : false;
    const isCssClassMatch = userFlair?.flairCssClass
      ? cssClassArray.some(css => userFlair.flairCssClass!.replace(/\s/g, '').toLowerCase() === css.replace(/\s/g, '').toLowerCase())
      : false;

    // Check if any validation passes
    if (isUserMatch || isFlairTextMatch || isCssClassMatch) {
      return {
        isValid: true,
        reason: isUserMatch ? 'username match' : isFlairTextMatch ? 'flair text match' : 'css class match'
      };
    }

    return {
      isValid: false,
      reason: 'No matching criteria'
    };
  } catch (error) {
    console.error('Error validating user:', error);
    return { isValid: false, reason: 'Validation error' };
  }
};
