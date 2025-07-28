import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export const dashboardController = {
  async getOverview(req, res) {
    try {
      const { organizationId } = req.user;
      
      // Get key metrics
      const [totalLeads, activeLeads, conversions, todayActivities] = await Promise.all([
        prisma.lead.count({ where: { organizationId } }),
        prisma.lead.count({ where: { organizationId, status: { in: ['NEW', 'CONTACTED', 'QUALIFYING'] } } }),
        prisma.lead.count({ where: { organizationId, status: 'CLOSED_WON' } }),
        prisma.activity.count({ 
          where: { 
            lead: { organizationId },
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        })
      ]);

      const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : 0;

      res.json({
        success: true,
        data: {
          metrics: {
            totalLeads,
            activeLeads,
            conversions,
            conversionRate: parseFloat(conversionRate),
            todayActivities
          },
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      logger.error('Dashboard overview error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
    }
  }
};

export default dashboardController;