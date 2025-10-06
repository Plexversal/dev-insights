import { Request, Response } from 'express';
import { checkMod } from '../lib/checkMod';

export const checkModHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const modCheckResult = await checkMod();

    res.json({
      status: 'success',
      isMod: modCheckResult.isMod,
      permissions: modCheckResult.permissions,
      error: modCheckResult.error
    });
  } catch (error) {
    console.error('Error checking mod status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check mod status',
      error: error
    });
  }
};
