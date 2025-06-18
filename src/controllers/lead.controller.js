import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import leadResponseService from '../services/lead/leadResponseService.js';
import leadQualificationService from '../services/lead/leadQualificationService.js';
import { parseCSV } from '../utils/csvParser.js';

const prisma = new PrismaClient();

export const getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, assignedTo, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      organizationId: req.user.organizationId,
      ...(status && { status }),
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          activities: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        assignedTo: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } }
        },
        calls: {
          orderBy: { createdAt: 'desc' }
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const leadData = {
      ...req.body,
      organizationId: req.user.organizationId,
      status: 'NEW'
    };

    const lead = await prisma.lead.create({
      data: leadData,
      include: { assignedTo: true }
    });

    // Create initial activity
    await prisma.activity.create({
      data: {
        type: 'INBOUND_RECEIVED',
        leadId: lead.id,
        userId: req.user.id,
        description: `Lead created from ${lead.source}`,
        data: { source: lead.source }
      }
    });

    // Trigger immediate response
    if (process.env.ENABLE_AUTO_RESPONSE === 'true') {
      leadResponseService.handleInboundLead(lead, lead.source)
        .catch(error => logger.error('Failed to auto-respond to lead:', error));
    }

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await prisma.lead.update({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      data: req.body,
      include: { assignedTo: true }
    });

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    await prisma.lead.delete({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const qualifyLead = async (req, res, next) => {
  try {
    const { responses } = req.body;
    
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Score the qualification
    const qualificationResult = await leadQualificationService.scoreQualification(
      lead.id,
      responses
    );

    // Update lead with qualification data
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        score: qualificationResult.score,
        qualificationData: qualificationResult,
        status: qualificationResult.recommendation === 'NOT_QUALIFIED' ? 'UNQUALIFIED' : 'QUALIFIED',
        qualifiedAt: new Date()
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'QUALIFICATION_COMPLETED',
        leadId: lead.id,
        userId: req.user.id,
        description: `Lead qualified with score ${qualificationResult.score}`,
        data: qualificationResult
      }
    });

    res.json({
      lead: updatedLead,
      qualification: qualificationResult
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadScore = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      select: {
        score: true,
        qualificationData: true
      }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    res.json({
      score: lead.score,
      qualificationData: lead.qualificationData
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const activities = await prisma.activity.findMany({
      where: {
        leadId: req.params.id,
        lead: { organizationId: req.user.organizationId }
      },
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const addLeadActivity = async (req, res, next) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        ...req.body,
        leadId: req.params.id,
        userId: req.user.id
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

export const bulkImportLeads = async (req, res, next) => {
  try {
    const { csv } = req.body;
    
    const leads = await parseCSV(csv);
    
    const createdLeads = await prisma.lead.createMany({
      data: leads.map(lead => ({
        ...lead,
        organizationId: req.user.organizationId,
        source: 'CSV_IMPORT',
        status: 'NEW'
      }))
    });

    // Trigger response for each lead if auto-response is enabled
    if (process.env.ENABLE_AUTO_RESPONSE === 'true') {
      leads.forEach(lead => {
        leadResponseService.handleInboundLead(lead, 'CSV_IMPORT')
          .catch(error => logger.error('Failed to auto-respond to imported lead:', error));
      });
    }

    res.json({
      imported: createdLeads.count,
      message: `Successfully imported ${createdLeads.count} leads`
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAssignLeads = async (req, res, next) => {
  try {
    const { leadIds, assignToId } = req.body;

    const updated = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        organizationId: req.user.organizationId
      },
      data: {
        assignedToId: assignToId
      }
    });

    res.json({
      updated: updated.count,
      message: `Successfully assigned ${updated.count} leads`
    });
  } catch (error) {
    next(error);
  }
};