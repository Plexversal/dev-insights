import { Request, Response } from 'express';
import { context, reddit, redis } from '@devvit/web/server';

const NOTIFICATIONS_KEY = 'notifications:users';

export const toggleNotificationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { enabled } = req.body;
    const username = await reddit.getCurrentUsername()

    if (!username) {
      res.status(401).json({ error: 'Username not found in context' });
      return;
    }

    // Get current notification users array
    const currentUsers = await redis.get(NOTIFICATIONS_KEY);
    let notificationUsers: string[] = [];

    if (currentUsers) {
      try {
        notificationUsers = JSON.parse(currentUsers);
      } catch (e) {
        console.error('Failed to parse notification users', e);
        notificationUsers = [];
      }
    }

    if (enabled) {
      // Add user to notifications array if not already present
      if (!notificationUsers.includes(username)) {
        notificationUsers.push(username);
      }
    } else {
      // Remove user from notifications array
      notificationUsers = notificationUsers.filter(u => u !== username);
    }

    // Save updated array back to Redis
    await redis.set(NOTIFICATIONS_KEY, JSON.stringify(notificationUsers));

    res.json({
      success: true,
      enabled,
      username,
      totalSubscribers: notificationUsers.length,
    });
  } catch (error) {
    console.error('Error toggling notifications:', error);
    res.status(500).json({ error: 'Failed to toggle notifications' });
  }
};

export const getNotificationStatusHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername()

    if (!username) {
      res.status(401).json({ error: 'Username not found in context' });
      return;
    }

    // Get current notification users array
    const currentUsers = await redis.get(NOTIFICATIONS_KEY);
    let notificationUsers: string[] = [];

    if (currentUsers) {
      try {
        notificationUsers = JSON.parse(currentUsers);
      } catch (e) {
        console.error('Failed to parse notification users', e);
      }
    }

    const isEnabled = notificationUsers.includes(username);

    res.json({
      enabled: isEnabled,
      username,
      totalSubscribers: notificationUsers.length,
    });
  } catch (error) {
    console.error('Error getting notification status:', error);
    res.status(500).json({ error: 'Failed to get notification status' });
  }
};
