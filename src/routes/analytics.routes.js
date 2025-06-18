import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.user.organizationId;

    // Date range filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get metrics
    const [
      totalLeads,
      contactedLeads,
      qualifiedLeads,
      avgResponseTime,
      channelDistribution
    ] = await Promise.all([
      // Total leads
      prisma.lead.count({
        where: {
          organizationId,
          createdAt: dateFilter
        }
      }),
      
      // Contacted leads
      prisma.lead.count({
        where: {
          organizationId,
          status: { in: ['CONTACTED', 'QUALIFYING', 'QUALIFIED'] },
          createdAt: dateFilter
        }
      }),
      
      // Qualified leads
      prisma.lead.count({
        where: {
          organizationId,
          status: 'QUALIFIED',
          createdAt: dateFilter
        }
      }),
      
      // Average response time (mock for now)
      Promise.resolve(47),
      
      // Channel distribution
      prisma.activity.groupBy({
        by: ['type'],
        where: {
          lead: {
            organizationId
          },
          type: { in: ['CALL_INITIATED', 'SMS_SENT', 'EMAIL_SENT', 'CHAT_INITIATED'] },
          createdAt: dateFilter
        },
        _count: true
      })
    ]);

    const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
    const contactRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;

    res.json({
      totalLeads,
      contactedLeads,
      qualifiedLeads,
      qualificationRate: Math.round(qualificationRate),
      contactRate: Math.round(contactRate),
      avgResponseTime,
      channelDistribution: channelDistribution.map(channel => ({
        channel: channel.type.replace('_INITIATED', '').replace('_SENT', ''),
        count: channel._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get response time analytics
router.get('/response-times', authenticate, async (req, res, next) => {
  try {
    const { period = '24h' } = req.query;
    const organizationId = req.user.organizationId;

    // Mock data for response times
    // TODO: Implement actual response time tracking
    const responseTimeData = generateMockResponseTimeData(period);

    res.json(responseTimeData);
  } catch (error) {
    next(error);
  }
});

// Get conversion funnel
router.get('/funnel', authenticate, async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const [newLeads, contacted, qualifying, qualified, converted] = await Promise.all([
      prisma.lead.count({ where: { organizationId, status: 'NEW' } }),
      prisma.lead.count({ where: { organizationId, status: 'CONTACTED' } }),
      prisma.lead.count({ where: { organizationId, status: 'QUALIFYING' } }),
      prisma.lead.count({ where: { organizationId, status: 'QUALIFIED' } }),
      prisma.lead.count({ where: { organizationId, status: 'CLOSED_WON' } })
    ]);

    res.json({
      funnel: [
        { stage: 'New Leads', count: newLeads },
        { stage: 'Contacted', count: contacted },
        { stage: 'Qualifying', count: qualifying },
        { stage: 'Qualified', count: qualified },
        { stage: 'Converted', count: converted }
      ]
    });
  } catch (error) {
    next(error);
  }
});

// Get team performance
router.get('/team-performance', authenticate, async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const teamMembers = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            leads: true,
            activities: true,
            calls: true
          }
        }
      }
    });

    const performance = teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      totalLeads: member._count.leads,
      totalActivities: member._count.activities,
      totalCalls: member._count.calls,
      avgResponseTime: Math.floor(Math.random() * 60 + 30) // Mock data
    }));

    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// Helper functions
function generateMockResponseTimeData(period) {
  const now = new Date();
  const data = [];
  
  let intervals, intervalMs;
  
  switch (period) {
    case '24h':
      intervals = 24;
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      intervals = 7;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '30d':
      intervals = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    default:
      intervals = 24;
      intervalMs = 60 * 60 * 1000;
  }

  for (let i = intervals - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs);
    data.push({
      time: time.toISOString(),
      avgResponseTime: Math.floor(Math.random() * 30 + 35), // 35-65 seconds
      count: Math.floor(Math.random() * 50 + 10)
    });
  }

  return data;
}

export default router;