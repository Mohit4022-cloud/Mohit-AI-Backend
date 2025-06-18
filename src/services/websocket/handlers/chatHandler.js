import { logger } from '../../../utils/logger.js';

export default function chatHandler(socket, io) {
  // Handle live chat events
  
  socket.on('chat:join', async (data) => {
    try {
      const { leadId } = data;
      socket.join(`chat:${leadId}`);
      
      logger.info(`User ${socket.userId} joined chat for lead ${leadId}`);
      
      // Notify other agents
      socket.to(`org:${socket.organizationId}`).emit('chat:agent_joined', {
        leadId,
        agentId: socket.userId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error joining chat:', error);
      socket.emit('chat:error', { message: error.message });
    }
  });

  socket.on('chat:message', async (data) => {
    try {
      const { leadId, message } = data;
      
      // TODO: Save message to database
      
      // Broadcast to all in the chat room
      io.to(`chat:${leadId}`).emit('chat:new_message', {
        leadId,
        message,
        userId: socket.userId,
        timestamp: new Date()
      });
      
      logger.info(`Chat message in lead ${leadId} from ${socket.userId}`);
    } catch (error) {
      logger.error('Error sending chat message:', error);
      socket.emit('chat:error', { message: error.message });
    }
  });

  socket.on('chat:typing', (data) => {
    const { leadId, isTyping } = data;
    
    socket.to(`chat:${leadId}`).emit('chat:agent_typing', {
      leadId,
      agentId: socket.userId,
      isTyping
    });
  });

  socket.on('chat:leave', (data) => {
    const { leadId } = data;
    socket.leave(`chat:${leadId}`);
    
    socket.to(`org:${socket.organizationId}`).emit('chat:agent_left', {
      leadId,
      agentId: socket.userId,
      timestamp: new Date()
    });
  });
}