import { Request, Response } from 'express';
import { context, redis, reddit } from '@devvit/web/server';

const ADMIN_USERNAME = 'PlexversalHD';

export const adminCheckHandler = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'success',
    isAdmin: context.username === ADMIN_USERNAME
  });
};

export const adminEvalHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (context.username !== ADMIN_USERNAME) {
      res.status(403).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const { code } = req.body as { code: string };

    if (!code || typeof code !== 'string') {
      res.status(400).json({ status: 'error', message: 'Missing required field: code' });
      return;
    }

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    const fn = new AsyncFunction('reddit', 'redis', 'context', code);
    const result = await fn(reddit, redis, context);

    let serialized: unknown;
    if (result === undefined) {
      serialized = 'undefined';
    } else if (result === null) {
      serialized = 'null';
    } else if (typeof result === 'object') {
      try {
        serialized = JSON.parse(JSON.stringify(result));
      } catch {
        serialized = String(result);
      }
    } else {
      serialized = result;
    }

    res.json({ status: 'success', result: serialized });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    res.status(500).json({ status: 'error', message, stack });
  }
};
