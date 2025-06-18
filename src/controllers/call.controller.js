import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import twilioService from '../services/twilio/twilioService.js';
import elevenLabsService from '../services/elevenlabs/elevenLabsService.js';

const prisma = new PrismaClient();

export const getCalls = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, leadId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      lead: { organizationId: req.user.organizationId },
      ...(status && { status }),
      ...(leadId && { leadId })
    };

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, company: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.call.count({ where })
    ]);

    res.json({
      calls,
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

export const getCallById = async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: {
        id: req.params.id,
        lead: { organizationId: req.user.organizationId }
      },
      include: {
        lead: true,
        user: true
      }
    });

    if (!call) {
      throw new AppError('Call not found', 404);
    }

    res.json(call);
  } catch (error) {
    next(error);
  }
};

export const initiateCall = async (req, res, next) => {
  try {
    const { leadId, phoneNumber } = req.body;

    // Get lead information
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: req.user.organizationId
      }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const to = phoneNumber || lead.phone;
    if (!to) {
      throw new AppError('No phone number available', 400);
    }

    // Create call record
    const callRecord = await prisma.call.create({
      data: {
        twilioCallSid: `temp-${Date.now()}`, // Will be updated with actual SID
        direction: 'OUTBOUND',
        status: 'QUEUED',
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
        leadId: lead.id,
        userId: req.user.id
      }
    });

    // Initiate Twilio call
    const twilioCall = await twilioService.makeCall(
      to,
      `${process.env.BASE_URL}/api/webhooks/twilio/voice`
    );

    // Update call record with Twilio SID
    await prisma.call.update({
      where: { id: callRecord.id },
      data: {
        twilioCallSid: twilioCall.sid,
        status: 'RINGING',
        startedAt: new Date()
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'CALL_INITIATED',
        leadId: lead.id,
        userId: req.user.id,
        description: `Outbound call initiated to ${to}`,
        data: { callSid: twilioCall.sid }
      }
    });

    res.json({
      id: callRecord.id,
      twilioCallSid: twilioCall.sid,
      status: 'RINGING',
      to
    });
  } catch (error) {
    next(error);
  }
};

export const endCall = async (req, res, next) => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findFirst({
      where: {
        id,
        lead: { organizationId: req.user.organizationId }
      }
    });

    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // End call in Twilio
    if (call.twilioCallSid) {
      await twilioService.client.calls(call.twilioCallSid)
        .update({ status: 'completed' });
    }

    // Update call record
    const updatedCall = await prisma.call.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        duration: call.startedAt ? 
          Math.floor((new Date() - call.startedAt) / 1000) : 0
      }
    });

    res.json(updatedCall);
  } catch (error) {
    next(error);
  }
};

export const getCallTranscript = async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: {
        id: req.params.id,
        lead: { organizationId: req.user.organizationId }
      }
    });

    if (!call) {
      throw new AppError('Call not found', 404);
    }

    res.json({
      callId: call.id,
      transcript: call.transcription || 'Transcript not available',
      summary: call.summary,
      sentiment: call.sentiment
    });
  } catch (error) {
    next(error);
  }
};

export const getCallRecording = async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: {
        id: req.params.id,
        lead: { organizationId: req.user.organizationId }
      }
    });

    if (!call || !call.recordingUrl) {
      throw new AppError('Recording not found', 404);
    }

    res.json({
      callId: call.id,
      recordingUrl: call.recordingUrl,
      duration: call.duration
    });
  } catch (error) {
    next(error);
  }
};

// Twilio webhook handlers
export const handleTwilioVoice = async (req, res) => {
  try {
    const { conversationUrl, leadId } = req.query;
    
    logger.info('Handling Twilio voice webhook');

    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Connecting you to an AI assistant.</Say>
        <Connect>
          <Stream url="wss://${req.get('host')}/api/calls/relay/${leadId}" />
        </Connect>
      </Response>`);
  } catch (error) {
    logger.error('Error in Twilio voice webhook:', error);
    res.status(500).send();
  }
};

export const handleTwilioStatus = async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    
    logger.info(`Call status update: ${CallSid} - ${CallStatus}`);

    // Update call record
    await prisma.call.updateMany({
      where: { twilioCallSid: CallSid },
      data: {
        status: mapTwilioStatus(CallStatus),
        ...(CallDuration && { duration: parseInt(CallDuration) })
      }
    });

    res.status(200).send();
  } catch (error) {
    logger.error('Error handling call status:', error);
    res.status(500).send();
  }
};

export const handleTwilioRecording = async (req, res) => {
  try {
    const { CallSid, RecordingSid, RecordingUrl } = req.body;
    
    logger.info(`Recording available for call ${CallSid}`);

    await prisma.call.updateMany({
      where: { twilioCallSid: CallSid },
      data: { recordingUrl: RecordingUrl }
    });

    res.status(200).send();
  } catch (error) {
    logger.error('Error handling recording webhook:', error);
    res.status(500).send();
  }
};

export const handleTwilioTranscription = async (req, res) => {
  try {
    const { CallSid, TranscriptionText } = req.body;
    
    logger.info(`Transcription available for call ${CallSid}`);

    await prisma.call.updateMany({
      where: { twilioCallSid: CallSid },
      data: { transcription: TranscriptionText }
    });

    res.status(200).send();
  } catch (error) {
    logger.error('Error handling transcription webhook:', error);
    res.status(500).send();
  }
};

export const handleVoiceRelay = async (ws, req) => {
  const { callId } = req.params;
  
  logger.info(`WebSocket relay established for call ${callId}`);

  try {
    // Get ElevenLabs conversation URL
    const lead = await prisma.lead.findFirst({
      where: { id: callId }
    });

    if (!lead) {
      ws.close(1008, 'Lead not found');
      return;
    }

    const conversation = await elevenLabsService.createConversation(lead, {
      qualificationCriteria: ['Budget', 'Authority', 'Need', 'Timeline'],
      businessContext: { industry: lead.company },
      conversationGoal: 'Qualify lead and schedule follow-up'
    });

    // Create relay between Twilio and ElevenLabs
    const relay = elevenLabsService.createWebSocketRelay(ws, conversation.url);

    ws.on('close', () => {
      logger.info(`WebSocket relay closed for call ${callId}`);
      relay.elevenLabsWs.close();
    });

  } catch (error) {
    logger.error('Error in voice relay:', error);
    ws.close(1011, 'Server error');
  }
};

// Helper functions
function mapTwilioStatus(twilioStatus) {
  const statusMap = {
    'queued': 'QUEUED',
    'ringing': 'RINGING',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'busy': 'BUSY',
    'no-answer': 'NO_ANSWER',
    'failed': 'FAILED',
    'canceled': 'CANCELED'
  };
  
  return statusMap[twilioStatus] || 'FAILED';
}

export default {
  getCalls,
  getCallById,
  initiateCall,
  endCall,
  getCallTranscript,
  getCallRecording,
  handleTwilioVoice,
  handleTwilioStatus,
  handleTwilioRecording,
  handleTwilioTranscription,
  handleVoiceRelay
};