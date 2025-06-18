import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as leadController from '../controllers/lead.controller.js';

const router = Router();

// Lead management routes
router.get('/', authenticate, leadController.getLeads);
router.get('/:id', authenticate, leadController.getLeadById);
router.post('/', authenticate, leadController.createLead);
router.put('/:id', authenticate, leadController.updateLead);
router.delete('/:id', authenticate, leadController.deleteLead);

// Lead qualification
router.post('/:id/qualify', authenticate, leadController.qualifyLead);
router.get('/:id/score', authenticate, leadController.getLeadScore);

// Lead activities
router.get('/:id/activities', authenticate, leadController.getLeadActivities);
router.post('/:id/activities', authenticate, leadController.addLeadActivity);

// Bulk operations
router.post('/bulk/import', authenticate, leadController.bulkImportLeads);
router.post('/bulk/assign', authenticate, leadController.bulkAssignLeads);

export default router;