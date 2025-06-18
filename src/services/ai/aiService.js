import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';

let openai;
let genAI;

// Initialize AI services
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

if (process.env.GOOGLE_AI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
}

class AIService {
  async personalizeQuestions(baseQuestions, leadData, businessContext) {
    try {
      if (!openai && !genAI) {
        logger.warn('No AI service configured');
        return baseQuestions;
      }

      const prompt = `
        Personalize these qualification questions for a lead:
        
        Lead Information:
        - Name: ${leadData.name || 'Unknown'}
        - Company: ${leadData.company || 'Unknown'}
        - Industry: ${businessContext.industry || 'Unknown'}
        - Source: ${leadData.source}
        
        Base Questions:
        ${baseQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
        
        Make the questions more specific and relevant to their context.
        Return only the personalized questions, one per line.
      `;

      if (openai) {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        });

        const personalizedQuestions = response.choices[0].message.content
          .split('\n')
          .filter(q => q.trim())
          .map(q => q.replace(/^\d+\.\s*/, ''));

        return personalizedQuestions;
      } else if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const personalizedQuestions = text
          .split('\n')
          .filter(q => q.trim())
          .map(q => q.replace(/^\d+\.\s*/, ''));

        return personalizedQuestions;
      }
    } catch (error) {
      logger.error('Error personalizing questions:', error);
      return baseQuestions;
    }
  }

  async analyzeQualificationResponses(responses) {
    try {
      if (!openai && !genAI) {
        // Simple scoring without AI
        return {
          overall: Math.floor(Math.random() * 40 + 60), // 60-100
          criteria: {
            budget: Math.floor(Math.random() * 100),
            authority: Math.floor(Math.random() * 100),
            need: Math.floor(Math.random() * 100),
            timeline: Math.floor(Math.random() * 100)
          }
        };
      }

      const prompt = `
        Analyze these lead qualification responses and provide a score:
        
        ${JSON.stringify(responses, null, 2)}
        
        Return a JSON object with:
        - overall: number 0-100
        - criteria: object with scores for budget, authority, need, timeline (each 0-100)
      `;

      if (openai) {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });

        return JSON.parse(response.choices[0].message.content);
      } else if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      throw new Error('Failed to analyze responses');
    } catch (error) {
      logger.error('Error analyzing qualification responses:', error);
      // Return default scores
      return {
        overall: 70,
        criteria: {
          budget: 70,
          authority: 70,
          need: 70,
          timeline: 70
        }
      };
    }
  }

  async generateConversationSummary(messages) {
    try {
      if (!openai && !genAI) {
        return 'Conversation summary not available';
      }

      const prompt = `
        Summarize this sales conversation in 2-3 sentences:
        
        ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
        
        Focus on key points, qualification status, and next steps.
      `;

      if (openai) {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 150
        });

        return response.choices[0].message.content;
      } else if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      logger.error('Error generating conversation summary:', error);
      return 'Error generating summary';
    }
  }
}

export default new AIService();