import { logger } from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if organization has AI features enabled
 */
export const checkAIFeaturesEnabled = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        enableAICalls: true,
        enableAITranscription: true,
        enableAIInsights: true,
        maxConcurrentAICalls: true,
        plan: true,
      },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    if (!organization.enableAICalls) {
      return res.status(403).json({
        success: false,
        error: 'AI features are not enabled for your organization',
      });
    }

    // Add organization AI settings to request
    req.organizationAISettings = organization;
    next();
  } catch (error) {
    logger.error('Error checking AI features enabled:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify AI features',
    });
  }
};

/**
 * Check if user has permission for specific AI feature
 */
export const checkAIFeaturePermission = (feature) => {
  return async (req, res, next) => {
    try {
      const { userId, organizationId, role } = req.user;
      
      // Get user with organization details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: {
            select: {
              enableAICalls: true,
              enableAITranscription: true,
              enableAIInsights: true,
              plan: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if organization has AI features enabled
      if (!user.organization.enableAICalls) {
        return res.status(403).json({
          success: false,
          error: 'AI features are not enabled for your organization',
        });
      }

      // Check role-based permissions
      const hasPermission = checkRolePermission(role, feature);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `You don't have permission to access ${feature}`,
        });
      }

      // Check plan-based limitations
      const planCheck = checkPlanLimitations(user.organization.plan, feature);
      if (!planCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: planCheck.message,
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking AI feature permission:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify permission',
      });
    }
  };
};

/**
 * Check role-based permissions for AI features
 */
function checkRolePermission(role, feature) {
  const permissions = {
    ADMIN: [
      'ai_calls_initiate',
      'ai_calls_view',
      'ai_calls_control',
      'ai_calls_manage',
      'ai_insights_view',
      'ai_insights_manage',
      'ai_settings_manage',
      'ai_queue_manage',
      'ai_analytics_view',
    ],
    MANAGER: [
      'ai_calls_initiate',
      'ai_calls_view',
      'ai_calls_control',
      'ai_insights_view',
      'ai_settings_view',
      'ai_queue_manage',
      'ai_analytics_view',
    ],
    SDR: [
      'ai_calls_initiate',
      'ai_calls_view',
      'ai_calls_control',
      'ai_insights_view',
      'ai_settings_view',
    ],
    VIEWER: [
      'ai_calls_view',
      'ai_insights_view',
      'ai_analytics_view',
    ],
  };

  return permissions[role]?.includes(feature) || false;
}

/**
 * Check plan-based limitations for AI features
 */
function checkPlanLimitations(plan, feature) {
  const limitations = {
    STARTER: {
      allowed: ['ai_calls_view', 'ai_insights_view'],
      message: 'AI calling features require a Professional or Enterprise plan',
    },
    PROFESSIONAL: {
      allowed: [
        'ai_calls_initiate',
        'ai_calls_view',
        'ai_calls_control',
        'ai_insights_view',
        'ai_settings_view',
        'ai_queue_manage',
        'ai_analytics_view',
      ],
      message: null,
    },
    ENTERPRISE: {
      allowed: [
        'ai_calls_initiate',
        'ai_calls_view',
        'ai_calls_control',
        'ai_calls_manage',
        'ai_insights_view',
        'ai_insights_manage',
        'ai_settings_view',
        'ai_settings_manage',
        'ai_queue_manage',
        'ai_analytics_view',
      ],
      message: null,
    },
  };

  const planLimitations = limitations[plan] || limitations.STARTER;
  
  if (!planLimitations.allowed.includes(feature)) {
    return {
      allowed: false,
      message: planLimitations.message || 'This feature is not available on your current plan',
    };
  }

  return { allowed: true };
}

/**
 * Check concurrent AI calls limit
 */
export const checkConcurrentCallsLimit = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    
    // Get current active AI calls
    const activeCalls = await prisma.call.count({
      where: {
        organizationId,
        status: {
          in: ['QUEUED', 'RINGING', 'IN_PROGRESS', 'ACTIVE'],
        },
        mode: {
          in: ['AI', 'HYBRID'],
        },
      },
    });

    // Get organization limits
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxConcurrentAICalls: true },
    });

    const maxConcurrent = organization?.maxConcurrentAICalls || 3;
    
    if (activeCalls >= maxConcurrent) {
      return res.status(429).json({
        success: false,
        error: `Maximum concurrent AI calls limit reached (${maxConcurrent})`,
        activeCalls,
        maxConcurrent,
      });
    }

    // Add call limits to request
    req.callLimits = {
      activeCalls,
      maxConcurrent,
      remaining: maxConcurrent - activeCalls,
    };

    next();
  } catch (error) {
    logger.error('Error checking concurrent calls limit:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check call limits',
    });
  }
};

/**
 * Check if user can access specific call
 */
export const checkCallAccess = async (req, res, next) => {
  try {
    const { userId, organizationId, role } = req.user;
    const { callId } = req.params;
    
    // Get call details
    const call = await prisma.call.findFirst({
      where: {
        id: callId,
        organizationId,
      },
      include: {
        lead: true,
        user: true,
      },
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found',
      });
    }

    // Check if user has access to this call
    let hasAccess = false;
    
    // Admins and Managers can access all calls
    if (['ADMIN', 'MANAGER'].includes(role)) {
      hasAccess = true;
    }
    // SDRs can access their own calls
    else if (role === 'SDR' && call.assignedToId === userId) {
      hasAccess = true;
    }
    // Viewers can only view calls (controlled by endpoint)
    else if (role === 'VIEWER' && req.method === 'GET') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this call',
      });
    }

    // Add call to request
    req.call = call;
    next();
  } catch (error) {
    logger.error('Error checking call access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify call access',
    });
  }
};

/**
 * Check if user can manage AI settings
 */
export const checkAISettingsAccess = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    // Only Admins and Managers can manage AI settings
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to manage AI settings',
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking AI settings access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify settings access',
    });
  }
};

/**
 * Check if user can access advanced AI features
 */
export const checkAdvancedAIAccess = async (req, res, next) => {
  try {
    const { userId, organizationId, role } = req.user;
    
    // Get user with progressive settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            progressiveSettings: {
              select: { level: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const currentLevel = user.organization.progressiveSettings?.level || 'OVERVIEW';
    
    // Only Admins and users with ADVANCED level can access advanced features
    if (role !== 'ADMIN' && currentLevel !== 'ADVANCED') {
      return res.status(403).json({
        success: false,
        error: 'Advanced AI features require ADMIN role or ADVANCED access level',
      });
    }

    // Add current level to request
    req.currentAccessLevel = currentLevel;
    next();
  } catch (error) {
    logger.error('Error checking advanced AI access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify advanced access',
    });
  }
};

/**
 * Rate limiting for AI features
 */
export const aiRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const { userId, organizationId } = req.user;
    const key = `${organizationId}:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this user
    let userRequests = requests.get(key) || [];
    
    // Filter out old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many AI requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [k, v] of requests.entries()) {
        if (v.every(timestamp => timestamp <= windowStart)) {
          requests.delete(k);
        }
      }
    }

    next();
  };
};