import { Request, Response } from 'express';

export const validateFlairText = async (req: Request, res: Response): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({ success: true });
  }

  // Split by comma and trim whitespace
  const flairTexts = value.split(',').map((f: string) => f.trim());

  for (const flairText of flairTexts) {
    // Check length - Reddit flair text has a max of 64 characters
    if (flairText.length > 64) {
      return res.json({
        success: false,
        error: 'A flair text is too long (max 64 characters)',
      });
    }
  }

  return res.json({ success: true });
};
