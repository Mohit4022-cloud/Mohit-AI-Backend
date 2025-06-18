import { Router } from 'express';
import { logger } from '../utils/logger.js';
import twilioService from '../services/twilio/twilioService.js';
import leadResponseService from '../services/lead/leadResponseService.js';

const router = Router();

// Twilio webhooks
router.post('/twilio/voice', async (req, res) => {
  try {
    // Validate webhook signature
    if (!twilioService.validateWebhookSignature(req)) {
      logger.warn('Invalid Twilio webhook signature');
      return res.status(403).send('Forbidden');
    }

    const { CallSid, From, To, CallStatus } = req.body;
    logger.info(`Twilio voice webhook: ${CallStatus} for ${CallSid}`);

    // Handle different call statuses
    // TODO: Implement voice response logic

    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Thank you for calling. An agent will be with you shortly.</Say>
        <Pause length="1"/>
        <Dial>
          <Conference>lead-${CallSid}</Conference>
        </Dial>
      </Response>`);
  } catch (error) {
    logger.error('Error handling Twilio voice webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/twilio/sms', async (req, res) => {
  try {
    if (!twilioService.validateWebhookSignature(req)) {
      return res.status(403).send('Forbidden');
    }

    const { MessageSid, From, To, Body } = req.body;
    logger.info(`SMS received from ${From}: ${Body}`);

    // Process inbound SMS as a lead
    await leadResponseService.handleInboundLead({
      phone: From,
      message: Body,
      source: 'SMS'
    }, 'SMS');

    res.status(200).send();
  } catch (error) {
    logger.error('Error handling SMS webhook:', error);
    res.status(500).send();
  }
});

// CRM webhooks
router.post('/hubspot', async (req, res) => {
  try {
    const { eventType, objectId, propertyName, propertyValue } = req.body;
    
    logger.info('HubSpot webhook received:', { eventType, objectId });
    
    // TODO: Handle HubSpot events
    
    res.status(200).send();
  } catch (error) {
    logger.error('Error handling HubSpot webhook:', error);
    res.status(500).send();
  }
});

router.post('/salesforce', async (req, res) => {
  try {
    // TODO: Implement Salesforce webhook handling
    logger.info('Salesforce webhook received');
    res.status(200).send();
  } catch (error) {
    logger.error('Error handling Salesforce webhook:', error);
    res.status(500).send();
  }
});

// Form submission webhook (for website forms)
router.post('/form-submission', async (req, res) => {
  try {
    const leadData = req.body;
    
    logger.info('Form submission received:', leadData);
    
    // Process as inbound lead
    const result = await leadResponseService.handleInboundLead(leadData, 'FORM');
    
    res.json({
      success: true,
      message: 'Thank you! We will contact you shortly.',
      leadId: result.leadId
    });
  } catch (error) {
    logger.error('Error handling form submission:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
});

export default router;