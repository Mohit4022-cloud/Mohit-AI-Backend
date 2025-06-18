import Bull from 'bull';
import { logger } from '../../utils/logger.js';

const queues = {};

export function getQueue(queueName) {
  if (!process.env.REDIS_HOST) {
    logger.warn(`Redis not configured, cannot create queue: ${queueName}`);
    return null;
  }

  if (!queues[queueName]) {
    queues[queueName] = new Bull(queueName, {
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    });
    
    logger.info(`Created queue: ${queueName}`);
  }

  return queues[queueName];
}

export async function publishToQueue(queueName, data, options = {}) {
  const queue = getQueue(queueName);
  
  if (!queue) {
    logger.warn(`Cannot publish to queue ${queueName} - queue not available`);
    return null;
  }

  try {
    const job = await queue.add(data, {
      removeOnComplete: true,
      removeOnFail: false,
      ...options
    });
    
    logger.debug(`Published to queue ${queueName}:`, { jobId: job.id });
    return job;
  } catch (error) {
    logger.error(`Failed to publish to queue ${queueName}:`, error);
    throw error;
  }
}

export function closeAllQueues() {
  Object.values(queues).forEach(queue => {
    queue.close();
  });
  logger.info('All queues closed');
}