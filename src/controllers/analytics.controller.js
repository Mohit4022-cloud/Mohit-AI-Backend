import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export const analyticsController = {
  async getDashboardMetrics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const metrics = await Promise.all([
        getLeadMetrics(startDate, endDate),
        getConversionMetrics(startDate, endDate),
        getResponseTimeMetrics(startDate, endDate),
        getChannelPerformance(startDate, endDate)
      ]);

      const [leads, conversions, responseTime, channels] = metrics;

      res.json({
        success: true,
        data: {
          overview: {
            totalLeads: leads.total,
            qualifiedLeads: leads.qualified,
            conversionRate: conversions.rate,
            avgResponseTime: responseTime.average
          },
          trends: {
            daily: leads.daily,
            weekly: leads.weekly
          },
          channels,
          topPerformers: await getTopPerformingAgents()
        }
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch analytics data' 
      });
    }
  },

  async getLeadAnalytics(req, res) {
    try {
      const { leadId } = req.params;
      
      const leadData = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' }
          },
          calls: true,
          messages: true
        }
      });

      if (!leadData) {
        return res.status(404).json({ 
          success: false, 
          error: 'Lead not found' 
        });
      }

      const analytics = {
        lead: leadData,
        timeline: generateLeadTimeline(leadData),
        engagement: calculateEngagementScore(leadData),
        nextBestAction: await predictNextAction(leadData)
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching lead analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch lead analytics' 
      });
    }
  },

  async getPerformanceReport(req, res) {
    try {
      const { period = '7d' } = req.query;
      
      const report = await generatePerformanceReport(period);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error generating report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate performance report' 
      });
    }
  }
};

// Helper functions
async function getLeadMetrics(startDate, endDate) {
  const leads = await prisma.lead.count({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  const qualified = await prisma.lead.count({
    where: {
      status: 'QUALIFIED',
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  return {
    total: leads,
    qualified,
    daily: await getDailyLeadCount(startDate, endDate),
    weekly: await getWeeklyLeadCount(startDate, endDate)
  };
}

async function getConversionMetrics(startDate, endDate) {
  const total = await prisma.lead.count({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  const converted = await prisma.lead.count({
    where: {
      status: 'CONVERTED',
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  return {
    total: converted,
    rate: total > 0 ? (converted / total) * 100 : 0
  };
}

async function getResponseTimeMetrics(startDate, endDate) {
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      firstContactAt: { not: null }
    },
    select: {
      createdAt: true,
      firstContactAt: true
    }
  });

  const responseTimes = leads.map(lead => 
    (new Date(lead.firstContactAt) - new Date(lead.createdAt)) / 1000 / 60
  );

  return {
    average: responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0,
    median: calculateMedian(responseTimes),
    under5min: responseTimes.filter(time => time < 5).length
  };
}

async function getChannelPerformance(startDate, endDate) {
  const channels = ['VOICE', 'SMS', 'EMAIL', 'CHAT'];
  
  const performance = await Promise.all(
    channels.map(async (channel) => {
      const count = await prisma.leadActivity.count({
        where: {
          type: channel,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      });

      return { channel, count };
    })
  );

  return performance;
}

async function getTopPerformingAgents() {
  // Placeholder for agent performance metrics
  return [
    { name: 'AI Agent 1', score: 95, leads: 150 },
    { name: 'AI Agent 2', score: 92, leads: 143 },
    { name: 'AI Agent 3', score: 88, leads: 128 }
  ];
}

function generateLeadTimeline(leadData) {
  const timeline = [];
  
  if (leadData.activities) {
    leadData.activities.forEach(activity => {
      timeline.push({
        timestamp: activity.createdAt,
        type: activity.type,
        description: activity.description,
        outcome: activity.outcome
      });
    });
  }

  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function calculateEngagementScore(leadData) {
  let score = 0;
  
  if (leadData.calls?.length > 0) score += 30;
  if (leadData.messages?.length > 0) score += 20;
  if (leadData.activities?.length > 5) score += 25;
  if (leadData.status === 'QUALIFIED') score += 25;
  
  return Math.min(score, 100);
}

async function predictNextAction(leadData) {
  // AI-powered prediction logic
  const engagementScore = calculateEngagementScore(leadData);
  
  if (engagementScore > 80) {
    return { action: 'SCHEDULE_DEMO', confidence: 0.85 };
  } else if (engagementScore > 50) {
    return { action: 'FOLLOW_UP_CALL', confidence: 0.75 };
  } else {
    return { action: 'SEND_NURTURE_EMAIL', confidence: 0.65 };
  }
}

function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;
  
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

async function getDailyLeadCount(startDate, endDate) {
  // Implementation for daily lead count
  return [];
}

async function getWeeklyLeadCount(startDate, endDate) {
  // Implementation for weekly lead count
  return [];
}

async function generatePerformanceReport(period) {
  // Implementation for performance report generation
  return {
    period,
    summary: {
      totalLeads: 500,
      responseRate: 98.5,
      conversionRate: 35.2,
      avgResponseTime: 3.2
    },
    recommendations: [
      'Increase SMS follow-ups for mobile leads',
      'Optimize call scripts for better qualification',
      'Expand operating hours to cover more time zones'
    ]
  };
}

export default analyticsController;