import { logger } from '../../../utils/logger.js';

export default function aiQueueHandler(socket, io) {
  const { userId, organizationId } = socket;

  // Join queue room
  socket.on('queue:join', () => {
    socket.join(`queue_${organizationId}`);
    logger.info(`User ${userId} joined queue room for organization: ${organizationId}`);
    socket.emit('queue:joined', { organizationId });
  });

  // Leave queue room
  socket.on('queue:leave', () => {
    socket.leave(`queue_${organizationId}`);
    logger.info(`User ${userId} left queue room for organization: ${organizationId}`);
    socket.emit('queue:left', { organizationId });
  });

  // Add lead to queue
  socket.on('queue:add', async (data) => {
    try {
      const { leadId, priority = 'MEDIUM', scheduledTime, settings } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:added', {
        leadId,
        priority,
        scheduledTime,
        settings,
        addedBy: userId,
        timestamp: new Date().toISOString(),
      });

      // Also broadcast to AI calls room
      io.to(`ai_calls_${organizationId}`).emit('queue:added', {
        leadId,
        priority,
        scheduledTime,
        settings,
        addedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Lead added to queue: ${leadId} with priority: ${priority}`);
    } catch (error) {
      logger.error('Error adding to queue:', error);
      socket.emit('error', { message: 'Failed to add to queue' });
    }
  });

  // Remove from queue
  socket.on('queue:remove', async (data) => {
    try {
      const { queueId, reason } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:removed', {
        queueId,
        reason,
        removedBy: userId,
        timestamp: new Date().toISOString(),
      });

      // Also broadcast to AI calls room
      io.to(`ai_calls_${organizationId}`).emit('queue:removed', {
        queueId,
        reason,
        removedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Item removed from queue: ${queueId}`);
    } catch (error) {
      logger.error('Error removing from queue:', error);
      socket.emit('error', { message: 'Failed to remove from queue' });
    }
  });

  // Update queue priority
  socket.on('queue:update_priority', async (data) => {
    try {
      const { queueId, priority } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:priority_updated', {
        queueId,
        priority,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue priority updated: ${queueId} -> ${priority}`);
    } catch (error) {
      logger.error('Error updating queue priority:', error);
      socket.emit('error', { message: 'Failed to update queue priority' });
    }
  });

  // Start queue processing
  socket.on('queue:start_processing', async (data) => {
    try {
      const { maxConcurrent = 3, priority } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:processing_started', {
        maxConcurrent,
        priority,
        startedBy: userId,
        sessionId: `session_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
      });

      // Also broadcast to AI calls room
      io.to(`ai_calls_${organizationId}`).emit('queue:processing_started', {
        maxConcurrent,
        priority,
        startedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue processing started by user: ${userId}`);
    } catch (error) {
      logger.error('Error starting queue processing:', error);
      socket.emit('error', { message: 'Failed to start queue processing' });
    }
  });

  // Stop queue processing
  socket.on('queue:stop_processing', async (data) => {
    try {
      const { sessionId, reason } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:processing_stopped', {
        sessionId,
        reason,
        stoppedBy: userId,
        timestamp: new Date().toISOString(),
      });

      // Also broadcast to AI calls room
      io.to(`ai_calls_${organizationId}`).emit('queue:processing_stopped', {
        sessionId,
        reason,
        stoppedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue processing stopped by user: ${userId}`);
    } catch (error) {
      logger.error('Error stopping queue processing:', error);
      socket.emit('error', { message: 'Failed to stop queue processing' });
    }
  });

  // Queue status update
  socket.on('queue:status_update', async (data) => {
    try {
      const { queueId, status, metadata } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:status_updated', {
        queueId,
        status,
        metadata,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue status updated: ${queueId} -> ${status}`);
    } catch (error) {
      logger.error('Error updating queue status:', error);
      socket.emit('error', { message: 'Failed to update queue status' });
    }
  });

  // Queue metrics update
  socket.on('queue:metrics', async (data) => {
    try {
      const { metrics } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:metrics_updated', {
        metrics,
        timestamp: new Date().toISOString(),
      });

      logger.info('Queue metrics updated');
    } catch (error) {
      logger.error('Error updating queue metrics:', error);
      socket.emit('error', { message: 'Failed to update queue metrics' });
    }
  });

  // Queue reorder
  socket.on('queue:reorder', async (data) => {
    try {
      const { queueItems } = data; // Array of { queueId, newPosition }
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:reordered', {
        queueItems,
        reorderedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue reordered by user: ${userId}`);
    } catch (error) {
      logger.error('Error reordering queue:', error);
      socket.emit('error', { message: 'Failed to reorder queue' });
    }
  });

  // Queue item assignment
  socket.on('queue:assign', async (data) => {
    try {
      const { queueId, assignedTo, assignedType } = data; // assignedType: 'user' or 'ai'
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:assigned', {
        queueId,
        assignedTo,
        assignedType,
        assignedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue item assigned: ${queueId} -> ${assignedType}:${assignedTo}`);
    } catch (error) {
      logger.error('Error assigning queue item:', error);
      socket.emit('error', { message: 'Failed to assign queue item' });
    }
  });

  // Queue batch operations
  socket.on('queue:batch_operation', async (data) => {
    try {
      const { operation, queueIds, metadata } = data; // operation: 'remove', 'update_priority', 'assign'
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:batch_operation_completed', {
        operation,
        queueIds,
        metadata,
        initiatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Batch queue operation: ${operation} on ${queueIds.length} items`);
    } catch (error) {
      logger.error('Error performing batch queue operation:', error);
      socket.emit('error', { message: 'Failed to perform batch queue operation' });
    }
  });

  // Queue settings update
  socket.on('queue:settings_update', async (data) => {
    try {
      const { settings } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:settings_updated', {
        settings,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Queue settings updated by user: ${userId}`);
    } catch (error) {
      logger.error('Error updating queue settings:', error);
      socket.emit('error', { message: 'Failed to update queue settings' });
    }
  });

  // Queue heartbeat (for monitoring active processing)
  socket.on('queue:heartbeat', async (data) => {
    try {
      const { sessionId, status } = data;
      
      // Broadcast to all users in the queue room
      socket.to(`queue_${organizationId}`).emit('queue:heartbeat', {
        sessionId,
        status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error sending queue heartbeat:', error);
      socket.emit('error', { message: 'Failed to send queue heartbeat' });
    }
  });

  // Queue error reporting
  socket.on('queue:error', async (data) => {
    try {
      const { queueId, error, severity = 'error' } = data;
      
      // Broadcast to all users in the queue room
      io.to(`queue_${organizationId}`).emit('queue:error_reported', {
        queueId,
        error,
        severity,
        reportedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.error(`Queue error reported: ${queueId} -> ${error}`);
    } catch (error) {
      logger.error('Error reporting queue error:', error);
      socket.emit('error', { message: 'Failed to report queue error' });
    }
  });
}