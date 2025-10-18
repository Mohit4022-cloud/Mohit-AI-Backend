import { logger } from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { aiServiceFactory } from './aiServiceFactory.js';
import { emitToCall, emitToAICalls } from '../websocket/index.js';

const prisma = new PrismaClient();

class ContentCardsService {
  /**
   * Get content cards for organization or specific call
   */
  async getContentCards(organizationId, callId = null) {
    try {
      const where = {
        organizationId,
        isActive: true,
        ...(callId && { callId }),
      };

      const cards = await prisma.contentCard.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return cards;
    } catch (error) {
      logger.error('Error getting content cards:', error);
      throw new Error('Failed to get content cards');
    }
  }

  /**
   * Create content card
   */
  async createContentCard(organizationId, cardData) {
    try {
      const card = await prisma.contentCard.create({
        data: {
          organizationId,
          type: cardData.type,
          title: cardData.title,
          content: cardData.content,
          priority: cardData.priority || 'MEDIUM',
          isActive: cardData.isActive !== false,
          isDismissible: cardData.isDismissible !== false,
          displayDuration: cardData.displayDuration,
          actionButtons: cardData.actionButtons,
          metadata: cardData.metadata,
        },
      });

      // Emit WebSocket events
      if (card.callId) {
        emitToCall(card.callId, 'content_card:created', card);
      }
      emitToAICalls(organizationId, 'content_card:created', card);

      logger.info(`Content card created: ${card.id} for organization: ${organizationId}`);
      return card;
    } catch (error) {
      logger.error('Error creating content card:', error);
      throw new Error('Failed to create content card');
    }
  }

  /**
   * Update content card
   */
  async updateContentCard(cardId, organizationId, updateData) {
    try {
      const card = await prisma.contentCard.update({
        where: {
          id: cardId,
          organizationId,
        },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      // Emit WebSocket events
      if (card.callId) {
        emitToCall(card.callId, 'content_card:updated', card);
      }
      emitToAICalls(organizationId, 'content_card:updated', card);

      logger.info(`Content card updated: ${cardId}`);
      return card;
    } catch (error) {
      logger.error('Error updating content card:', error);
      throw new Error('Failed to update content card');
    }
  }

  /**
   * Delete content card
   */
  async deleteContentCard(cardId, organizationId) {
    try {
      const card = await prisma.contentCard.findUnique({
        where: { id: cardId, organizationId },
      });

      if (!card) {
        throw new Error('Content card not found');
      }

      await prisma.contentCard.delete({
        where: { id: cardId },
      });

      // Emit WebSocket events
      if (card.callId) {
        emitToCall(card.callId, 'content_card:deleted', { cardId });
      }
      emitToAICalls(organizationId, 'content_card:deleted', { cardId });

      logger.info(`Content card deleted: ${cardId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting content card:', error);
      throw new Error('Failed to delete content card');
    }
  }

  /**
   * Generate contextual content cards based on call analysis
   */
  async generateContextualCards(callId, organizationId, transcript, aiInsights) {
    try {
      const cards = [];

      // Generate pricing card if pricing is discussed
      if (this.isPricingDiscussed(transcript, aiInsights)) {
        const pricingCard = await this.generatePricingCard(organizationId, callId, transcript);
        cards.push(pricingCard);
      }

      // Generate competitor card if competitors are mentioned
      if (this.isCompetitorMentioned(aiInsights)) {
        const competitorCard = await this.generateCompetitorCard(organizationId, callId, aiInsights);
        cards.push(competitorCard);
      }

      // Generate objection handling card if objections are detected
      if (this.hasObjections(aiInsights)) {
        const objectionCard = await this.generateObjectionCard(organizationId, callId, aiInsights);
        cards.push(objectionCard);
      }

      // Generate talking points card based on conversation context
      const talkingPointsCard = await this.generateTalkingPointsCard(organizationId, callId, transcript);
      cards.push(talkingPointsCard);

      // Create all cards
      const createdCards = await Promise.all(
        cards.map(card => this.createContentCard(organizationId, card))
      );

      logger.info(`Generated ${createdCards.length} contextual cards for call: ${callId}`);
      return createdCards;
    } catch (error) {
      logger.error('Error generating contextual cards:', error);
      throw new Error('Failed to generate contextual cards');
    }
  }

  /**
   * Generate pricing card
   */
  async generatePricingCard(organizationId, callId, transcript) {
    try {
      // Use AI to extract relevant pricing information
      const pricingContext = await aiServiceFactory.extractKeywords(transcript, {
        temperature: 0.2,
      });

      return {
        callId,
        type: 'pricing',
        title: 'Pricing Guidelines',
        content: 'Standard: $99/user/month | Enterprise: Custom pricing available',
        priority: 'HIGH',
        metadata: {
          context: pricingContext.join(', '),
        },
        actionButtons: [
          {
            label: 'View Pricing',
            action: 'navigate',
            target: '/pricing',
          },
          {
            label: 'Generate Quote',
            action: 'generate_quote',
          },
        ],
      };
    } catch (error) {
      logger.error('Error generating pricing card:', error);
      throw new Error('Failed to generate pricing card');
    }
  }

  /**
   * Generate competitor card
   */
  async generateCompetitorCard(organizationId, callId, aiInsights) {
    try {
      const competitors = aiInsights.filter(insight => insight.type === 'COMPETITOR');
      const competitorNames = competitors.map(c => c.content).join(', ');

      return {
        callId,
        type: 'competitor',
        title: `vs. ${competitorNames}`,
        content: '50% faster implementation, 30% lower TCO, 24/7 support included',
        priority: 'MEDIUM',
        metadata: {
          competitors: competitorNames,
        },
        actionButtons: [
          {
            label: 'Comparison',
            action: 'navigate',
            target: '/compare',
          },
          {
            label: 'Case Study',
            action: 'navigate',
            target: '/case-studies',
          },
        ],
      };
    } catch (error) {
      logger.error('Error generating competitor card:', error);
      throw new Error('Failed to generate competitor card');
    }
  }

  /**
   * Generate objection handling card
   */
  async generateObjectionCard(organizationId, callId, aiInsights) {
    try {
      const objections = aiInsights.filter(insight => insight.type === 'OBJECTION');
      const objectionText = objections[0]?.content || 'Price concern';

      return {
        callId,
        type: 'objection',
        title: 'Objection Handling',
        content: `Addressing: ${objectionText}. Emphasize ROI and flexible payment options.`,
        priority: 'HIGH',
        metadata: {
          objection: objectionText,
        },
        actionButtons: [
          {
            label: 'Response Guide',
            action: 'show_response',
          },
          {
            label: 'Success Story',
            action: 'navigate',
            target: '/success-stories',
          },
        ],
      };
    } catch (error) {
      logger.error('Error generating objection card:', error);
      throw new Error('Failed to generate objection card');
    }
  }

  /**
   * Generate talking points card
   */
  async generateTalkingPointsCard(organizationId, callId, transcript) {
    try {
      const talkingPoints = await aiServiceFactory.suggestTalkingPoints({
        transcript,
        currentSituation: 'Active sales conversation',
        aiSettings: {
          empathyLevel: 5,
          technicalDetail: 5,
          formalityLevel: 5,
        },
      });

      const topPoints = talkingPoints.slice(0, 3).map(point => point.point);

      return {
        callId,
        type: 'talking_point',
        title: 'Suggested Talking Points',
        content: topPoints.join(' • '),
        priority: 'MEDIUM',
        metadata: {
          talkingPoints,
        },
        actionButtons: [
          {
            label: 'More Points',
            action: 'show_more',
          },
        ],
      };
    } catch (error) {
      logger.error('Error generating talking points card:', error);
      throw new Error('Failed to generate talking points card');
    }
  }

  /**
   * Check if pricing is discussed in transcript
   */
  isPricingDiscussed(transcript, aiInsights) {
    const pricingKeywords = ['price', 'cost', 'pricing', 'budget', 'afford', 'investment'];
    const transcriptLower = transcript.toLowerCase();
    
    return pricingKeywords.some(keyword => transcriptLower.includes(keyword)) ||
           aiInsights.some(insight => insight.type === 'PRICING');
  }

  /**
   * Check if competitors are mentioned
   */
  isCompetitorMentioned(aiInsights) {
    return aiInsights.some(insight => insight.type === 'COMPETITOR');
  }

  /**
   * Check if there are objections
   */
  hasObjections(aiInsights) {
    return aiInsights.some(insight => insight.type === 'OBJECTION');
  }

  /**
   * Get content card templates
   */
  async getContentCardTemplates(organizationId) {
    try {
      // Return predefined templates for different card types
      const templates = {
        pricing: {
          type: 'pricing',
          title: 'Pricing Information',
          content: 'Standard plan: $99/user/month\nEnterprise: Custom pricing',
          priority: 'MEDIUM',
          actionButtons: [
            { label: 'View Plans', action: 'navigate', target: '/pricing' },
            { label: 'Get Quote', action: 'generate_quote' },
          ],
        },
        competitor: {
          type: 'competitor',
          title: 'Competitor Comparison',
          content: 'Mohit AI vs. Competitor: Faster implementation, better support',
          priority: 'MEDIUM',
          actionButtons: [
            { label: 'Full Comparison', action: 'navigate', target: '/compare' },
          ],
        },
        objection: {
          type: 'objection',
          title: 'Common Objections',
          content: 'Price too high: Emphasize ROI and value',
          priority: 'HIGH',
          actionButtons: [
            { label: 'Response Guide', action: 'show_guide' },
          ],
        },
        feature: {
          type: 'feature',
          title: 'Key Features',
          content: '• AI-powered lead qualification\n• Real-time call analytics\n• CRM integration',
          priority: 'MEDIUM',
          actionButtons: [
            { label: 'All Features', action: 'navigate', target: '/features' },
          ],
        },
      };

      return templates;
    } catch (error) {
      logger.error('Error getting content card templates:', error);
      throw new Error('Failed to get content card templates');
    }
  }

  /**
   * Dismiss content card
   */
  async dismissContentCard(cardId, organizationId, userId) {
    try {
      const card = await prisma.contentCard.findUnique({
        where: { id: cardId, organizationId },
      });

      if (!card) {
        throw new Error('Content card not found');
      }

      if (!card.isDismissible) {
        throw new Error('Content card is not dismissible');
      }

      // Update card to inactive
      await prisma.contentCard.update({
        where: { id: cardId },
        data: {
          isActive: false,
          metadata: {
            ...card.metadata,
            dismissedAt: new Date().toISOString(),
            dismissedBy: userId,
          },
          updatedAt: new Date(),
        },
      });

      // Emit WebSocket events
      if (card.callId) {
        emitToCall(card.callId, 'content_card:dismissed', { cardId, dismissedBy: userId });
      }
      emitToAICalls(organizationId, 'content_card:dismissed', { cardId, dismissedBy: userId });

      logger.info(`Content card dismissed: ${cardId} by user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error dismissing content card:', error);
      throw new Error('Failed to dismiss content card');
    }
  }

  /**
   * Get content card analytics
   */
  async getContentCardAnalytics(organizationId, options = {}) {
    try {
      const { dateFrom, dateTo, type } = options;
      
      const where = {
        organizationId,
        ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
        ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
        ...(type && { type }),
      };

      const cards = await prisma.contentCard.findMany({
        where,
        select: {
          type: true,
          priority: true,
          isActive: true,
          callId: true,
          metadata: true,
          createdAt: true,
        },
      });

      // Analyze card usage
      const analytics = {
        totalCards: cards.length,
        cardsByType: {},
        cardsByPriority: {},
        activeCards: cards.filter(card => card.isActive).length,
        cardsWithCalls: cards.filter(card => card.callId).length,
        dismissedCards: cards.filter(card => 
          card.metadata?.dismissedAt
        ).length,
      };

      // Count by type
      cards.forEach(card => {
        analytics.cardsByType[card.type] = (analytics.cardsByType[card.type] || 0) + 1;
        analytics.cardsByPriority[card.priority] = (analytics.cardsByPriority[card.priority] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting content card analytics:', error);
      throw new Error('Failed to get content card analytics');
    }
  }
}

export const contentCardsService = new ContentCardsService();
export default contentCardsService;