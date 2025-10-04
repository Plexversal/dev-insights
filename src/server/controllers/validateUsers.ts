import { Request, Response } from 'express';

export const validateUsers = async ( req: Request , res: Response ): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({ success: true });
  }

  // Split by comma and trim whitespace
  const users = value.split(',').map((u: string) => u.trim());

  // Username validation regex: A-Z, a-z, 0-9, underscore, dash
  const usernameRegex = /^[A-Za-z0-9_-]+$/;

  for (const user of users) {
    // Remove 'u/' prefix if present
    const username = user.startsWith('u/') ? user.substring(2) : user;

    // Check length
    if (username.length > 25) {
      return res.json({
        success: false,
        error: 'A username provided is too long, check valid user',
      });
    }

    // Check valid characters
    if (!usernameRegex.test(username)) {
      return res.json({
        success: false,
        error: 'A username contains invalid characters, check valid user',
      });
    }
  }

  return res.json({ success: true });
};
