import { logger } from '../../utils/logger.js';
import { authenticateSocket } from '../../middleware/auth.js';
import callHandler from './handlers/callHandler.js';
import chatHandler from './handlers/chatHandler.js';
import notificationHandler from './handlers/notificationHandler.js';
import aiCallHandler from './handlers/aiCallHandler.js';
import aiTranscriptionHandler from './handlers/aiTranscriptionHandler.js';
import aiInsightsHandler from './handlers/aiInsightsHandler.js';
import aiQueueHandler from './handlers/aiQueueHandler.js';

export function initializeWebSocketHandlers(io) {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join organization room if applicable
    if (socket.organizationId) {
      socket.join(`org:${socket.organizationId}`);
      // Join AI calls room for real-time updates
      socket.join(`ai_calls_${socket.organizationId}`);
    }

    // Register handlers
    callHandler(socket, io);
    chatHandler(socket, io);
    notificationHandler(socket, io);
    aiCallHandler(socket, io);
    aiTranscriptionHandler(socket, io);
    aiInsightsHandler(socket, io);
    aiQueueHandler(socket, io);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Periodic health check
  setInterval(() => {
    io.emit('ping', { timestamp: new Date().toISOString() });
  }, 30000);
}

export function emitToUser(userId, event, data) {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToOrganization(orgId, event, data) {
  const io = global.io;
  if (io) {
    io.to(`org:${orgId}`).emit(event, data);
  }
}

export function broadcastToAll(event, data) {
  const io = global.io;
  if (io) {
    io.emit(event, data);
  }
}

export function emitToAICalls(orgId, event, data) {
  const io = global.io;
  if (io) {
    io.to(`ai_calls_${orgId}`).emit(event, data);
  }
}

export function emitToCall(callId, event, data) {
  const io = global.io;
  if (io) {
    io.to(`call_${callId}`).emit(event, data);
  }
}