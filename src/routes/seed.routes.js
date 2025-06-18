import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Seed dummy leads - protected route
router.post('/leads', authenticate, async (req, res, next) => {
  try {
    // Only allow ADMIN users
    if (req.user.role !== 'ADMIN') {
      throw new AppError('Only admins can seed data', 403);
    }

    const { count = 100 } = req.body;
    const organizationId = req.user.organizationId;

    // Lead sources
    const sources = ['Website', 'LinkedIn', 'Email Campaign', 'Webinar', 'Trade Show', 'Referral', 'Cold Outreach'];
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'LOST'];
    const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate'];
    const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
    
    // Sample first names and last names
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const companies = ['Tech Corp', 'Global Solutions', 'Innovate Inc', 'Digital Dynamics', 'Cloud Systems', 'Data Insights', 'Smart Tech', 'Future Vision', 'NextGen Solutions', 'Alpha Innovations'];

    const leads = [];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
      
      const lead = {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`,
        phone: `+1${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        company,
        title: ['CEO', 'CTO', 'VP Sales', 'Marketing Director', 'Product Manager', 'Sales Manager', 'Operations Director'][Math.floor(Math.random() * 7)],
        source: sources[Math.floor(Math.random() * sources.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        score: Math.floor(Math.random() * 100),
        notes: `Interested in ${['automation', 'scaling sales', 'lead generation', 'CRM integration', 'AI solutions'][Math.floor(Math.random() * 5)]}`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        companySize: companySizes[Math.floor(Math.random() * companySizes.length)],
        budget: ['< $10k', '$10k-$50k', '$50k-$100k', '$100k-$500k', '$500k+'][Math.floor(Math.random() * 5)],
        timeline: ['Immediate', '1-3 months', '3-6 months', '6-12 months', 'Just researching'][Math.floor(Math.random() * 5)],
        lastContactedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
        organizationId,
        customFields: {
          leadTemperature: ['Hot', 'Warm', 'Cold'][Math.floor(Math.random() * 3)],
          preferredContactMethod: ['Email', 'Phone', 'LinkedIn'][Math.floor(Math.random() * 3)],
          competitors: ['Competitor A', 'Competitor B', 'None'][Math.floor(Math.random() * 3)]
        }
      };

      leads.push(lead);
    }

    // Create all leads
    const createdLeads = await prisma.lead.createMany({
      data: leads
    });

    // Create some activities for random leads
    const leadRecords = await prisma.lead.findMany({
      where: { organizationId },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    const activities = [];
    for (const lead of leadRecords) {
      const activityCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < activityCount; j++) {
        activities.push({
          type: ['CALL', 'EMAIL', 'MEETING', 'NOTE'][Math.floor(Math.random() * 4)],
          description: [
            'Had a great conversation about their needs',
            'Sent follow-up email with pricing',
            'Scheduled demo for next week',
            'Left voicemail',
            'Discussed implementation timeline'
          ][Math.floor(Math.random() * 5)],
          leadId: lead.id,
          organizationId,
          userId: req.user.userId
        });
      }
    }

    if (activities.length > 0) {
      await prisma.leadActivity.createMany({
        data: activities
      });
    }

    res.json({
      message: `Successfully created ${count} dummy leads with activities`,
      count: createdLeads.count,
      sample: leads.slice(0, 5) // Return first 5 as sample
    });

  } catch (error) {
    next(error);
  }
});

// Clear all leads - protected route
router.delete('/leads', authenticate, async (req, res, next) => {
  try {
    // Only allow ADMIN users
    if (req.user.role !== 'ADMIN') {
      throw new AppError('Only admins can delete data', 403);
    }

    const organizationId = req.user.organizationId;

    // Delete all activities first (due to foreign key constraints)
    await prisma.leadActivity.deleteMany({
      where: { organizationId }
    });

    // Delete all leads
    const deleted = await prisma.lead.deleteMany({
      where: { organizationId }
    });

    res.json({
      message: 'All leads and activities deleted',
      deletedCount: deleted.count
    });

  } catch (error) {
    next(error);
  }
});

export default router;