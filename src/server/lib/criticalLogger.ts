import { redis } from '@devvit/web/server';

const LOGS_KEY = 'critical_logs';
const MAX_LOGS = 1000; // Keep last 1000 logs to prevent unbounded growth

interface LogEntry {
  timestamp: string;
  message: string;
}

/**
 * Logs critical errors and debug information to Redis
 * @param data - Any data to log (string, object, error, etc.)
 */
export async function logCritical(data: unknown): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    let logMessage: string;

    // Handle different data types
    if (data instanceof Error) {
      logMessage = `ERROR: ${data.message}\nStack: ${data.stack}`;
    } else if (typeof data === 'string') {
      logMessage = data;
    } else if (typeof data === 'object' && data !== null) {
      logMessage = JSON.stringify(data, null, 2);
    } else {
      logMessage = String(data);
    }

    // Get existing logs
    const existingLogsJson = await redis.get(LOGS_KEY);
    let logs: LogEntry[] = [];

    if (existingLogsJson) {
      logs = JSON.parse(existingLogsJson);
    }

    // Add new log at the beginning (newest first)
    logs.unshift({
      timestamp,
      message: logMessage
    });

    // Trim to keep only the most recent logs
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(0, MAX_LOGS);
    }

    // Save back to Redis
    await redis.set(LOGS_KEY, JSON.stringify(logs));

  } catch (error) {
    // Fallback to console if Redis logging fails
    console.error('[logCritical] Failed to log to Redis:', error);
    console.error('[logCritical] Original data:', data);
  }
}

/**
 * Retrieves all critical logs from Redis
 * @param limit - Maximum number of logs to retrieve (default: 100)
 * @returns Array of log entries
 */
export async function getCriticalLogs(limit: number = 100): Promise<LogEntry[]> {
  try {
    const logsJson = await redis.get(LOGS_KEY);
    if (!logsJson) {
      return [];
    }

    const logs: LogEntry[] = JSON.parse(logsJson);
    return logs.slice(0, limit);
  } catch (error) {
    console.error('[getCriticalLogs] Failed to retrieve logs:', error);
    return [];
  }
}

/**
 * Clears all critical logs from Redis
 */
export async function clearCriticalLogs(): Promise<void> {
  try {
    await redis.del(LOGS_KEY);
  } catch (error) {
    console.error('[clearCriticalLogs] Failed to clear logs:', error);
  }
}
