import { logger } from '../../../utils/logger.js';

export default function notificationHandler(socket, io) {
  // Handle notification events
  
  socket.on('notification:subscribe', () => {
    logger.info(`User ${socket.userId} subscribed to notifications`);
    socket.join(`notifications:${socket.userId}`);
  });

  socket.on('notification:mark_read', async (data) => {
    try {
      const { notificationId } = data;
      
      // TODO: Mark notification as read in database
      
      socket.emit('notification:marked_read', { notificationId });
      logger.info(`Notification ${notificationId} marked as read by ${socket.userId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      socket.emit('notification:error', { message: error.message });
    }
  });

  socket.on('notification:mark_all_read', async () => {
    try {
      // TODO: Mark all notifications as read for user
      
      socket.emit('notification:all_marked_read', { 
        userId: socket.userId,
        timestamp: new Date()
      });
      
      logger.info(`All notifications marked as read for ${socket.userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      socket.emit('notification:error', { message: error.message });
    }
  });

  // Handle real-time notifications
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });
}

// Helper function to send notification to specific user
export function sendNotificationToUser(io, userId, notification) {
  io.to(`notifications:${userId}`).emit('notification:new', notification);
  io.to(`user:${userId}`).emit('notification:count_update', {
    unreadCount: notification.unreadCount
  });
}