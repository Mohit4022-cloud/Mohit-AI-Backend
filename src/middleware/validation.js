import Joi from 'joi';

// Validation schemas for AI calls
export const validateRequest = {
  // Call initiation validation
  initiateCall: Joi.object({
    leadId: Joi.string().required(),
    mode: Joi.string().valid('AI', 'HUMAN', 'HYBRID').default('AI'),
    settings: Joi.object({
      responseSpeed: Joi.number().min(1).max(10).default(5),
      formalityLevel: Joi.number().min(1).max(10).default(5),
      empathyLevel: Joi.number().min(1).max(10).default(5),
      technicalDetail: Joi.number().min(1).max(10).default(5),
    }).optional(),
  }),

  // Add to queue validation
  addToQueue: Joi.object({
    leadId: Joi.string().required(),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
    scheduledTime: Joi.date().optional(),
    settings: Joi.object().optional(),
  }),

  // Update AI settings validation
  updateAISettings: Joi.object({
    voiceId: Joi.string().optional(),
    modelId: Joi.string().optional(),
    language: Joi.string().optional(),
    responseSpeed: Joi.number().min(1).max(10).optional(),
    formalityLevel: Joi.number().min(1).max(10).optional(),
    empathyLevel: Joi.number().min(1).max(10).optional(),
    technicalDetail: Joi.number().min(1).max(10).optional(),
    enableRecording: Joi.boolean().optional(),
    enableTranscription: Joi.boolean().optional(),
    enableInsights: Joi.boolean().optional(),
  }),

  // Update progressive settings validation
  updateProgressiveSettings: Joi.object({
    level: Joi.string().valid('OVERVIEW', 'BASIC', 'DETAILED', 'ADVANCED').required(),
    features: Joi.object().optional(),
    preferences: Joi.object().optional(),
  }),

  // Create content card validation
  createContentCard: Joi.object({
    type: Joi.string().valid('pricing', 'competitor', 'objection', 'insight', 'talking_point').required(),
    title: Joi.string().required(),
    content: Joi.string().required(),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
    isActive: Joi.boolean().default(true),
    metadata: Joi.object().optional(),
  }),

  // Generate insight validation
  generateInsight: Joi.object({
    type: Joi.string().valid('SENTIMENT', 'TOPIC', 'COMPETITOR', 'PRICING', 'ACTION').required(),
    context: Joi.string().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
  }),

  // Update call status validation
  updateCallStatus: Joi.object({
    status: Joi.string().valid('QUEUED', 'CONNECTING', 'ACTIVE', 'COMPLETED', 'FAILED').required(),
    agentStatus: Joi.string().valid('LISTENING', 'PROCESSING', 'SPEAKING', 'IDLE').optional(),
    metadata: Joi.object().optional(),
  }),
};

// Validation middleware factory
export function createValidator(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessage,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

// Apply validation to specific routes
export function validate(schema) {
  return createValidator(schema);
}

// Query parameter validation
export const validateQuery = {
  // Call history query validation
  callHistory: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().optional(),
    mode: Joi.string().optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    sortBy: Joi.string().valid('createdAt', 'duration', 'sentiment').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Analytics query validation
  analytics: Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day'),
    metrics: Joi.array().items(Joi.string()).optional(),
  }),
};

// Query validation middleware
export function validateQueryParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorMessage,
      });
    }

    // Replace request query with validated and sanitized data
    req.query = value;
    next();
  };
}