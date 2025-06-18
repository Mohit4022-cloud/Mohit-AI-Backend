import Bull from 'bull';
import { logger } from '../utils/logger.js';

let leadQueue;

export function initializeLeadWorker() {
  // Only initialize if Redis is configured
  if (!process.env.REDIS_HOST) {
    logger.warn('Redis not configured, skipping lead worker initialization');
    return;
  }

  try {
    leadQueue = new Bull('lead-processing', {
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    });

    // Process lead response jobs
    leadQueue.process('respond-to-lead', async (job) => {
      const { leadId, channel } = job.data;
      logger.info(`Processing lead response: ${leadId} via ${channel}`);
      
      // TODO: Implement actual lead response logic
      return { success: true, leadId, channel };
    });

    // Process lead retry jobs
    leadQueue.process('retry-lead-response', async (job) => {
      const { leadId, attempt } = job.data;
      logger.info(`Retrying lead response: ${leadId}, attempt ${attempt}`);
      
      // TODO: Implement retry logic
      return { success: true, leadId, attempt };
    });

    leadQueue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    leadQueue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });

    logger.info('Lead worker initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize lead worker:', error);
  }
}

export function addLeadJob(type, data, options = {}) {
  if (!leadQueue) {
    logger.warn('Lead queue not initialized');
    return null;
  }

  return leadQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    ...options
  });
}