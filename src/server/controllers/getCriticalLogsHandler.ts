import { Request, Response } from 'express';
import { getCriticalLogs } from '../lib/criticalLogger';
import { checkAppOwner } from '../lib/checkAppOwner';

interface LogEntry {
  timestamp: string;
  message: string;
}

export async function getCriticalLogsHandler(req: Request, res: Response): Promise<void> {
  try {
    // Only allow app owner to access critical logs
    const ownerCheck = await checkAppOwner();

    if (!ownerCheck.isOwner) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Only the app owner can access critical logs',
        logs: []
      });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs: LogEntry[] = await getCriticalLogs(limit);

    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('[getCriticalLogsHandler] Error retrieving logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: []
    });
  }
}
