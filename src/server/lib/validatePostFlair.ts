import { settings, Post } from '@devvit/web/server';
import { PostCreateBody } from '../../shared/types/api';

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export const validatePostFlair = async (
  linkFlair: PostCreateBody["post"]["linkFlair"]|Post['flair']
): Promise<ValidationResult> => {
  try {
    const flairSetting = await settings.get('subredditPostFlairText');
    const flairTerms = String(flairSetting || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    if (!linkFlair) {
      return { isValid: false, reason: 'No flair provided' };
    }
    if (!flairTerms.length) {
      return { isValid: false, reason: 'No flair terms configured' };
    }

    const text = linkFlair.text?.toLowerCase() || '';
    const id = linkFlair.templateId?.toLowerCase() || '';

    const match = flairTerms.find(term => text.includes(term) || id == term);

    return match
      ? { isValid: true, reason: text.includes(match) ? 'Post flair text match' : 'Flair ID match on post' }
      : { isValid: false, reason: 'No matching criteria' };
  } catch (err) {
    console.error('validatePostFlair error:', err);
    return { isValid: false, reason: 'Validation error' };
  }
};
