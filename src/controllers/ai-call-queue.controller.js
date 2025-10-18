import { logger } from '../utils/logger.js';
import { aiCallQueueService } from '../services/ai/aiCallQueueService.js';

export const aiCallQueueController = {
  // Get call queue
  async getQueue(req, res) {
    try {
      const { organizationId } = req.user;
      const { status, priority } = req.query;
      
      const queue = await aiCallQueueService.getQueue(organizationId, {
        status,
        priority,
      });
      
      res.json({
        success: true,
        data: queue,
      });
    } catch (error) {
      logger.error('Error getting call queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get call queue',
        details: error.message,
      });
    }
  },

  // Add call to queue
  async addToQueue(req, res) {
    try {
      const { organizationId, userId } = req.user;
      const { leadId, priority = 'MEDIUM', scheduledTime, settings } = req.body;
      
      const queuedCall = await aiCallQueueService.addToQueue({
        leadId,
        organizationId,
        userId,
        priority,
        scheduledTime,
        settings,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('queue:added', queuedCall);
      }
      
      res.status(201).json({
        success: true,
        data: queuedCall,
      });
    } catch (error) {
      logger.error('Error adding to queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to queue',
        details: error.message,
      });
    }
  },

  // Update queue priority
  async updatePriority(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { priority } = req.body;
      
      const queuedCall = await aiCallQueueService.updatePriority(
        callId,
        organizationId,
        priority
      );
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('queue:priority_updated', { callId, priority });
      }
      
      res.json({
        success: true,
        data: queuedCall,
      });
    } catch (error) {
      logger.error('Error updating queue priority:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update queue priority',
        details: error.message,
      });
    }
  },

  // Remove from queue
  async removeFromQueue(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      
      await aiCallQueueService.removeFromQueue(callId, organizationId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('queue:removed', { callId });
      }
      
      res.json({
        success: true,
        message: 'Call removed from queue successfully',
      });
    } catch (error) {
      logger.error('Error removing from queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from queue',
        details: error.message,
      });
    }
  },

  // Process queue (start calling)
  async processQueue(req, res) {
    try {
      const { organizationId } = req.user;
      const { maxConcurrent = 3, priority } = req.body;
      
      const processingSession = await aiCallQueueService.processQueue(organizationId, {
        maxConcurrent,
        priority,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('queue:processing_started', processingSession);
      }
      
      res.json({
        success: true,
        data: processingSession,
      });
    } catch (error) {
      logger.error('Error processing queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process queue',
        details: error.message,
      });
    }
  },
};