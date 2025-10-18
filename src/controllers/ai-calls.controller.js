import { logger } from '../utils/logger.js';
import { aiCallsService } from '../services/ai/aiCallsService.js';
import { aiVoiceService } from '../services/ai/aiVoiceService.js';
import { contentCardsService } from '../services/ai/contentCardsService.js';
import { progressiveSettingsService } from '../services/ai/progressiveSettingsService.js';

export const aiCallsController = {
  // Get active AI calls
  async getActiveCalls(req, res) {
    try {
      const { organizationId } = req.user;
      const calls = await aiCallsService.getActiveCalls(organizationId);
      
      res.json({
        success: true,
        data: calls,
      });
    } catch (error) {
      logger.error('Error getting active calls:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active calls',
        details: error.message,
      });
    }
  },

  // Get call history
  async getCallHistory(req, res) {
    try {
      const { organizationId } = req.user;
      const { page = 1, limit = 20, status, mode, dateFrom, dateTo, sortBy, sortOrder } = req.query;
      
      const calls = await aiCallsService.getCallHistory(organizationId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        mode,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      });
      
      res.json({
        success: true,
        data: calls,
      });
    } catch (error) {
      logger.error('Error getting call history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get call history',
        details: error.message,
      });
    }
  },

  // Initiate new AI call
  async initiateCall(req, res) {
    try {
      const { organizationId, userId } = req.user;
      const { leadId, mode = 'AI', settings } = req.body;
      
      const call = await aiCallsService.initiateCall({
        leadId,
        organizationId,
        userId,
        mode,
        settings,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('call:started', call);
      }
      
      res.status(201).json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error initiating call:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate call',
        details: error.message,
      });
    }
  },

  // Get call by ID
  async getCallById(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      
      const call = await aiCallsService.getCallById(callId, organizationId);
      
      if (!call) {
        return res.status(404).json({
          success: false,
          error: 'Call not found',
        });
      }
      
      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error getting call by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get call',
        details: error.message,
      });
    }
  },

  // Update call status
  async updateCallStatus(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { status, agentStatus, metadata } = req.body;
      
      const call = await aiCallsService.updateCallStatus(callId, organizationId, {
        status,
        agentStatus,
        metadata,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('call:status', { callId, status, agentStatus });
      }
      
      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error updating call status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update call status',
        details: error.message,
      });
    }
  },

  // Take over call (human intervention)
  async takeOverCall(req, res) {
    try {
      const { organizationId, userId } = req.user;
      const { callId } = req.params;
      
      const call = await aiCallsService.takeOverCall(callId, organizationId, userId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('call:takenover', { callId, userId });
      }
      
      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error taking over call:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to take over call',
        details: error.message,
      });
    }
  },

  // Pause AI
  async pauseAI(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      
      const call = await aiCallsService.pauseAI(callId, organizationId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('ai:paused', { callId });
      }
      
      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error pausing AI:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to pause AI',
        details: error.message,
      });
    }
  },

  // Resume AI
  async resumeAI(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      
      const call = await aiCallsService.resumeAI(callId, organizationId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('ai:resumed', { callId });
      }
      
      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error resuming AI:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resume AI',
        details: error.message,
      });
    }
  },

  // End call
  async endCall(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      
      const call = await aiCallsService.endCall(callId, organizationId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('call:ended', { callId });
      }
      
      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      logger.error('Error ending call:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end call',
        details: error.message,
      });
    }
  },

  // Get AI settings
  async getAISettings(req, res) {
    try {
      const { organizationId } = req.user;
      const settings = await aiCallsService.getAISettings(organizationId);
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Error getting AI settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI settings',
        details: error.message,
      });
    }
  },

  // Update AI settings
  async updateAISettings(req, res) {
    try {
      const { organizationId } = req.user;
      const settings = req.body;
      
      const updatedSettings = await aiCallsService.updateAISettings(organizationId, settings);
      
      res.json({
        success: true,
        data: updatedSettings,
      });
    } catch (error) {
      logger.error('Error updating AI settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update AI settings',
        details: error.message,
      });
    }
  },

  // Get available voices
  async getAvailableVoices(req, res) {
    try {
      const voices = await aiVoiceService.getAvailableVoices();
      
      res.json({
        success: true,
        data: voices,
      });
    } catch (error) {
      logger.error('Error getting available voices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available voices',
        details: error.message,
      });
    }
  },

  // Test voice
  async testVoice(req, res) {
    try {
      const { voiceId, text } = req.body;
      const audioUrl = await aiVoiceService.testVoice(voiceId, text);
      
      res.json({
        success: true,
        data: { audioUrl },
      });
    } catch (error) {
      logger.error('Error testing voice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test voice',
        details: error.message,
      });
    }
  },

  // Get content cards
  async getContentCards(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.query;
      
      const cards = await contentCardsService.getContentCards(organizationId, callId);
      
      res.json({
        success: true,
        data: cards,
      });
    } catch (error) {
      logger.error('Error getting content cards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get content cards',
        details: error.message,
      });
    }
  },

  // Create content card
  async createContentCard(req, res) {
    try {
      const { organizationId } = req.user;
      const cardData = req.body;
      
      const card = await contentCardsService.createContentCard(organizationId, cardData);
      
      res.status(201).json({
        success: true,
        data: card,
      });
    } catch (error) {
      logger.error('Error creating content card:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create content card',
        details: error.message,
      });
    }
  },

  // Update content card
  async updateContentCard(req, res) {
    try {
      const { organizationId } = req.user;
      const { cardId } = req.params;
      const updateData = req.body;
      
      const card = await contentCardsService.updateContentCard(cardId, organizationId, updateData);
      
      res.json({
        success: true,
        data: card,
      });
    } catch (error) {
      logger.error('Error updating content card:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content card',
        details: error.message,
      });
    }
  },

  // Delete content card
  async deleteContentCard(req, res) {
    try {
      const { organizationId } = req.user;
      const { cardId } = req.params;
      
      await contentCardsService.deleteContentCard(cardId, organizationId);
      
      res.json({
        success: true,
        message: 'Content card deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting content card:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete content card',
        details: error.message,
      });
    }
  },

  // Get progressive settings
  async getProgressiveSettings(req, res) {
    try {
      const { organizationId } = req.user;
      const settings = await progressiveSettingsService.getSettings(organizationId);
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Error getting progressive settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progressive settings',
        details: error.message,
      });
    }
  },

  // Update progressive settings
  async updateProgressiveSettings(req, res) {
    try {
      const { organizationId } = req.user;
      const { level, features, preferences } = req.body;
      
      const settings = await progressiveSettingsService.updateSettings(organizationId, {
        level,
        features,
        preferences,
      });
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Error updating progressive settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update progressive settings',
        details: error.message,
      });
    }
  },
};