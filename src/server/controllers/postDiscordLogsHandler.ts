import { Request, Response } from 'express';
import { context } from '@devvit/web/server';
import { sendDiscordLogs } from '../lib/sendDiscordLogs';

export const postDiscordLogsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await sendDiscordLogs();

    res.json({
      status: 'success',
      message: 'Logs sent to Discord successfully',
      data: {
        subredditName: context.subredditName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Discord Logs] Error sending logs to Discord:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send logs to Discord',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
