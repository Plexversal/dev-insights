import { Request, Response } from 'express';

export const validateButtonName = async (req: Request, res: Response): Promise<Response> => {
  const { value } = req.body;

  if (!value || value.trim() === '') {
    return res.json({
        success: false,
        error: 'You need at least 1 valid character.',
      });
  }

  if(value.length > 30) {
    return res.json({
        success: false,
        error: 'Text too long, max 30 characters',
      });
  }

  return res.json({ success: true });
};
