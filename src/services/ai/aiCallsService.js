import { logger } from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { aiServiceFactory } from './aiServiceFactory.js';
import { elevenLabsService } from './elevenLabsService.js';
import { emitToOrganization, emitToAICalls, emitToCall } from '../websocket/index.js';

const prisma = new PrismaClient();

class AICallsService {
  /**
   * Get active AI calls
   */
  async getActiveCalls(organizationId) {
    try {
      const calls = await prisma.call.findMany({
        where: {
          organizationId,
          status: {
            in: ['QUEUED', 'RINGING', 'IN_PROGRESS', 'ACTIVE'],
          },
          mode: {
            in: ['AI', 'HYBRID'],
          },
        },
        include: {
          lead: true,
          user: true,
          transcriptEntries: {
            orderBy: { timestamp: 'asc' },
            take: 10, // Get recent entries
          },
          aiInsights: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return calls.map(call => ({
        ...call,
        duration: call.startedAt ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000) : 0,
      }));
    } catch (error) {
      logger.error('Error getting active AI calls:', error);
      throw new Error('Failed to get active AI calls');
    }
  }

  /**
   * Get call history
   */
  async getCallHistory(organizationId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        mode,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where = {
        organizationId,
        ...(status && { status }),
        ...(mode && { mode }),
        ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
        ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
      };

      const [calls, total] = await Promise.all([
        prisma.call.findMany({
          where,
          include: {
            lead: true,
            user: true,
            transcriptEntries: {
              orderBy: { timestamp: 'asc' },
              take: 1,
            },
            aiInsights: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.call.count({ where }),
      ]);

      return {
        calls,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting call history:', error);
      throw new Error('Failed to get call history');
    }
  }

  /**
   * Initiate AI call
   */
  async initiateCall({ leadId, organizationId, userId, mode = 'AI', settings }) {
    try {
      // Get lead details
      const lead = await prisma.lead.findUnique({
        where: { id: leadId, organizationId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Get organization AI settings
      const aiSettings = await this.getAISettings(organizationId);

      // Create call record
      const call = await prisma.call.create({
        data: {
          leadId,
          organizationId,
          userId,
          mode,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: lead.phone,
          direction: 'OUTBOUND',
          status: 'QUEUED',
          agentStatus: 'IDLE',
          isAiEnabled: true,
          isTranscribing: aiSettings.enableTranscription,
          isRecording: aiSettings.enableRecording,
          transcriptMode: 'SIDEBAR',
          queuePriority: 'MEDIUM',
          aiSettings: settings || aiSettings,
          startedAt: new Date(),
        },
        include: {
          lead: true,
          user: true,
        },
      });

      // Create AI call metrics record
      await prisma.aICallMetrics.create({
        data: {
          callId: call.id,
        },
      });

      // Emit WebSocket event
      emitToAICalls(organizationId, 'call:created', call);
      emitToCall(call.id, 'call:created', call);

      logger.info(`AI call initiated: ${call.id} for lead: ${leadId}`);
      return call;
    } catch (error) {
      logger.error('Error initiating AI call:', error);
      throw new Error('Failed to initiate AI call');
    }
  }

  /**
   * Get call by ID
   */
  async getCallById(callId, organizationId) {
    try {
      const call = await prisma.call.findFirst({
        where: {
          id: callId,
          organizationId,
        },
        include: {
          lead: true,
          user: true,
          transcriptEntries: {
            orderBy: { timestamp: 'asc' },
          },
          aiInsights: {
            orderBy: { createdAt: 'desc' },
          },
          contentCards: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
          aiCallMetrics: true,
        },
      });

      if (!call) {
        throw new Error('Call not found');
      }

      // Calculate duration
      if (call.startedAt) {
        const endTime = call.endedAt ? new Date(call.endedAt) : new Date();
        call.duration = Math.floor((endTime - new Date(call.startedAt)) / 1000);
      }

      return call;
    } catch (error) {
      logger.error('Error getting call by ID:', error);
      throw new Error('Failed to get call');
    }
  }

  /**
   * Update call status
   */
  async updateCallStatus(callId, organizationId, { status, agentStatus, metadata }) {
    try {
      const updateData = {
        ...(status && { status }),
        ...(agentStatus && { agentStatus }),
        ...(metadata && { metadata }),
        updatedAt: new Date(),
      };

      // Add timestamps based on status
      if (status === 'RINGING') {
        updateData.startedAt = new Date();
      } else if (status === 'IN_PROGRESS' || status === 'ACTIVE') {
        updateData.answeredAt = new Date();
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        updateData.endedAt = new Date();
      }

      const call = await prisma.call.update({
        where: {
          id: callId,
          organizationId,
        },
        data: updateData,
        include: {
          lead: true,
          user: true,
        },
      });

      // Emit WebSocket events
      emitToCall(callId, 'call:status_updated', call);
      emitToAICalls(organizationId, 'call:status_updated', call);

      logger.info(`Call status updated: ${callId} -> ${status}`);
      return call;
    } catch (error) {
      logger.error('Error updating call status:', error);
      throw new Error('Failed to update call status');
    }
  }

  /**
   * Take over call (human intervention)
   */
  async takeOverCall(callId, organizationId, userId) {
    try {
      const call = await prisma.call.update({
        where: {
          id: callId,
          organizationId,
        },
        data: {
          mode: 'HUMAN',
          userId,
          updatedAt: new Date(),
        },
        include: {
          lead: true,
          user: true,
        },
      });

      // Emit WebSocket events
      emitToCall(callId, 'call:taken_over', { call, takenBy: userId });
      emitToAICalls(organizationId, 'call:taken_over', { call, takenBy: userId });

      logger.info(`Call taken over by human: ${callId} by user: ${userId}`);
      return call;
    } catch (error) {
      logger.error('Error taking over call:', error);
      throw new Error('Failed to take over call');
    }
  }

  /**
   * Pause AI
   */
  async pauseAI(callId, organizationId) {
    try {
      const call = await prisma.call.update({
        where: {
          id: callId,
          organizationId,
        },
        data: {
          mode: 'HYBRID',
          agentStatus: 'IDLE',
          updatedAt: new Date(),
        },
        include: {
          lead: true,
          user: true,
        },
      });

      // Emit WebSocket events
      emitToCall(callId, 'call:ai_paused', call);
      emitToAICalls(organizationId, 'call:ai_paused', call);

      logger.info(`AI paused for call: ${callId}`);
      return call;
    } catch (error) {
      logger.error('Error pausing AI:', error);
      throw new Error('Failed to pause AI');
    }
  }

  /**
   * Resume AI
   */
  async resumeAI(callId, organizationId) {
    try {
      const call = await prisma.call.update({
        where: {
          id: callId,
          organizationId,
        },
        data: {
          mode: 'AI',
          updatedAt: new Date(),
        },
        include: {
          lead: true,
          user: true,
        },
      });

      // Emit WebSocket events
      emitToCall(callId, 'call:ai_resumed', call);
      emitToAICalls(organizationId, 'call:ai_resumed', call);

      logger.info(`AI resumed for call: ${callId}`);
      return call;
    } catch (error) {
      logger.error('Error resuming AI:', error);
      throw new Error('Failed to resume AI');
    }
  }

  /**
   * End call
   */
  async endCall(callId, organizationId) {
    try {
      const call = await prisma.call.update({
        where: {
          id: callId,
          organizationId,
        },
        data: {
          status: 'COMPLETED',
          agentStatus: 'IDLE',
          endedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          lead: true,
          user: true,
          transcriptEntries: {
            orderBy: { timestamp: 'asc' },
          },
          aiInsights: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Generate call summary if AI was used
      if (call.mode === 'AI' || call.mode === 'HYBRID') {
        try {
          const transcript = call.transcriptEntries
            .map(entry => `${entry.speaker}: ${entry.text}`)
            .join('\n');

          if (transcript) {
            const summary = await aiServiceFactory.generateCallSummary(transcript);
            await prisma.call.update({
              where: { id: callId },
              data: { summary },
            });
          }
        } catch (error) {
          logger.error('Error generating call summary:', error);
          // Don't throw - summary generation is optional
        }
      }

      // Emit WebSocket events
      emitToCall(callId, 'call:ended', call);
      emitToAICalls(organizationId, 'call:ended', call);

      logger.info(`Call ended: ${callId}`);
      return call;
    } catch (error) {
      logger.error('Error ending call:', error);
      throw new Error('Failed to end call');
    }
  }

  /**
   * Get AI settings
   */
  async getAISettings(organizationId) {
    try {
      let settings = await prisma.aISettings.findUnique({
        where: { organizationId },
      });

      // Create default settings if not found
      if (!settings) {
        settings = await prisma.aISettings.create({
          data: {
            organizationId,
            voiceId: process.env.ELEVENLABS_VOICE_ID || 'rachel',
            modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
            language: 'en',
            responseSpeed: 5,
            formalityLevel: 5,
            empathyLevel: 5,
            technicalDetail: 5,
            enableRecording: true,
            enableTranscription: true,
            enableInsights: true,
            enableRealTimeAnalysis: true,
            recordAnnouncement: true,
            aiDisclosure: true,
          },
        });
      }

      return settings;
    } catch (error) {
      logger.error('Error getting AI settings:', error);
      throw new Error('Failed to get AI settings');
    }
  }

  /**
   * Update AI settings
   */
  async updateAISettings(organizationId, settings) {
    try {
      const updatedSettings = await prisma.aISettings.upsert({
        where: { organizationId },
        update: {
          ...settings,
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          ...settings,
        },
      });

      // Emit WebSocket event
      emitToAICalls(organizationId, 'ai_settings_updated', updatedSettings);

      logger.info(`AI settings updated for organization: ${organizationId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating AI settings:', error);
      throw new Error('Failed to update AI settings');
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices() {
    try {
      return await elevenLabsService.getAvailableVoices();
    } catch (error) {
      logger.error('Error getting available voices:', error);
      throw new Error('Failed to get available voices');
    }
  }

  /**
   * Test voice
   */
  async testVoice(voiceId, text) {
    try {
      return await elevenLabsService.testVoice(voiceId, text);
    } catch (error) {
      logger.error('Error testing voice:', error);
      throw new Error('Failed to test voice');
    }
  }
}

export const aiCallsService = new AICallsService();
export default aiCallsService;