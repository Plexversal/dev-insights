import { redis, reddit, context } from '@devvit/web/server';
import { logCritical } from './criticalLogger';

const NOTIFICATIONS_KEY = 'notifications:users';
const NOTIFICATION_QUEUE_KEY = 'notifications:queue';
const NOTIFICATION_STATE_KEY = 'notifications:state';

interface NotificationJob {
  postId: string;
  permalink: string;
  authorName: string;
  subredditName: string;
  timestamp: number;
  appPostLink?: string; // Cached app post link
}

interface NotificationState {
  isProcessing: boolean;
  lastSentTime: number;
  currentJob: NotificationJob | null;
  remainingUsers: string[];
  messagesThisWindow: number;
  windowStartTime: number;
}

class NotificationService {
  private static instance: NotificationService;
  private processingInterval: NodeJS.Timeout | null = null;

  // Rate limits: 1000 requests per 600 seconds = ~1.67 per second
  // We'll be conservative: 1 message per second for 590 seconds, then pause 10 seconds
  private readonly MESSAGES_PER_WINDOW = 590;
  private readonly WINDOW_DURATION_MS = 600000; // 10 minutes
  private readonly MESSAGE_INTERVAL_MS = 1000; // 1 second between messages
  private readonly COOLDOWN_MS = 10000; // 10 second cooldown after window

  private constructor() {
    // Start processing on initialization
    this.startProcessing();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Queue a new notification job for a post
   */
  async queueNotification(job: NotificationJob): Promise<void> {
    try {
      // Get current queue
      const queueJson = await redis.get(NOTIFICATION_QUEUE_KEY);
      const queue: NotificationJob[] = queueJson ? JSON.parse(queueJson) : [];

      // Add job to queue
      queue.push(job);
      await redis.set(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));

      // console.log(`[NotificationService] Queued notification for post ${job.postId}`);

      // Ensure processing is running
      if (!this.processingInterval) {
        this.startProcessing();
      }
    } catch (error) {
      logCritical(error)
      console.error('[NotificationService] Error queuing notification:', error);
    }
  }

  /**
   * Start the background processing loop
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return; // Already processing
    }

    // console.log('[NotificationService] Starting notification processing');

    // Process every second
    this.processingInterval = setInterval(async () => {
      await this.processNextNotification();
    }, this.MESSAGE_INTERVAL_MS);
  }

  /**
   * Process the next notification in the queue
   */
  private async processNextNotification(): Promise<void> {
    try {
      // Get current state
      const state = await this.getState();

      // Check if we need to cooldown
      const now = Date.now();
      if (state.messagesThisWindow >= this.MESSAGES_PER_WINDOW) {
        const timeSinceWindowStart = now - state.windowStartTime;
        if (timeSinceWindowStart < this.WINDOW_DURATION_MS) {
          // Still in cooldown period
          // console.log('[NotificationService] Rate limit reached, cooling down...');
          return;
        } else {
          // Reset window
          state.messagesThisWindow = 0;
          state.windowStartTime = now;
          await this.saveState(state);
        }
      }

      // Get or load current job
      if (!state.currentJob || state.remainingUsers.length === 0) {
        // Try to get next job from queue
        const queueJson = await redis.get(NOTIFICATION_QUEUE_KEY);
        const queue: NotificationJob[] = queueJson ? JSON.parse(queueJson) : [];

        if (queue.length === 0) {
          // No jobs in queue
          state.isProcessing = false;
          await this.saveState(state);
          return;
        }

        // Get first job and remove it from queue
        const job = queue.shift()!;
        await redis.set(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));

        // Fetch the latest app post for this subreddit (once per job)
        if (!job.appPostLink) {
          job.appPostLink = await this.fetchAppPostLink(job.subredditName);
        }

        // Get list of users to notify
        const usersJson = await redis.get(NOTIFICATIONS_KEY);
        const users: string[] = usersJson ? JSON.parse(usersJson) : [];

        state.currentJob = job;
        state.remainingUsers = users;
        state.isProcessing = true;
        await this.saveState(state);

        // console.log(`[NotificationService] Starting new job for post ${job.postId}, ${users.length} users to notify`);
      }

      // Send message to next user
      if (state.remainingUsers.length > 0) {
        const username = state.remainingUsers.shift()!;

        try {
          await this.sendNotification(username, state.currentJob!);
          state.messagesThisWindow++;
          state.lastSentTime = now;
          // console.log(`[NotificationService] Sent notification to u/${username} (${state.remainingUsers.length} remaining)`);
        } catch (error) {
          logCritical(error)
          console.error(`[NotificationService] Failed to send to u/${username}:`, error);
          // Continue to next user even if this one fails
        }

        await this.saveState(state);
      }

      // Check if job is complete
      if (state.remainingUsers.length === 0 && state.currentJob) {
        // console.log(`[NotificationService] Completed job for post ${state.currentJob.postId}`);
        state.currentJob = null;
        await this.saveState(state);
      }

    } catch (error) {
      logCritical(error)
      console.error('[NotificationService] Error processing notification:', error);
    }
  }

  /**
   * Fetch the latest app post link for a subreddit
   */
  private async fetchAppPostLink(subredditName: string): Promise<string> {
    try {
      const appPostsListing = await reddit.getPostsByUser({
        username: context.appName,
        limit: 10,
        pageSize: 10
      });

      const appPosts = await appPostsListing.all();

      // Find the first post from this subreddit
      for (const appPost of appPosts) {
        if (appPost.subredditName === subredditName) {
          const permalink = `https://www.reddit.com${appPost.permalink}`;
          // console.log(`[NotificationService] Found app post for r/${subredditName}: ${permalink}`);
          return permalink;
        }
      }

      // console.log(`[NotificationService] No app post found for r/${subredditName}`);
      return '';
    } catch (error) {
      logCritical(error)
      console.error(`[NotificationService] Error fetching app post for r/${subredditName}:`, error);
      return '';
    }
  }

  /**
   * Send a notification to a single user
   */
  private async sendNotification(username: string, job: NotificationJob): Promise<void> {
    const optOutText = job.appPostLink
      ? `To opt out, click the bell icon on the [App post](${job.appPostLink}) in the subreddit.`
      : `To opt out, visit the App post in r/${job.subredditName} and click the bell icon.`;

    const message = `**New post: [${job.postId}](https://www.reddit.com${job.permalink}) by ${job.authorName} in r/${job.subredditName}**\n\nYou are receiving this message because you opted in to official post notifications for r/${job.subredditName}.\n\n${optOutText}`;

    await reddit.sendPrivateMessage({
      to: username,
      subject: `New post in r/${job.subredditName}`,
      text: message,
    });
  }

  /**
   * Get current processing state from Redis
   */
  private async getState(): Promise<NotificationState> {
    try {
      const stateJson = await redis.get(NOTIFICATION_STATE_KEY);
      if (stateJson) {
        return JSON.parse(stateJson);
      }
    } catch (error) {
      logCritical(error)
      console.error('[NotificationService] Error loading state:', error);
    }

    // Return default state
    return {
      isProcessing: false,
      lastSentTime: 0,
      currentJob: null,
      remainingUsers: [],
      messagesThisWindow: 0,
      windowStartTime: Date.now(),
    };
  }

  /**
   * Save processing state to Redis
   */
  private async saveState(state: NotificationState): Promise<void> {
    try {
      await redis.set(NOTIFICATION_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[NotificationService] Error saving state:', error);
    }
  }

  /**
   * Stop processing (for cleanup)
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      // console.log('[NotificationService] Stopped processing');
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
