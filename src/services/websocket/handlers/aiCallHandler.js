import { logger } from '../../../utils/logger.js';

export default function aiCallHandler(socket, io) {
  const { userId, organizationId } = socket;

  // Join call-specific room
  socket.on('join:call', (callId) => {
    socket.join(`call_${callId}`);
    logger.info(`User ${userId} joined call room: ${callId}`);
    socket.emit('joined:call', { callId });
  });

  // Leave call-specific room
  socket.on('leave:call', (callId) => {
    socket.leave(`call_${callId}`);
    logger.info(`User ${userId} left call room: ${callId}`);
    socket.emit('left:call', { callId });
  });

  // Handle AI call status updates
  socket.on('call:status_update', async (data) => {
    try {
      const { callId, status, agentStatus, metadata } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:status', {
        callId,
        status,
        agentStatus,
        timestamp: new Date().toISOString(),
        metadata,
      });

      // Also broadcast to organization AI calls room
      io.to(`ai_calls_${organizationId}`).emit('call:status', {
        callId,
        status,
        agentStatus,
        timestamp: new Date().toISOString(),
        metadata,
      });

      logger.info(`Call status updated: ${callId} -> ${status}`);
    } catch (error) {
      logger.error('Error handling call status update:', error);
      socket.emit('error', { message: 'Failed to update call status' });
    }
  });

  // Handle AI agent status updates
  socket.on('ai:status_update', async (data) => {
    try {
      const { callId, status, metadata } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('ai:status', {
        callId,
        status,
        timestamp: new Date().toISOString(),
        metadata,
      });

      logger.info(`AI status updated: ${callId} -> ${status}`);
    } catch (error) {
      logger.error('Error handling AI status update:', error);
      socket.emit('error', { message: 'Failed to update AI status' });
    }
  });

  // Handle call metrics updates
  socket.on('call:metrics_update', async (data) => {
    try {
      const { callId, metrics } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:metrics', {
        callId,
        metrics,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Call metrics updated: ${callId}`);
    } catch (error) {
      logger.error('Error handling call metrics update:', error);
      socket.emit('error', { message: 'Failed to update call metrics' });
    }
  });

  // Handle AI behavior adjustment
  socket.on('ai:behavior_adjust', async (data) => {
    try {
      const { callId, settings } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('ai:behavior_updated', {
        callId,
        settings,
        timestamp: new Date().toISOString(),
      });

      logger.info(`AI behavior adjusted for call: ${callId}`);
    } catch (error) {
      logger.error('Error handling AI behavior adjustment:', error);
      socket.emit('error', { message: 'Failed to adjust AI behavior' });
    }
  });

  // Handle human takeover request
  socket.on('call:takeover_request', async (data) => {
    try {
      const { callId, reason } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:takeover_requested', {
        callId,
        requestedBy: userId,
        reason,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Human takeover requested for call: ${callId} by user: ${userId}`);
    } catch (error) {
      logger.error('Error handling takeover request:', error);
      socket.emit('error', { message: 'Failed to request takeover' });
    }
  });

  // Handle AI pause/resume
  socket.on('ai:toggle', async (data) => {
    try {
      const { callId, action } = data; // action: 'pause' or 'resume'
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('ai:toggled', {
        callId,
        action,
        triggeredBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`AI ${action} for call: ${callId} by user: ${userId}`);
    } catch (error) {
      logger.error('Error handling AI toggle:', error);
      socket.emit('error', { message: 'Failed to toggle AI' });
    }
  });

  // Handle real-time sentiment updates
  socket.on('call:sentiment_update', async (data) => {
    try {
      const { callId, sentiment, confidence } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:sentiment', {
        callId,
        sentiment,
        confidence,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Sentiment updated for call: ${callId} -> ${sentiment}`);
    } catch (error) {
      logger.error('Error handling sentiment update:', error);
      socket.emit('error', { message: 'Failed to update sentiment' });
    }
  });

  // Handle call recording events
  socket.on('call:recording', async (data) => {
    try {
      const { callId, action, url } = data; // action: 'started', 'stopped', 'available'
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:recording_event', {
        callId,
        action,
        url,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Recording ${action} for call: ${callId}`);
    } catch (error) {
      logger.error('Error handling recording event:', error);
      socket.emit('error', { message: 'Failed to handle recording event' });
    }
  });

  // Handle progressive settings changes
  socket.on('call:progressive_settings', async (data) => {
    try {
      const { callId, level, features } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:progressive_settings_updated', {
        callId,
        level,
        features,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Progressive settings updated for call: ${callId} -> level: ${level}`);
    } catch (error) {
      logger.error('Error handling progressive settings update:', error);
      socket.emit('error', { message: 'Failed to update progressive settings' });
    }
  });

  // Handle content card interactions
  socket.on('call:content_card_action', async (data) => {
    try {
      const { callId, cardId, action } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('call:content_card_actioned', {
        callId,
        cardId,
        action,
        triggeredBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Content card actioned: ${cardId} -> ${action} for call: ${callId}`);
    } catch (error) {
      logger.error('Error handling content card action:', error);
      socket.emit('error', { message: 'Failed to handle content card action' });
    }
  });
}