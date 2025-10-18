import { logger } from '../utils/logger.js';
import { aiTranscriptionService } from '../services/ai/aiTranscriptionService.js';

export const aiTranscriptionController = {
  // Get transcript for a call
  async getTranscript(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { format = 'json', includeTimestamps = true } = req.query;
      
      const transcript = await aiTranscriptionService.getTranscript(callId, organizationId, {
        format,
        includeTimestamps: includeTimestamps === 'true',
      });
      
      res.json({
        success: true,
        data: transcript,
      });
    } catch (error) {
      logger.error('Error getting transcript:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transcript',
        details: error.message,
      });
    }
  },

  // Add transcript entry
  async addTranscriptEntry(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { speaker, text, timestamp, sentiment, keywords } = req.body;
      
      const entry = await aiTranscriptionService.addTranscriptEntry(callId, organizationId, {
        speaker,
        text,
        timestamp,
        sentiment,
        keywords,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('transcript:update', entry);
      }
      
      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      logger.error('Error adding transcript entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add transcript entry',
        details: error.message,
      });
    }
  },

  // Update transcript entry
  async updateTranscriptEntry(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId, entryId } = req.params;
      const updateData = req.body;
      
      const entry = await aiTranscriptionService.updateTranscriptEntry(
        entryId,
        callId,
        organizationId,
        updateData
      );
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('transcript:entry_updated', entry);
      }
      
      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      logger.error('Error updating transcript entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update transcript entry',
        details: error.message,
      });
    }
  },

  // Delete transcript entry
  async deleteTranscriptEntry(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId, entryId } = req.params;
      
      await aiTranscriptionService.deleteTranscriptEntry(entryId, callId, organizationId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('transcript:entry_deleted', { entryId, callId });
      }
      
      res.json({
        success: true,
        message: 'Transcript entry deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting transcript entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete transcript entry',
        details: error.message,
      });
    }
  },

  // Search transcript
  async searchTranscript(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { query, speaker, dateFrom, dateTo, limit = 50 } = req.query;
      
      const results = await aiTranscriptionService.searchTranscript(callId, organizationId, {
        query,
        speaker,
        dateFrom,
        dateTo,
        limit: parseInt(limit),
      });
      
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Error searching transcript:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search transcript',
        details: error.message,
      });
    }
  },

  // Get transcript summary
  async getTranscriptSummary(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { includeKeywords = true, includeSentiment = true } = req.query;
      
      const summary = await aiTranscriptionService.getTranscriptSummary(callId, organizationId, {
        includeKeywords: includeKeywords === 'true',
        includeSentiment: includeSentiment === 'true',
      });
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Error getting transcript summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transcript summary',
        details: error.message,
      });
    }
  },

  // Export transcript
  async exportTranscript(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { format = 'txt', includeMetadata = true } = req.query;
      
      const exportData = await aiTranscriptionService.exportTranscript(callId, organizationId, {
        format,
        includeMetadata: includeMetadata === 'true',
      });
      
      // Set appropriate headers for file download
      const contentType = format === 'json' ? 'application/json' : 'text/plain';
      const filename = `transcript-${callId}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'json') {
        res.json(exportData);
      } else {
        res.send(exportData);
      }
    } catch (error) {
      logger.error('Error exporting transcript:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export transcript',
        details: error.message,
      });
    }
  },

  // Start live transcription
  async startLiveTranscription(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { language = 'en', model = 'whisper-1' } = req.body;
      
      const session = await aiTranscriptionService.startLiveTranscription(callId, organizationId, {
        language,
        model,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('transcript:live_started', { callId, sessionId: session.id });
      }
      
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Error starting live transcription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start live transcription',
        details: error.message,
      });
    }
  },

  // Stop live transcription
  async stopLiveTranscription(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      
      await aiTranscriptionService.stopLiveTranscription(callId, organizationId);
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('transcript:live_stopped', { callId });
      }
      
      res.json({
        success: true,
        message: 'Live transcription stopped successfully',
      });
    } catch (error) {
      logger.error('Error stopping live transcription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop live transcription',
        details: error.message,
      });
    }
  },
};