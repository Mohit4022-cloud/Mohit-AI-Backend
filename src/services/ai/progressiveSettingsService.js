import { logger } from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { emitToAICalls } from '../websocket/index.js';

const prisma = new PrismaClient();

class ProgressiveSettingsService {
  /**
   * Get progressive settings for organization
   */
  async getSettings(organizationId) {
    try {
      let settings = await prisma.progressiveSettings.findUnique({
        where: { organizationId },
      });

      // Create default settings if not found
      if (!settings) {
        settings = await prisma.progressiveSettings.create({
          data: {
            organizationId,
            level: 'OVERVIEW',
            features: this.getDefaultFeatures('OVERVIEW'),
            preferences: this.getDefaultPreferences(),
          },
        });
      }

      return settings;
    } catch (error) {
      logger.error('Error getting progressive settings:', error);
      throw new Error('Failed to get progressive settings');
    }
  }

  /**
   * Update progressive settings
   */
  async updateSettings(organizationId, { level, features, preferences }) {
    try {
      const updatedSettings = await prisma.progressiveSettings.upsert({
        where: { organizationId },
        update: {
          ...(level && { level }),
          ...(features && { features }),
          ...(preferences && { preferences }),
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          level: level || 'OVERVIEW',
          features: features || this.getDefaultFeatures(level || 'OVERVIEW'),
          preferences: preferences || this.getDefaultPreferences(),
        },
      });

      // Emit WebSocket event
      emitToAICalls(organizationId, 'progressive_settings_updated', updatedSettings);

      logger.info(`Progressive settings updated for organization: ${organizationId}, level: ${level}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating progressive settings:', error);
      throw new Error('Failed to update progressive settings');
    }
  }

  /**
   * Get available features for a specific level
   */
  getFeaturesForLevel(level) {
    const features = {
      OVERVIEW: [
        {
          id: 'active_calls',
          name: 'Active Calls',
          description: 'View currently active AI calls',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'call_status',
          name: 'Call Status',
          description: 'Basic call status indicators',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'basic_metrics',
          name: 'Basic Metrics',
          description: 'Essential call metrics',
          category: 'analytics',
          enabled: true,
        },
      ],
      BASIC: [
        {
          id: 'active_calls',
          name: 'Active Calls',
          description: 'View currently active AI calls',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'call_status',
          name: 'Call Status',
          description: 'Basic call status indicators',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'basic_metrics',
          name: 'Basic Metrics',
          description: 'Essential call metrics',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'transcript',
          name: 'Live Transcript',
          description: 'View real-time call transcript',
          category: 'transcript',
          enabled: true,
        },
        {
          id: 'ai_controls',
          name: 'AI Controls',
          description: 'Basic AI call controls',
          category: 'ai',
          enabled: true,
        },
        {
          id: 'call_queue',
          name: 'Call Queue',
          description: 'View and manage call queue',
          category: 'queue',
          enabled: true,
        },
      ],
      DETAILED: [
        {
          id: 'active_calls',
          name: 'Active Calls',
          description: 'View currently active AI calls',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'call_status',
          name: 'Call Status',
          description: 'Basic call status indicators',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'basic_metrics',
          name: 'Basic Metrics',
          description: 'Essential call metrics',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'transcript',
          name: 'Live Transcript',
          description: 'View real-time call transcript',
          category: 'transcript',
          enabled: true,
        },
        {
          id: 'ai_controls',
          name: 'AI Controls',
          description: 'Basic AI call controls',
          category: 'ai',
          enabled: true,
        },
        {
          id: 'call_queue',
          name: 'Call Queue',
          description: 'View and manage call queue',
          category: 'queue',
          enabled: true,
        },
        {
          id: 'ai_insights',
          name: 'AI Insights',
          description: 'Real-time AI-generated insights',
          category: 'insights',
          enabled: true,
        },
        {
          id: 'content_cards',
          name: 'Content Cards',
          description: 'Contextual content cards',
          category: 'content',
          enabled: true,
        },
        {
          id: 'advanced_metrics',
          name: 'Advanced Metrics',
          description: 'Detailed call analytics',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'ai_behavior',
          name: 'AI Behavior',
          description: 'Adjust AI response behavior',
          category: 'ai',
          enabled: true,
        },
      ],
      ADVANCED: [
        {
          id: 'active_calls',
          name: 'Active Calls',
          description: 'View currently active AI calls',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'call_status',
          name: 'Call Status',
          description: 'Basic call status indicators',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'basic_metrics',
          name: 'Basic Metrics',
          description: 'Essential call metrics',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'transcript',
          name: 'Live Transcript',
          description: 'View real-time call transcript',
          category: 'transcript',
          enabled: true,
        },
        {
          id: 'ai_controls',
          name: 'AI Controls',
          description: 'Basic AI call controls',
          category: 'ai',
          enabled: true,
        },
        {
          id: 'call_queue',
          name: 'Call Queue',
          description: 'View and manage call queue',
          category: 'queue',
          enabled: true,
        },
        {
          id: 'ai_insights',
          name: 'AI Insights',
          description: 'Real-time AI-generated insights',
          category: 'insights',
          enabled: true,
        },
        {
          id: 'content_cards',
          name: 'Content Cards',
          description: 'Contextual content cards',
          category: 'content',
          enabled: true,
        },
        {
          id: 'advanced_metrics',
          name: 'Advanced Metrics',
          description: 'Detailed call analytics',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'ai_behavior',
          name: 'AI Behavior',
          description: 'Adjust AI response behavior',
          category: 'ai',
          enabled: true,
        },
        {
          id: 'call_recording',
          name: 'Call Recording',
          description: 'Access call recordings',
          category: 'calls',
          enabled: true,
        },
        {
          id: 'sentiment_analysis',
          name: 'Sentiment Analysis',
          description: 'Real-time sentiment analysis',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'keyword_detection',
          name: 'Keyword Detection',
          description: 'Real-time keyword detection',
          category: 'analytics',
          enabled: true,
        },
        {
          id: 'competitor_tracking',
          name: 'Competitor Tracking',
          description: 'Track competitor mentions',
          category: 'insights',
          enabled: true,
        },
        {
          id: 'system_logs',
          name: 'System Logs',
          description: 'View system logs and diagnostics',
          category: 'system',
          enabled: true,
        },
      ],
    };

    return features[level] || features.OVERVIEW;
  }

  /**
   * Get default features for a level
   */
  getDefaultFeatures(level) {
    const features = this.getFeaturesForLevel(level);
    return features.reduce((acc, feature) => {
      acc[feature.id] = feature.enabled;
      return acc;
    }, {});
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences() {
    return {
      theme: 'light',
      language: 'en',
      notifications: {
        callStarted: true,
        callEnded: true,
        aiInsight: true,
        queueUpdate: false,
      },
      display: {
        compactMode: false,
        showAnimations: true,
        autoRefresh: true,
      },
      privacy: {
        hideSensitiveData: false,
        anonymizeTranscripts: false,
      },
    };
  }

  /**
   * Validate level transition
   */
  async validateLevelTransition(organizationId, newLevel) {
    try {
      const currentSettings = await this.getSettings(organizationId);
      const currentLevel = currentSettings.level;

      // Define allowed transitions
      const allowedTransitions = {
        OVERVIEW: ['BASIC', 'DETAILED', 'ADVANCED'],
        BASIC: ['OVERVIEW', 'DETAILED', 'ADVANCED'],
        DETAILED: ['OVERVIEW', 'BASIC', 'ADVANCED'],
        ADVANCED: ['OVERVIEW', 'BASIC', 'DETAILED'],
      };

      if (!allowedTransitions[currentLevel].includes(newLevel)) {
        return {
          isValid: false,
          error: `Invalid transition from ${currentLevel} to ${newLevel}`,
        };
      }

      // Check if user has required permissions for advanced level
      if (newLevel === 'ADVANCED') {
        // This would typically check user roles/permissions
        // For now, we'll allow it
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error validating level transition:', error);
      throw new Error('Failed to validate level transition');
    }
  }

  /**
   * Get level progression analytics
   */
  async getLevelProgressionAnalytics(organizationId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      
      // This would typically query usage data to track level changes
      // For now, return mock analytics
      const analytics = {
        currentLevel: 'BASIC',
        levelHistory: [
          { level: 'OVERVIEW', changedAt: '2024-01-01T00:00:00Z', duration: 86400 },
          { level: 'BASIC', changedAt: '2024-01-02T00:00:00Z', duration: 172800 },
        ],
        featureUsage: {
          active_calls: 45,
          transcript: 32,
          ai_insights: 28,
          content_cards: 15,
        },
        timeInLevel: {
          OVERVIEW: 86400,
          BASIC: 172800,
        },
      };

      return analytics;
    } catch (error) {
      logger.error('Error getting level progression analytics:', error);
      throw new Error('Failed to get level progression analytics');
    }
  }

  /**
   * Get recommended level based on user activity
   */
  async getRecommendedLevel(organizationId, userActivity) {
    try {
      // Analyze user activity to recommend appropriate level
      const {
        callsPerDay,
        featuresUsed,
        sessionDuration,
        complexityScore,
      } = userActivity;

      let recommendedLevel = 'OVERVIEW';

      // Simple recommendation logic
      if (callsPerDay > 10 && featuresUsed.length > 5) {
        recommendedLevel = 'ADVANCED';
      } else if (callsPerDay > 5 || featuresUsed.length > 3) {
        recommendedLevel = 'DETAILED';
      } else if (callsPerDay > 2 || featuresUsed.length > 1) {
        recommendedLevel = 'BASIC';
      }

      return {
        recommendedLevel,
        reasoning: this.getRecommendationReasoning(recommendedLevel, userActivity),
      };
    } catch (error) {
      logger.error('Error getting recommended level:', error);
      throw new Error('Failed to get recommended level');
    }
  }

  /**
   * Get reasoning for level recommendation
   */
  getRecommendationReasoning(level, userActivity) {
    const reasonings = {
      OVERVIEW: 'Based on your usage patterns, the Overview level provides the essential features you need without overwhelming complexity.',
      BASIC: 'Your activity suggests you\'re ready for more features. The Basic level adds transcript viewing and AI controls to enhance your experience.',
      DETAILED: 'With your increased usage, the Detailed level offers AI insights and content cards to help you get more value from calls.',
      ADVANCED: 'Your extensive usage indicates you\'re ready for the full feature set. The Advanced level provides comprehensive tools for power users.',
    };

    return reasonings[level] || reasonings.OVERVIEW;
  }

  /**
   * Reset settings to default
   */
  async resetToDefaults(organizationId, level = 'OVERVIEW') {
    try {
      const defaultSettings = {
        level,
        features: this.getDefaultFeatures(level),
        preferences: this.getDefaultPreferences(),
      };

      const updatedSettings = await this.updateSettings(organizationId, defaultSettings);
      
      logger.info(`Progressive settings reset to defaults for organization: ${organizationId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error resetting settings to defaults:', error);
      throw new Error('Failed to reset settings to defaults');
    }
  }

  /**
   * Export settings
   */
  async exportSettings(organizationId) {
    try {
      const settings = await this.getSettings(organizationId);
      
      const exportData = {
        organizationId,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      return exportData;
    } catch (error) {
      logger.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  /**
   * Import settings
   */
  async importSettings(organizationId, settingsData) {
    try {
      const { settings, version } = settingsData;
      
      // Validate version compatibility
      if (version !== '1.0') {
        throw new Error(`Incompatible settings version: ${version}`);
      }

      // Update settings
      const updatedSettings = await this.updateSettings(organizationId, settings);
      
      logger.info(`Progressive settings imported for organization: ${organizationId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error importing settings:', error);
      throw new Error('Failed to import settings');
    }
  }
}

export const progressiveSettingsService = new ProgressiveSettingsService();
export default progressiveSettingsService;