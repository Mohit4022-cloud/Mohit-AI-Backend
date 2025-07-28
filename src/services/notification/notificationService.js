import { Server } from 'socket.io';
import logger from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('Notification service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('subscribe', async (data) => {
        const { userId, channels } = data;
        this.connectedClients.set(socket.id, { userId, socket, channels });
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Join channel-specific rooms
        channels.forEach(channel => {
          socket.join(`channel:${channel}`);
        });
        
        // Send initial state
        await this.sendInitialState(socket, userId);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  async sendInitialState(socket, userId) {
    try {
      const unreadNotifications = await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });

      const activeLeads = await prisma.lead.count({
        where: {
          assignedTo: userId,
          status: { in: ['NEW', 'CONTACTING', 'QUALIFYING'] }
        }
      });

      socket.emit('initial-state', {
        unreadCount: unreadNotifications,
        activeLeads,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error sending initial state:', error);
    }
  }

  // Send notification to specific user
  async notifyUser(userId, notification) {
    try {
      // Store notification in database
      const savedNotification = await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          priority: notification.priority || 'NORMAL'
        }
      });

      // Send real-time notification
      this.io.to(`user:${userId}`).emit('notification', {
        id: savedNotification.id,
        ...notification,
        timestamp: savedNotification.createdAt
      });

      // Send push notification if enabled
      await this.sendPushNotification(userId, notification);

      return savedNotification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  // Broadcast to channel
  async broadcastToChannel(channel, event, data) {
    this.io.to(`channel:${channel}`).emit(event, {
      channel,
      data,
      timestamp: new Date()
    });
  }

  // Lead-specific notifications
  async notifyLeadUpdate(leadId, update) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedUser: true }
    });

    if (lead && lead.assignedTo) {
      await this.notifyUser(lead.assignedTo, {
        type: 'LEAD_UPDATE',
        title: 'Lead Updated',
        message: `Lead ${lead.name} has been updated`,
        data: { leadId, update },
        priority: update.urgent ? 'HIGH' : 'NORMAL'
      });
    }

    // Broadcast to supervisors
    await this.broadcastToChannel('supervisors', 'lead-update', {
      leadId,
      leadName: lead.name,
      update
    });
  }

  // System alerts
  async sendSystemAlert(alert) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await this.notifyUser(admin.id, {
        type: 'SYSTEM_ALERT',
        title: alert.title,
        message: alert.message,
        priority: 'HIGH',
        data: alert.data
      });
    }
  }

  // Performance alerts
  async sendPerformanceAlert(metrics) {
    if (metrics.responseTime > 300) { // 5 minutes in seconds
      await this.sendSystemAlert({
        title: 'High Response Time Alert',
        message: `Average response time is ${Math.round(metrics.responseTime / 60)} minutes`,
        data: metrics
      });
    }

    if (metrics.conversionRate < 20) {
      await this.sendSystemAlert({
        title: 'Low Conversion Rate Alert',
        message: `Conversion rate dropped to ${metrics.conversionRate}%`,
        data: metrics
      });
    }
  }

  // Queue notifications
  async notifyQueueUpdate(queueName, update) {
    await this.broadcastToChannel(`queue:${queueName}`, 'queue-update', update);
  }

  // Push notifications (placeholder for mobile/browser push)
  async sendPushNotification(userId, notification) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true, notificationPreferences: true }
      });

      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        return;
      }

      // Check user preferences
      if (!this.shouldSendPush(user.notificationPreferences, notification.type)) {
        return;
      }

      // Implementation would integrate with push notification service
      // (Firebase, OneSignal, etc.)
      logger.info(`Push notification queued for user ${userId}`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  shouldSendPush(preferences, notificationType) {
    if (!preferences) return true;
    
    const typePreference = preferences[notificationType];
    return typePreference?.push !== false;
  }

  // Batch notifications
  async sendBatchNotifications(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => 
        this.notifyUser(notification.userId, notification)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`Batch notifications sent: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, total: notifications.length };
  }

  // Mark notifications as read
  async markAsRead(userId, notificationIds) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: { read: true }
    });

    this.io.to(`user:${userId}`).emit('notifications-read', { notificationIds });
  }

  // Get notification statistics
  async getNotificationStats() {
    const stats = await prisma.$transaction([
      prisma.notification.count(),
      prisma.notification.count({ where: { read: false } }),
      prisma.notification.count({ where: { priority: 'HIGH' } }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: true
      })
    ]);

    return {
      total: stats[0],
      unread: stats[1],
      highPriority: stats[2],
      byType: stats[3]
    };
  }
}

export default new NotificationService();