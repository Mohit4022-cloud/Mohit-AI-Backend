import { logger } from '../utils/logger.js';
import { aiAnalyticsService } from '../services/ai/aiAnalyticsService.js';

export const aiAnalyticsController = {
  // Get dashboard metrics
  async getDashboardMetrics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo } = req.query;
      
      const metrics = await aiAnalyticsService.getDashboardMetrics(organizationId, {
        dateFrom,
        dateTo,
      });
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting dashboard metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard metrics',
        details: error.message,
      });
    }
  },

  // Get performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, granularity = 'day' } = req.query;
      
      const metrics = await aiAnalyticsService.getPerformanceMetrics(organizationId, {
        dateFrom,
        dateTo,
        granularity,
      });
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance metrics',
        details: error.message,
      });
    }
  },

  // Get sentiment analysis
  async getSentimentAnalysis(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, granularity = 'day' } = req.query;
      
      const analysis = await aiAnalyticsService.getSentimentAnalysis(organizationId, {
        dateFrom,
        dateTo,
        granularity,
      });
      
      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Error getting sentiment analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sentiment analysis',
        details: error.message,
      });
    }
  },

  // Get conversion metrics
  async getConversionMetrics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, funnelStage } = req.query;
      
      const metrics = await aiAnalyticsService.getConversionMetrics(organizationId, {
        dateFrom,
        dateTo,
        funnelStage,
      });
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting conversion metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversion metrics',
        details: error.message,
      });
    }
  },

  // Get real-time metrics
  async getRealTimeMetrics(req, res) {
    try {
      const { organizationId } = req.user;
      
      const metrics = await aiAnalyticsService.getRealTimeMetrics(organizationId);
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting real-time metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get real-time metrics',
        details: error.message,
      });
    }
  },

  // Get call volume analytics
  async getCallVolumeAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, granularity = 'hour' } = req.query;
      
      const analytics = await aiAnalyticsService.getCallVolumeAnalytics(organizationId, {
        dateFrom,
        dateTo,
        granularity,
      });
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting call volume analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get call volume analytics',
        details: error.message,
      });
    }
  },

  // Get AI performance analytics
  async getAIPerformanceAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, metric } = req.query;
      
      const analytics = await aiAnalyticsService.getAIPerformanceAnalytics(organizationId, {
        dateFrom,
        dateTo,
        metric,
      });
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting AI performance analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI performance analytics',
        details: error.message,
      });
    }
  },

  // Get topic analytics
  async getTopicAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, limit = 20 } = req.query;
      
      const analytics = await aiAnalyticsService.getTopicAnalytics(organizationId, {
        dateFrom,
        dateTo,
        limit: parseInt(limit),
      });
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting topic analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get topic analytics',
        details: error.message,
      });
    }
  },

  // Get competitor analytics
  async getCompetitorAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo } = req.query;
      
      const analytics = await aiAnalyticsService.getCompetitorAnalytics(organizationId, {
        dateFrom,
        dateTo,
      });
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting competitor analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get competitor analytics',
        details: error.message,
      });
    }
  },

  // Get ROI analytics
  async getROIAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { dateFrom, dateTo, comparisonPeriod } = req.query;
      
      const analytics = await aiAnalyticsService.getROIAnalytics(organizationId, {
        dateFrom,
        dateTo,
        comparisonPeriod,
      });
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting ROI analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get ROI analytics',
        details: error.message,
      });
    }
  },

  // Export analytics report
  async exportAnalyticsReport(req, res) {
    try {
      const { organizationId } = req.user;
      const { reportType, dateFrom, dateTo, format = 'pdf' } = req.query;
      
      const reportData = await aiAnalyticsService.exportAnalyticsReport(organizationId, {
        reportType,
        dateFrom,
        dateTo,
        format,
      });
      
      // Set appropriate headers for file download
      const contentType = format === 'pdf' ? 'application/pdf' : 'application/json';
      const filename = `analytics-report-${reportType}-${dateFrom}-${dateTo}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'json') {
        res.json(reportData);
      } else {
        res.send(reportData);
      }
    } catch (error) {
      logger.error('Error exporting analytics report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics report',
        details: error.message,
      });
    }
  },
};