import Bull from 'bull';
import { logger } from '../utils/logger.js';

let notificationQueue;

export function initializeNotificationWorker() {
  // Only initialize if Redis is configured
  if (!process.env.REDIS_HOST) {
    logger.warn('Redis not configured, skipping notification worker initialization');
    return;
  }

  try {
    notificationQueue = new Bull('notifications', {
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    });

    notificationQueue.process(async (job) => {
      const { type, userId, data } = job.data;
      
      logger.info(`Processing notification: ${type} for user ${userId}`);
      
      // TODO: Implement actual notification logic
      // This could send push notifications, in-app notifications, etc.
      
      return { success: true, type, userId };
    });

    notificationQueue.on('completed', (job) => {
      logger.info(`Notification job ${job.id} completed`);
    });

    notificationQueue.on('failed', (job, err) => {
      logger.error(`Notification job ${job.id} failed:`, err);
    });

    logger.info('Notification worker initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize notification worker:', error);
  }
}

export function sendNotification(type, userId, data, options = {}) {
  if (!notificationQueue) {
    logger.warn('Notification queue not initialized');
    return null;
  }

  return notificationQueue.add({ type, userId, data }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    ...options
  });
}