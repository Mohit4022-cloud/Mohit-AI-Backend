import { logger } from '../../utils/logger.js';
import aiService from '../ai/aiService.js';
import crmService from '../crm/crmService.js';

class LeadQualificationService {
  constructor() {
    this.qualificationFrameworks = {
      BANT: ['Budget', 'Authority', 'Need', 'Timeline'],
      FAINT: ['Funds', 'Authority', 'Interest', 'Need', 'Timeline'],
      CHAMP: ['Challenges', 'Authority', 'Money', 'Prioritization'],
      MEDDIC: ['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion']
    };
  }

  async getQualificationContext(leadData) {
    try {
      // Determine best framework based on lead source and business type
      const framework = this.selectFramework(leadData);
      
      // Get business context
      const businessContext = await this.getBusinessContext(leadData);
      
      // Generate qualification questions
      const questions = await this.generateQualificationQuestions(leadData, framework, businessContext);
      
      // Get lead enrichment data if available
      const enrichmentData = await this.enrichLeadData(leadData);

      return {
        framework,
        qualificationCriteria: this.qualificationFrameworks[framework],
        questions,
        businessContext,
        enrichmentData,
        conversationGoal: this.determineConversationGoal(leadData, businessContext)
      };
    } catch (error) {
      logger.error('Error getting qualification context:', error);
      return this.getDefaultContext();
    }
  }

  selectFramework(leadData) {
    // B2B typically uses BANT or MEDDIC
    if (leadData.businessType === 'B2B' || leadData.company) {
      return leadData.dealSize > 10000 ? 'MEDDIC' : 'BANT';
    }
    
    // B2C or SMB uses simpler frameworks
    return 'FAINT';
  }

  async getBusinessContext(leadData) {
    try {
      // Get CRM data if available
      const crmData = await crmService.getContactData(leadData.email || leadData.phone);
      
      return {
        industry: leadData.industry || crmData?.industry || 'General',
        companySize: leadData.companySize || crmData?.companySize || 'Unknown',
        previousInteractions: crmData?.interactions || [],
        leadSource: leadData.source,
        productInterest: leadData.productInterest || this.inferProductInterest(leadData),
        urgency: this.assessUrgency(leadData)
      };
    } catch (error) {
      logger.error('Error getting business context:', error);
      return {};
    }
  }

  async generateQualificationQuestions(leadData, framework, businessContext) {
    const baseQuestions = {
      BANT: [
        "What's your budget range for this solution?",
        "Are you the decision maker for this purchase?",
        "What specific challenges are you looking to solve?",
        "When are you looking to implement a solution?"
      ],
      FAINT: [
        "Have you allocated funds for this type of solution?",
        "Who else would be involved in this decision?",
        "What sparked your interest in our solution?",
        "What problems are you currently facing?",
        "What's your ideal timeline for getting started?"
      ],
      MEDDIC: [
        "What metrics are you looking to improve?",
        "Who has the final say on this purchase?",
        "What criteria will you use to evaluate solutions?",
        "What's your typical decision-making process?",
        "What's the impact of not solving this problem?",
        "Who would champion this internally?"
      ]
    };

    // Use AI to personalize questions based on context
    try {
      const personalizedQuestions = await aiService.personalizeQuestions(
        baseQuestions[framework],
        leadData,
        businessContext
      );
      return personalizedQuestions;
    } catch (error) {
      logger.error('Error personalizing questions:', error);
      return baseQuestions[framework];
    }
  }

  async enrichLeadData(leadData) {
    try {
      // This would integrate with data enrichment services
      // For now, return mock enrichment
      return {
        companyInfo: {
          size: '50-200 employees',
          industry: 'Technology',
          revenue: '$10M-$50M'
        },
        socialProfiles: {
          linkedin: leadData.linkedin,
          twitter: leadData.twitter
        },
        technographics: ['Salesforce', 'HubSpot', 'Slack']
      };
    } catch (error) {
      logger.error('Error enriching lead data:', error);
      return null;
    }
  }

  determineConversationGoal(leadData, businessContext) {
    if (businessContext.urgency === 'high') {
      return 'Schedule immediate demo or consultation';
    }
    
    if (leadData.source === 'pricing_page') {
      return 'Understand budget and timeline, offer custom pricing if qualified';
    }
    
    if (leadData.source === 'demo_request') {
      return 'Qualify need and authority, schedule demo with appropriate team member';
    }
    
    return 'Understand needs, qualify interest level, and determine next steps';
  }

  assessUrgency(leadData) {
    const urgencyIndicators = {
      high: ['urgent', 'asap', 'immediately', 'today', 'now'],
      medium: ['soon', 'this week', 'this month', 'quickly'],
      low: ['exploring', 'researching', 'considering', 'future']
    };

    const message = (leadData.message || '').toLowerCase();
    
    for (const [level, keywords] of Object.entries(urgencyIndicators)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return level;
      }
    }
    
    return 'medium';
  }

  inferProductInterest(leadData) {
    // Infer from the page they came from or form fields
    if (leadData.source?.includes('pricing')) return 'pricing_inquiry';
    if (leadData.source?.includes('demo')) return 'demo_request';
    if (leadData.source?.includes('contact')) return 'general_inquiry';
    return 'unknown';
  }

  getDefaultContext() {
    return {
      framework: 'BANT',
      qualificationCriteria: this.qualificationFrameworks.BANT,
      questions: [
        "How can I help you today?",
        "What brings you to our solution?",
        "What are your main challenges?",
        "What's your timeline for implementing a solution?"
      ],
      businessContext: {},
      conversationGoal: 'Understand needs and qualify interest'
    };
  }

  async scoreQualification(leadId, responses) {
    try {
      const score = await aiService.analyzeQualificationResponses(responses);
      
      return {
        score: score.overall, // 0-100
        breakdown: score.criteria,
        recommendation: this.getRecommendation(score.overall),
        nextSteps: this.determineNextSteps(score)
      };
    } catch (error) {
      logger.error('Error scoring qualification:', error);
      throw error;
    }
  }

  getRecommendation(score) {
    if (score >= 80) return 'HOT_LEAD';
    if (score >= 60) return 'QUALIFIED';
    if (score >= 40) return 'NURTURE';
    return 'NOT_QUALIFIED';
  }

  determineNextSteps(score) {
    const steps = [];
    
    if (score.overall >= 60) {
      steps.push('Schedule demo or consultation');
      steps.push('Send personalized proposal');
    } else if (score.overall >= 40) {
      steps.push('Add to nurture campaign');
      steps.push('Schedule follow-up in 2 weeks');
    } else {
      steps.push('Send educational content');
      steps.push('Check back in 3-6 months');
    }
    
    return steps;
  }
}

export default new LeadQualificationService();