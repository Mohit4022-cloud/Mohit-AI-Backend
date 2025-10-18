import { logger } from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { elevenLabsService } from './elevenLabsService.js';
import { aiServiceFactory } from './aiServiceFactory.js';
import { emitToCall } from '../websocket/index.js';

const prisma = new PrismaClient();

class AIVoiceService {
  /**
   * Get available voices
   */
  async getAvailableVoices() {
    try {
      const voices = await elevenLabsService.getAvailableVoices();
      return voices;
    } catch (error) {
      logger.error('Error getting available voices:', error);
      throw new Error('Failed to get available voices');
    }
  }

  /**
   * Get voice settings
   */
  async getVoiceSettings(voiceId) {
    try {
      const settings = await elevenLabsService.getVoiceSettings(voiceId);
      return settings;
    } catch (error) {
      logger.error('Error getting voice settings:', error);
      throw new Error('Failed to get voice settings');
    }
  }

  /**
   * Generate AI response and convert to speech
   */
  async generateAIResponseWithVoice(context, options = {}) {
    try {
      const { callId, transcript, lastUserMessage, aiSettings, voiceId } = context;
      const { provider, model, temperature } = options;

      // Generate text response
      const textResponse = await aiServiceFactory.generateAIResponse(
        {
          transcript,
          lastUserMessage,
          aiSettings,
          callHistory: transcript || [],
        },
        { provider, model, temperature }
      );

      // Get voice settings for the call
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: { organization: { select: { aiSettings: true } } },
      });

      const orgAISettings = call?.organization?.aiSettings || {};
      const selectedVoiceId = voiceId || orgAISettings.voiceId || 'rachel';

      // Convert text to speech
      const audioBuffer = await elevenLabsService.textToSpeech(textResponse, {
        voiceId: selectedVoiceId,
        modelId: orgAISettings.modelId,
        voiceSettings: {
          stability: orgAISettings.voiceSettings?.stability || 0.5,
          similarity_boost: orgAISettings.voiceSettings?.similarity_boost || 0.75,
          style: orgAISettings.voiceSettings?.style || 0.0,
          use_speaker_boost: orgAISettings.voiceSettings?.use_speaker_boost !== false,
        },
      });

      return {
        text: textResponse,
        audio: audioBuffer,
        voiceId: selectedVoiceId,
      };
    } catch (error) {
      logger.error('Error generating AI response with voice:', error);
      throw new Error('Failed to generate AI response with voice');
    }
  }

  /**
   * Stream AI response with voice
   */
  async streamAIResponseWithVoice(context, options = {}) {
    try {
      const { callId, transcript, lastUserMessage, aiSettings, voiceId } = context;
      const { provider, model, temperature } = options;

      // Generate text response
      const textResponse = await aiServiceFactory.generateAIResponse(
        {
          transcript,
          lastUserMessage,
          aiSettings,
          callHistory: transcript || [],
        },
        { provider, model, temperature }
      );

      // Get voice settings for the call
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: { organization: { select: { aiSettings: true } } },
      });

      const orgAISettings = call?.organization?.aiSettings || {};
      const selectedVoiceId = voiceId || orgAISettings.voiceId || 'rachel';

      // Stream text to speech
      const audioStream = await elevenLabsService.streamTextToSpeech(textResponse, {
        voiceId: selectedVoiceId,
        modelId: orgAISettings.modelId,
        voiceSettings: {
          stability: orgAISettings.voiceSettings?.stability || 0.5,
          similarity_boost: orgAISettings.voiceSettings?.similarity_boost || 0.75,
          style: orgAISettings.voiceSettings?.style || 0.0,
          use_speaker_boost: orgAISettings.voiceSettings?.use_speaker_boost !== false,
        },
      });

      return {
        text: textResponse,
        audioStream,
        voiceId: selectedVoiceId,
      };
    } catch (error) {
      logger.error('Error streaming AI response with voice:', error);
      throw new Error('Failed to stream AI response with voice');
    }
  }

  /**
   * Test voice with sample text
   */
  async testVoice(voiceId, text) {
    try {
      const result = await elevenLabsService.testVoice(voiceId, text);
      return result;
    } catch (error) {
      logger.error('Error testing voice:', error);
      throw new Error('Failed to test voice');
    }
  }

  /**
   * Create custom voice
   */
  async createCustomVoice(organizationId, voiceData) {
    try {
      // This would integrate with ElevenLabs API for custom voice creation
      // For now, return a mock response
      const customVoice = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: voiceData.name,
        description: voiceData.description,
        organizationId,
        createdAt: new Date().toISOString(),
        status: 'processing',
      };

      logger.info(`Custom voice creation initiated: ${customVoice.id}`);
      return customVoice;
    } catch (error) {
      logger.error('Error creating custom voice:', error);
      throw new Error('Failed to create custom voice');
    }
  }

  /**
   * Get voice analytics
   */
  async getVoiceAnalytics(organizationId, options = {}) {
    try {
      const { dateFrom, dateTo, voiceId } = options;
      
      const where = {
        organizationId,
        ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
        ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
      };

      // Get calls with voice usage
      const calls = await prisma.call.findMany({
        where,
        select: {
          id: true,
          aiSettings: true,
          duration: true,
          createdAt: true,
          transcriptEntries: {
            select: {
              speaker: true,
              timestamp: true,
            },
          },
        },
      });

      // Analyze voice usage
      const voiceUsage = {};
      let totalCallTime = 0;
      let totalAITalkTime = 0;

      calls.forEach(call => {
        const voiceId = call.aiSettings?.voiceId || 'default';
        
        if (!voiceUsage[voiceId]) {
          voiceUsage[voiceId] = {
            callCount: 0,
            totalDuration: 0,
            avgDuration: 0,
          };
        }

        voiceUsage[voiceId].callCount++;
        voiceUsage[voiceId].totalDuration += call.duration || 0;
        totalCallTime += call.duration || 0;

        // Calculate AI talk time (rough estimation)
        const aiEntries = call.transcriptEntries.filter(entry => entry.speaker === 'AI');
        totalAITalkTime += aiEntries.length * 3; // Assuming 3 seconds per AI entry
      });

      // Calculate averages
      Object.keys(voiceUsage).forEach(voiceId => {
        voiceUsage[voiceId].avgDuration = voiceUsage[voiceId].totalDuration / voiceUsage[voiceId].callCount;
      });

      return {
        voiceUsage,
        totalCallTime,
        totalAITalkTime,
        averageCallTime: calls.length > 0 ? totalCallTime / calls.length : 0,
      };
    } catch (error) {
      logger.error('Error getting voice analytics:', error);
      throw new Error('Failed to get voice analytics');
    }
  }

  /**
   * Update voice settings for organization
   */
  async updateOrganizationVoiceSettings(organizationId, settings) {
    try {
      const updatedSettings = await prisma.aISettings.upsert({
        where: { organizationId },
        update: {
          voiceId: settings.voiceId,
          modelId: settings.modelId,
          language: settings.language,
          voiceSettings: settings.voiceSettings,
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          voiceId: settings.voiceId,
          modelId: settings.modelId,
          language: settings.language || 'en',
          voiceSettings: settings.voiceSettings,
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

      logger.info(`Voice settings updated for organization: ${organizationId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating voice settings:', error);
      throw new Error('Failed to update voice settings');
    }
  }

  /**
   * Get voice models
   */
  async getVoiceModels() {
    try {
      const models = await elevenLabsService.getVoiceModels();
      return models;
    } catch (error) {
      logger.error('Error getting voice models:', error);
      throw new Error('Failed to get voice models');
    }
  }

  /**
   * Clone voice
   */
  async cloneVoice(organizationId, voiceData) {
    try {
      // This would integrate with ElevenLabs Voice Cloning API
      // For now, return a mock response
      const clonedVoice = {
        id: `cloned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: voiceData.name,
        description: voiceData.description,
        organizationId,
        originalVoiceId: voiceData.originalVoiceId,
        createdAt: new Date().toISOString(),
        status: 'processing',
      };

      logger.info(`Voice cloning initiated: ${clonedVoice.id}`);
      return clonedVoice;
    } catch (error) {
      logger.error('Error cloning voice:', error);
      throw new Error('Failed to clone voice');
    }
  }

  /**
   * Validate voice settings
   */
  async validateVoiceSettings(settings) {
    try {
      const availableVoices = await elevenLabsService.getAvailableVoices();
      const availableModels = await elevenLabsService.getVoiceModels();

      const errors = [];

      // Check if voice ID exists
      if (settings.voiceId && !availableVoices.some(voice => voice.id === settings.voiceId)) {
        errors.push(`Invalid voice ID: ${settings.voiceId}`);
      }

      // Check if model ID exists
      if (settings.modelId && !availableModels.some(model => model.model_id === settings.modelId)) {
        errors.push(`Invalid model ID: ${settings.modelId}`);
      }

      // Validate voice settings range
      if (settings.voiceSettings) {
        const { stability, similarity_boost, style } = settings.voiceSettings;
        
        if (stability !== undefined && (stability < 0 || stability > 1)) {
          errors.push('Stability must be between 0 and 1');
        }
        
        if (similarity_boost !== undefined && (similarity_boost < 0 || similarity_boost > 1)) {
          errors.push('Similarity boost must be between 0 and 1');
        }
        
        if (style !== undefined && (style < 0 || style > 1)) {
          errors.push('Style must be between 0 and 1');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Error validating voice settings:', error);
      throw new Error('Failed to validate voice settings');
    }
  }
}

export const aiVoiceService = new AIVoiceService();
export default aiVoiceService;