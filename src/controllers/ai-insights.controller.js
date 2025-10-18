import { logger } from '../utils/logger.js';
import { aiInsightsService } from '../services/ai/aiInsightsService.js';

export const aiInsightsController = {
  // Get call insights
  async getCallInsights(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { type, limit = 50 } = req.query;
      
      const insights = await aiInsightsService.getCallInsights(callId, organizationId, {
        type,
        limit: parseInt(limit),
      });
      
      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Error getting call insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get call insights',
        details: error.message,
      });
    }
  },

  // Generate insight
  async generateInsight(req, res) {
    try {
      const { organizationId } = req.user;
      const { callId } = req.params;
      const { type, context, keywords } = req.body;
      
      const insight = await aiInsightsService.generateInsight({
        callId,
        organizationId,
        type,
        context,
        keywords,
      });
      
      // Emit WebSocket event for real-time updates
      if (global.io) {
        global.io.emit('insight:new', insight);
      }
      
      res.status(201).json({
        success: true,
        data: insight,
      });
    } catch (error) {
      logger.error('Error generating insight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate insight',
        details: error.message,
      });
    }
  },

  // Get organization insights
  async getOrganizationInsights(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, dateFrom, dateTo, limit = 100 } = req.query;
      
      const insights = await aiInsightsService.getOrganizationInsights(organizationId, {
        type,
        dateFrom,
        dateTo,
        limit: parseInt(limit),
      });
      
      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Error getting organization insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get organization insights',
        details: error.message,
      });
    }
  },

  // Update insight
  async updateInsight(req, res) {
    try {
      const { organizationId } = req.user;
      const { insightId } = req.params;
      const updateData = req.body;
      
      const insight = await aiInsightsService.updateInsight(insightId, organizationId, updateData);
      
      res.json({
        success: true,
        data: insight,
      });
    } catch (error) {
      logger.error('Error updating insight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update insight',
        details: error.message,
      });
    }
  },

  // Delete insight
  async deleteInsight(req, res) {
    try {
      const { organizationId } = req.user;
      const { insightId } = req.params;
      
      await aiInsightsService.deleteInsight(insightId, organizationId);
      
      res.json({
        success: true,
        message: 'Insight deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting insight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete insight',
        details: error.message,
      });
    }
  },

  // Get insight trends
  async getInsightTrends(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, granularity = 'day', dateFrom, dateTo } = req.query;
      
      const trends = await aiInsightsService.getInsightTrends(organizationId, {
        type,
        granularity,
        dateFrom,
        dateTo,
      });
      
      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      logger.error('Error getting insight trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get insight trends',
        details: error.message,
      });
    }
  },
};