import { logger } from '../../utils/logger.js';
import twilioService from '../twilio/twilioService.js';
import elevenLabsService from '../elevenlabs/elevenLabsService.js';
import leadQualificationService from './leadQualificationService.js';
import { createLeadActivity } from '../../models/leadActivity.model.js';
import { updateLeadStatus } from '../../models/lead.model.js';
import { publishToQueue } from '../queue/queueService.js';

class LeadResponseService {
  constructor() {
    this.responseTimeSeconds = parseInt(process.env.RESPONSE_TIME_SECONDS) || 60;
  }

  async handleInboundLead(leadData, source) {
    try {
      logger.info(`New inbound lead from ${source}:`, leadData);
      
      // Track lead arrival time
      const arrivalTime = new Date();
      
      // Create lead activity
      await createLeadActivity({
        leadId: leadData.id,
        type: 'INBOUND_RECEIVED',
        source,
        data: leadData,
        timestamp: arrivalTime
      });

      // Determine response channel priority
      const responseChannels = this.determineResponseChannels(leadData, source);
      
      // Initiate immediate response
      const responsePromises = responseChannels.map(channel => 
        this.initiateResponse(leadData, channel, arrivalTime)
      );

      // Wait for at least one successful response
      const responses = await Promise.allSettled(responsePromises);
      const successfulResponse = responses.find(r => r.status === 'fulfilled');

      if (successfulResponse) {
        await updateLeadStatus(leadData.id, 'CONTACTED');
        logger.info(`Lead ${leadData.id} contacted successfully`);
      } else {
        // Queue for retry if all immediate attempts fail
        await this.queueForRetry(leadData, source);
      }

      return {
        leadId: leadData.id,
        responseTime: new Date() - arrivalTime,
        status: successfulResponse ? 'contacted' : 'queued_for_retry'
      };
    } catch (error) {
      logger.error('Error handling inbound lead:', error);
      throw error;
    }
  }

  determineResponseChannels(leadData, source) {
    const channels = [];

    // Voice call is highest priority for inbound phone leads
    if (source === 'phone' || leadData.phone) {
      channels.push('voice');
    }

    // SMS for mobile numbers
    if (leadData.phone && this.isMobileNumber(leadData.phone)) {
      channels.push('sms');
    }

    // Email as backup
    if (leadData.email) {
      channels.push('email');
    }

    // Live chat if lead came from website
    if (source === 'website' || source === 'chat') {
      channels.unshift('chat'); // Make it first priority
    }

    return channels;
  }

  async initiateResponse(leadData, channel, arrivalTime) {
    const timeElapsed = (new Date() - arrivalTime) / 1000;
    const timeRemaining = this.responseTimeSeconds - timeElapsed;

    if (timeRemaining <= 0) {
      throw new Error('Response time exceeded');
    }

    switch (channel) {
      case 'voice':
        return this.initiateVoiceCall(leadData, timeRemaining);
      case 'sms':
        return this.sendSMS(leadData);
      case 'email':
        return this.sendEmail(leadData);
      case 'chat':
        return this.initiateLiveChat(leadData);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  async initiateVoiceCall(leadData, maxWaitTime) {
    try {
      // Get qualification context
      const context = await leadQualificationService.getQualificationContext(leadData);
      
      // Create ElevenLabs conversation
      const conversation = await elevenLabsService.createConversation(leadData, context);
      
      // Initiate Twilio call with webhook URL
      const callbackUrl = `${process.env.BASE_URL}/api/calls/twilio/voice?conversationUrl=${encodeURIComponent(conversation.url)}&leadId=${leadData.id}`;
      
      const call = await twilioService.makeCall(leadData.phone, callbackUrl, {
        timeout: Math.floor(maxWaitTime),
        machineDetection: 'DetectMessageEnd'
      });

      await createLeadActivity({
        leadId: leadData.id,
        type: 'VOICE_CALL_INITIATED',
        data: { callSid: call.sid },
        timestamp: new Date()
      });

      return { channel: 'voice', callSid: call.sid };
    } catch (error) {
      logger.error('Failed to initiate voice call:', error);
      throw error;
    }
  }

  async sendSMS(leadData) {
    try {
      const message = await this.generatePersonalizedMessage(leadData, 'sms');
      
      const sms = await twilioService.sendSMS(leadData.phone, message);
      
      await createLeadActivity({
        leadId: leadData.id,
        type: 'SMS_SENT',
        data: { messageSid: sms.sid, message },
        timestamp: new Date()
      });

      return { channel: 'sms', messageSid: sms.sid };
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async sendEmail(leadData) {
    try {
      const emailContent = await this.generatePersonalizedMessage(leadData, 'email');
      
      // Queue email for sending
      await publishToQueue('email-queue', {
        to: leadData.email,
        subject: emailContent.subject,
        body: emailContent.body,
        leadId: leadData.id
      });

      await createLeadActivity({
        leadId: leadData.id,
        type: 'EMAIL_QUEUED',
        data: emailContent,
        timestamp: new Date()
      });

      return { channel: 'email', status: 'queued' };
    } catch (error) {
      logger.error('Failed to queue email:', error);
      throw error;
    }
  }

  async initiateLiveChat(leadData) {
    try {
      // Emit socket event to notify available agents
      const chatSession = {
        leadId: leadData.id,
        leadName: leadData.name,
        timestamp: new Date()
      };

      // This will be handled by WebSocket service
      await publishToQueue('live-chat-queue', chatSession);

      await createLeadActivity({
        leadId: leadData.id,
        type: 'CHAT_INITIATED',
        data: chatSession,
        timestamp: new Date()
      });

      return { channel: 'chat', status: 'initiated' };
    } catch (error) {
      logger.error('Failed to initiate live chat:', error);
      throw error;
    }
  }

  async generatePersonalizedMessage(leadData, channel) {
    // This would integrate with AI service for personalization
    const templates = {
      sms: `Hi ${leadData.name || 'there'}, thanks for your interest! I'm from ${process.env.COMPANY_NAME}. Is now a good time for a quick call to discuss your needs?`,
      email: {
        subject: `Quick follow-up on your inquiry`,
        body: `Hi ${leadData.name || 'there'},\n\nThank you for reaching out to ${process.env.COMPANY_NAME}. I wanted to connect with you right away to understand your needs better.\n\nWould you be available for a brief call in the next 15 minutes?\n\nBest regards,\nYour ${process.env.COMPANY_NAME} Team`
      }
    };

    return templates[channel];
  }

  isMobileNumber(phone) {
    // Simple check - in production, use a proper library
    return true; // Assume all numbers can receive SMS for now
  }

  async queueForRetry(leadData, source) {
    await publishToQueue('lead-retry-queue', {
      leadData,
      source,
      attempts: 1,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
  }
}

export default new LeadResponseService();