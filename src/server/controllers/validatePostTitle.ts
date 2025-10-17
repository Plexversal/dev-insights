import { Request, Response } from 'express';

export const validatePostTitle = async (req: Request, res: Response): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({
        success: false,
        error: 'You need at least 1 valid character for posts.',
      });
  }

  if(value.length > 300) {
    return res.json({
        success: false,
        error: 'Title too long, max 300',
      });
  }

  return res.json({ success: true });
};
