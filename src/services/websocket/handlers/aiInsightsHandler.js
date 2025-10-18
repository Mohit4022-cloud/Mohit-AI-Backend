import { logger } from '../../../utils/logger.js';

export default function aiInsightsHandler(socket, io) {
  const { userId, organizationId } = socket;

  // Generate new insight
  socket.on('insight:generate', async (data) => {
    try {
      const { callId, type, context, keywords } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insight:generating', {
        callId,
        type,
        context,
        keywords,
        requestedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Insight generation requested for call: ${callId}, type: ${type}`);
    } catch (error) {
      logger.error('Error generating insight:', error);
      socket.emit('error', { message: 'Failed to generate insight' });
    }
  });

  // New insight created
  socket.on('insight:created', async (data) => {
    try {
      const { callId, insight } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insight:new', {
        callId,
        insight: {
          ...insight,
          createdAt: insight.createdAt || new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      // Also broadcast to organization AI calls room for real-time updates
      io.to(`ai_calls_${organizationId}`).emit('insight:new', {
        callId,
        insight,
        timestamp: new Date().toISOString(),
      });

      logger.info(`New insight created for call: ${callId}, type: ${insight.type}`);
    } catch (error) {
      logger.error('Error creating insight:', error);
      socket.emit('error', { message: 'Failed to create insight' });
    }
  });

  // Update insight
  socket.on('insight:update', async (data) => {
    try {
      const { callId, insightId, updates } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insight:updated', {
        callId,
        insightId,
        updates,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Insight updated: ${insightId} for call: ${callId}`);
    } catch (error) {
      logger.error('Error updating insight:', error);
      socket.emit('error', { message: 'Failed to update insight' });
    }
  });

  // Dismiss insight
  socket.on('insight:dismiss', async (data) => {
    try {
      const { callId, insightId, reason } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insight:dismissed', {
        callId,
        insightId,
        reason,
        dismissedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Insight dismissed: ${insightId} for call: ${callId}`);
    } catch (error) {
      logger.error('Error dismissing insight:', error);
      socket.emit('error', { message: 'Failed to dismiss insight' });
    }
  });

  // Resolve insight
  socket.on('insight:resolve', async (data) => {
    try {
      const { callId, insightId, resolution } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insight:resolved', {
        callId,
        insightId,
        resolution,
        resolvedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Insight resolved: ${insightId} for call: ${callId}`);
    } catch (error) {
      logger.error('Error resolving insight:', error);
      socket.emit('error', { message: 'Failed to resolve insight' });
    }
  });

  // Update insight priority
  socket.on('insight:priority', async (data) => {
    try {
      const { callId, insightId, priority } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insight:priority_updated', {
        callId,
        insightId,
        priority,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Insight priority updated: ${insightId} -> ${priority} for call: ${callId}`);
    } catch (error) {
      logger.error('Error updating insight priority:', error);
      socket.emit('error', { message: 'Failed to update insight priority' });
    }
  });

  // Batch insights update
  socket.on('insights:batch_update', async (data) => {
    try {
      const { callId, insights } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('insights:batch_updated', {
        callId,
        insights,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Batch insights updated for call: ${callId}, count: ${insights.length}`);
    } catch (error) {
      logger.error('Error batch updating insights:', error);
      socket.emit('error', { message: 'Failed to batch update insights' });
    }
  });

  // Get insight trends
  socket.on('insights:trends', async (data) => {
    try {
      const { filters } = data;
      
      // This would typically query the database for trends
      // For now, we'll broadcast the request
      socket.emit('insights:trends_data', {
        filters,
        requestedBy: userId,
        timestamp: new Date().toISOString(),
        // Mock data - in production, this would come from the database
        trends: {
          sentiment: [
            { date: '2024-01-01', positive: 65, neutral: 25, negative: 10 },
            { date: '2024-01-02', positive: 70, neutral: 20, negative: 10 },
          ],
          topics: [
            { topic: 'pricing', count: 45, trend: 'up' },
            { topic: 'features', count: 32, trend: 'stable' },
            { topic: 'competitors', count: 28, trend: 'down' },
          ],
        },
      });

      logger.info(`Insight trends requested by user: ${userId}`);
    } catch (error) {
      logger.error('Error getting insight trends:', error);
      socket.emit('error', { message: 'Failed to get insight trends' });
    }
  });

  // Real-time sentiment analysis
  socket.on('insight:sentiment_analysis', async (data) => {
    try {
      const { callId, text, timestamp } = data;
      
      // This would typically analyze the text using AI
      // For now, we'll broadcast the analysis request
      io.to(`call_${callId}`).emit('insight:sentiment_analyzed', {
        callId,
        text,
        timestamp,
        analyzedBy: userId,
        // Mock analysis - in production, this would come from AI service
        sentiment: {
          score: 0.75,
          label: 'positive',
          confidence: 0.85,
          emotions: ['excited', 'interested'],
        },
        analysisTimestamp: new Date().toISOString(),
      });

      logger.info(`Sentiment analysis requested for call: ${callId}`);
    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      socket.emit('error', { message: 'Failed to analyze sentiment' });
    }
  });

  // Keyword detection
  socket.on('insight:keyword_detection', async (data) => {
    try {
      const { callId, text, keywords } = data;
      
      // This would typically detect keywords in the text
      // For now, we'll broadcast the detection request
      io.to(`call_${callId}`).emit('insight:keywords_detected', {
        callId,
        text,
        keywords,
        detectedBy: userId,
        // Mock detection - in production, this would come from AI service
        detectedKeywords: [
          { keyword: 'pricing', position: 45, confidence: 0.9 },
          { keyword: 'competitor', position: 120, confidence: 0.85 },
        ],
        detectionTimestamp: new Date().toISOString(),
      });

      logger.info(`Keyword detection requested for call: ${callId}`);
    } catch (error) {
      logger.error('Error detecting keywords:', error);
      socket.emit('error', { message: 'Failed to detect keywords' });
    }
  });

  // Competitor mention detection
  socket.on('insight:competitor_detection', async (data) => {
    try {
      const { callId, text } = data;
      
      // This would typically detect competitor mentions
      // For now, we'll broadcast the detection request
      io.to(`call_${callId}`).emit('insight:competitor_detected', {
        callId,
        text,
        detectedBy: userId,
        // Mock detection - in production, this would come from AI service
        competitor: {
          name: 'Salesforce',
          confidence: 0.92,
          context: 'mentioned current CRM solution',
          sentiment: 'neutral',
        },
        detectionTimestamp: new Date().toISOString(),
      });

      logger.info(`Competitor detection requested for call: ${callId}`);
    } catch (error) {
      logger.error('Error detecting competitor:', error);
      socket.emit('error', { message: 'Failed to detect competitor' });
    }
  });

  // Action item extraction
  socket.on('insight:action_extraction', async (data) => {
    try {
      const { callId, text } = data;
      
      // This would typically extract action items
      // For now, we'll broadcast the extraction request
      io.to(`call_${callId}`).emit('insight:action_extracted', {
        callId,
        text,
        extractedBy: userId,
        // Mock extraction - in production, this would come from AI service
        actionItems: [
          {
            action: 'Send pricing information',
            assignee: 'AI',
            priority: 'high',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        extractionTimestamp: new Date().toISOString(),
      });

      logger.info(`Action item extraction requested for call: ${callId}`);
    } catch (error) {
      logger.error('Error extracting action items:', error);
      socket.emit('error', { message: 'Failed to extract action items' });
    }
  });
}