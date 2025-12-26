import { Request, Response } from 'express';

export const validateSeparateTab = async (req: Request, res: Response): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({ success: true });
  }

  // Regex to match the format: [Tab Button Name](flair text)
  const regex = /^\[(.+?)\]\((.+?)\)$/;
  const match = value.match(regex);

  if (!match) {
    return res.json({
      success: false,
      error: 'Invalid format. Must be [Tab Button Name](flair text)',
    });
  }

  const tabButtonName = match[1];
  const flairText = match[2];

  // Validate tab button name length (max 30 characters)
  if (tabButtonName.length > 30) {
    return res.json({
      success: false,
      error: 'Tab button name is too long (max 30 characters)',
    });
  }

  // Validate flair text length (max 64 characters, same as validateFlairText)
  if (flairText.length > 64) {
    return res.json({
      success: false,
      error: 'Flair text is too long (max 64 characters)',
    });
  }

  return res.json({ success: true });
};
