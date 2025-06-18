import { Router } from 'express';
import authRoutes from './auth.routes.js';
import leadRoutes from './lead.routes.js';
import callRoutes from './call.routes.js';
import webhookRoutes from './webhook.routes.js';
import integrationRoutes from './integration.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

// API version and status
router.get('/', (req, res) => {
  res.json({
    name: 'Mohit AI Inbound SDR API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/calls', callRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/integrations', integrationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;