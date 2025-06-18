import { logger } from '../utils/logger.js';
import { initializeLeadWorker } from './leadWorker.js';
import { initializeEmailWorker } from './emailWorker.js';
import { initializeNotificationWorker } from './notificationWorker.js';

export function startWorkers() {
  logger.info('Starting background workers...');
  
  try {
    // Initialize lead processing worker
    initializeLeadWorker();
    
    // Initialize email worker
    initializeEmailWorker();
    
    // Initialize notification worker
    initializeNotificationWorker();
    
    logger.info('All workers started successfully');
  } catch (error) {
    logger.error('Failed to start workers:', error);
    // Don't crash the server if workers fail to start
  }
}