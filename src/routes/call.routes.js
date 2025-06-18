import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as callController from '../controllers/call.controller.js';

const router = Router();

// Call management
router.get('/', authenticate, callController.getCalls);
router.get('/:id', authenticate, callController.getCallById);
router.post('/initiate', authenticate, callController.initiateCall);
router.post('/:id/end', authenticate, callController.endCall);
router.get('/:id/transcript', authenticate, callController.getCallTranscript);
router.get('/:id/recording', authenticate, callController.getCallRecording);

// Twilio webhooks (no auth required)
router.post('/twilio/voice', callController.handleTwilioVoice);
router.post('/twilio/status', callController.handleTwilioStatus);
router.post('/twilio/recording', callController.handleTwilioRecording);
router.post('/twilio/transcription', callController.handleTwilioTranscription);

// WebSocket relay endpoint is handled separately in server.js

export default router;