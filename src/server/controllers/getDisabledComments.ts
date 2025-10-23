import { Request, Response } from 'express';
import { settings } from '@devvit/web/server';
interface LogEntry {
  timestamp: string;
  message: string;
}

export async function getDisabledComments(req: Request, res: Response): Promise<void> {
  try {

      let disabledComments: boolean = await settings.get('disableComments') || false

      res.json({
        success: true,
        disabled: disabledComments,
      });
  } catch (error) {
    console.error('[getDisabledComments] Error retrieving settings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: []
    });
  }
}
