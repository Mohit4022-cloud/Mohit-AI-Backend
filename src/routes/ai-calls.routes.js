import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  checkAIFeaturesEnabled,
  checkAIFeaturePermission,
  checkConcurrentCallsLimit,
  checkCallAccess,
  checkAISettingsAccess,
  checkAdvancedAIAccess,
  aiRateLimit
} from '../middleware/aiAuth.js';
import { aiCallsController } from '../controllers/ai-calls.controller.js';
import { aiCallQueueController } from '../controllers/ai-call-queue.controller.js';
import { aiInsightsController } from '../controllers/ai-insights.controller.js';
import { aiTranscriptionController } from '../controllers/ai-transcription.controller.js';
import { aiAnalyticsController } from '../controllers/ai-analytics.controller.js';

const router = Router();

// Apply authentication and AI features check to all AI calls routes
router.use(authenticate);
router.use(checkAIFeaturesEnabled);

// AI Call Management Routes
router.get('/active',
  checkAIFeaturePermission('ai_calls_view'),
  aiCallsController.getActiveCalls
);

router.get('/history',
  checkAIFeaturePermission('ai_calls_view'),
  aiCallsController.getCallHistory
);

router.post('/initiate',
  checkAIFeaturePermission('ai_calls_initiate'),
  checkConcurrentCallsLimit,
  aiRateLimit(10, 60000), // 10 calls per minute
  validateRequest.initiateCall,
  aiCallsController.initiateCall
);

router.get('/:callId',
  checkCallAccess,
  aiCallsController.getCallById
);

router.put('/:callId/status',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_control'),
  aiCallsController.updateCallStatus
);

router.post('/:callId/takeover',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_control'),
  aiCallsController.takeOverCall
);

router.post('/:callId/pause-ai',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_control'),
  aiCallsController.pauseAI
);

router.post('/:callId/resume-ai',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_control'),
  aiCallsController.resumeAI
);

router.post('/:callId/end',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_control'),
  aiCallsController.endCall
);

router.get('/:callId/transcript',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_view'),
  aiTranscriptionController.getTranscript
);

router.post('/:callId/transcript',
  checkCallAccess,
  checkAIFeaturePermission('ai_calls_view'),
  aiRateLimit(50, 60000), // 50 transcript entries per minute
  aiTranscriptionController.addTranscriptEntry
);

router.get('/:callId/insights',
  checkCallAccess,
  checkAIFeaturePermission('ai_insights_view'),
  aiInsightsController.getCallInsights
);

router.post('/:callId/insights',
  checkCallAccess,
  checkAIFeaturePermission('ai_insights_view'),
  aiRateLimit(20, 60000), // 20 insights per minute
  aiInsightsController.generateInsight
);

// AI Call Queue Management Routes
router.get('/queue',
  checkAIFeaturePermission('ai_queue_manage'),
  aiCallQueueController.getQueue
);

router.post('/queue',
  checkAIFeaturePermission('ai_queue_manage'),
  validateRequest.addToQueue,
  aiCallQueueController.addToQueue
);

router.put('/queue/:callId/priority',
  checkAIFeaturePermission('ai_queue_manage'),
  aiCallQueueController.updatePriority
);

router.delete('/queue/:callId',
  checkAIFeaturePermission('ai_queue_manage'),
  aiCallQueueController.removeFromQueue
);

router.post('/queue/process',
  checkAIFeaturePermission('ai_queue_manage'),
  aiCallQueueController.processQueue
);

// AI Analytics Routes
router.get('/analytics/dashboard',
  checkAIFeaturePermission('ai_analytics_view'),
  aiAnalyticsController.getDashboardMetrics
);

router.get('/analytics/performance',
  checkAIFeaturePermission('ai_analytics_view'),
  aiAnalyticsController.getPerformanceMetrics
);

router.get('/analytics/sentiment',
  checkAIFeaturePermission('ai_analytics_view'),
  aiAnalyticsController.getSentimentAnalysis
);

router.get('/analytics/conversion',
  checkAIFeaturePermission('ai_analytics_view'),
  aiAnalyticsController.getConversionMetrics
);

router.get('/analytics/realtime',
  checkAIFeaturePermission('ai_analytics_view'),
  aiAnalyticsController.getRealTimeMetrics
);

// AI Settings Routes
router.get('/settings',
  checkAIFeaturePermission('ai_settings_view'),
  aiCallsController.getAISettings
);

router.put('/settings',
  checkAISettingsAccess,
  checkAdvancedAIAccess,
  validateRequest.updateAISettings,
  aiCallsController.updateAISettings
);

router.get('/settings/voices',
  checkAIFeaturePermission('ai_settings_view'),
  aiCallsController.getAvailableVoices
);

router.post('/settings/test-voice',
  checkAIFeaturePermission('ai_settings_view'),
  aiRateLimit(5, 60000), // 5 voice tests per minute
  aiCallsController.testVoice
);

// AI Content Cards Routes
router.get('/content-cards',
  checkAIFeaturePermission('ai_insights_view'),
  aiCallsController.getContentCards
);

router.post('/content-cards',
  checkAIFeaturePermission('ai_insights_manage'),
  checkAdvancedAIAccess,
  validateRequest.createContentCard,
  aiCallsController.createContentCard
);

router.put('/content-cards/:cardId',
  checkAIFeaturePermission('ai_insights_manage'),
  checkAdvancedAIAccess,
  aiCallsController.updateContentCard
);

router.delete('/content-cards/:cardId',
  checkAIFeaturePermission('ai_insights_manage'),
  checkAdvancedAIAccess,
  aiCallsController.deleteContentCard
);

// AI Progressive Settings Routes
router.get('/progressive-settings',
  checkAIFeaturePermission('ai_settings_view'),
  aiCallsController.getProgressiveSettings
);

router.put('/progressive-settings',
  checkAIFeaturePermission('ai_settings_view'),
  validateRequest.updateProgressiveSettings,
  aiCallsController.updateProgressiveSettings
);

export default router;