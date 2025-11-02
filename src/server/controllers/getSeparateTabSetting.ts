import { Request, Response } from 'express';
import { settings } from '@devvit/web/server';

export const getSeparateTabSetting = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const separateTabPostFlair1 = await settings.get('separateTabPostFlair1');

    const value = typeof separateTabPostFlair1 === 'string' && separateTabPostFlair1.trim() !== ''
      ? separateTabPostFlair1
      : null;

    res.json({
      separateTabPostFlair1: value,
    });
  } catch (error) {
    console.error(`Error fetching separate tab setting: ${error}`);
    res.json({
      separateTabPostFlair1: null,
    });
  }
};
