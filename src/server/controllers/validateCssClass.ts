import { Request, Response } from 'express';
// import { SettingsValidationRequest, SettingsValidationResponse, SettingsClient } from '@devvit/web/server';

export const validateCssClass = async (req: Request , res: Response): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({ success: true });
  }

  // Split by comma and trim whitespace
  const cssClasses = value.split(',').map((c: string) => c.trim());

  // CSS class validation regex: A-Z, a-z, 0-9, underscore, dash
  // CSS classes must start with a letter, underscore, or dash (but not a digit)
  const cssClassRegex = /^[A-Za-z_-][A-Za-z0-9_-]*$/;

  for (const cssClass of cssClasses) {
    // Check valid characters and structure
    if (!cssClassRegex.test(cssClass)) {
      return res.json({
        success: false,
        error: 'Invalid css class, please check valid CSS classes.',
      });
    }
  }

  return res.json({ success: true });
};
