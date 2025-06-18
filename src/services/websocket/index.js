import { logger } from '../../utils/logger.js';
import { authenticateSocket } from '../../middleware/auth.js';
import callHandler from './handlers/callHandler.js';
import chatHandler from './handlers/chatHandler.js';
import notificationHandler from './handlers/notificationHandler.js';

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
    }

    // Register handlers
    callHandler(socket, io);
    chatHandler(socket, io);
    notificationHandler(socket, io);

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