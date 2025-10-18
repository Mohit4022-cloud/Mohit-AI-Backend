import { logger } from '../../utils/logger.js';
import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4';
    this.defaultTemperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
    this.defaultMaxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150;
  }

  /**
   * Analyze call transcript for insights
   */
  async analyzeTranscript(transcript, options = {}) {
    try {
      const { model = this.defaultModel, temperature = this.defaultTemperature } = options;
      
      const prompt = `
Analyze the following call transcript and provide insights:

TRANSCRIPT:
${transcript}

Please provide the following analysis in JSON format:
{
  "sentiment": {
    "overall": "positive/neutral/negative",
    "score": 0-100,
    "confidence": 0-1
  },
  "topics": [
    {
      "topic": "string",
      "confidence": 0-1,
      "mentions": number
    }
  ],
  "competitors": [
    {
      "name": "string",
      "context": "string",
      "sentiment": "positive/neutral/negative"
    }
  ],
  "actionItems": [
    {
      "action": "string",
      "assignee": "AI/USER",
      "priority": "high/medium/low",
      "dueDate": "ISO string"
    }
  ],
  "objections": [
    {
      "objection": "string",
      "severity": "high/medium/low",
      "response": "suggested response"
    }
  ],
  "qualificationScore": 0-100,
  "nextSteps": [
    "string"
  ],
  "summary": "Brief summary of the call",
  "keyMoments": [
    {
      "timestamp": "string",
      "moment": "string",
      "importance": "high/medium/low"
    }
  ]
}
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales call analyst. Provide detailed, accurate insights in the requested JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing transcript:', error);
      throw new Error('Failed to analyze transcript');
    }
  }

  /**
   * Generate AI response for call
   */
  async generateAIResponse(context, options = {}) {
    try {
      const { 
        model = this.defaultModel, 
        temperature = this.defaultTemperature,
        maxTokens = this.defaultMaxTokens 
      } = options;
      
      const { transcript, lastUserMessage, aiSettings, callHistory } = context;
      
      const prompt = `
You are an AI sales assistant for Mohit AI. Based on the following context, generate an appropriate response:

CURRENT TRANSCRIPT:
${transcript}

LAST USER MESSAGE:
"${lastUserMessage}"

AI SETTINGS:
- Response Speed: ${aiSettings?.responseSpeed || 5}/10
- Formality Level: ${aiSettings?.formalityLevel || 5}/10
- Empathy Level: ${aiSettings?.empathyLevel || 5}/10
- Technical Detail: ${aiSettings?.technicalDetail || 5}/10

RECENT CALL HISTORY:
${callHistory?.slice(-3).map(entry => `${entry.speaker}: ${entry.text}`).join('\n') || 'No recent history'}

Generate a response that:
1. Addresses the user's message directly
2. Maintains appropriate tone based on settings
3. Moves the conversation forward
4. Is concise and natural
5. Avoids overly salesy language

Response (plain text, no formatting):
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI sales assistant. Be helpful, natural, and conversational. Never explicitly mention you are an AI.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Extract keywords from text
   */
  async extractKeywords(text, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.3 } = options;
      
      const prompt = `
Extract the most important keywords from the following text. Return them as a JSON array of strings.

TEXT:
${text}

KEYWORDS (JSON array):
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a keyword extraction expert. Extract the most relevant keywords from the given text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.keywords || [];
    } catch (error) {
      logger.error('Error extracting keywords:', error);
      throw new Error('Failed to extract keywords');
    }
  }

  /**
   * Detect sentiment
   */
  async detectSentiment(text, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.1 } = options;
      
      const prompt = `
Analyze the sentiment of the following text. Return a JSON object with the sentiment analysis.

TEXT:
${text}

ANALYSIS (JSON format):
{
  "sentiment": "positive/neutral/negative",
  "score": 0-100,
  "confidence": 0-1,
  "emotions": ["emotion1", "emotion2"],
  "reasoning": "Brief explanation of the sentiment analysis"
}
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Provide accurate sentiment analysis in the requested JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return analysis;
    } catch (error) {
      logger.error('Error detecting sentiment:', error);
      throw new Error('Failed to detect sentiment');
    }
  }

  /**
   * Generate call summary
   */
  async generateCallSummary(transcript, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.5 } = options;
      
      const prompt = `
Generate a concise summary of the following sales call transcript:

TRANSCRIPT:
${transcript}

Provide a summary that includes:
1. Main topics discussed
2. Key outcomes
3. Next steps
4. Overall assessment

Summary (2-3 paragraphs):
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing sales calls. Create clear, concise summaries that capture the essence of the conversation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 500,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Error generating call summary:', error);
      throw new Error('Failed to generate call summary');
    }
  }

  /**
   * Suggest talking points
   */
  async suggestTalkingPoints(context, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.7 } = options;
      
      const { transcript, currentSituation, aiSettings } = context;
      
      const prompt = `
Based on the following call context, suggest 3-5 relevant talking points for the AI assistant:

CURRENT SITUATION:
${currentSituation}

RECENT TRANSCRIPT:
${transcript}

AI SETTINGS:
- Empathy Level: ${aiSettings?.empathyLevel || 5}/10
- Technical Detail: ${aiSettings?.technicalDetail || 5}/10
- Formality Level: ${aiSettings?.formalityLevel || 5}/10

Provide talking points that are:
1. Relevant to the current conversation
2. Appropriate for the AI settings
3. Helpful for moving the conversation forward
4. Natural and conversational

TALKING POINTS (JSON array of objects with "point" and "priority" fields):
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales conversation coach. Provide helpful, relevant talking points in the requested JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.talkingPoints || [];
    } catch (error) {
      logger.error('Error suggesting talking points:', error);
      throw new Error('Failed to suggest talking points');
    }
  }

  /**
   * Detect competitors mentioned
   */
  async detectCompetitors(text, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.2 } = options;
      
      const prompt = `
Identify any competitors mentioned in the following text. Return a JSON array of competitor objects.

TEXT:
${text}

COMPETITORS (JSON array):
[
  {
    "name": "competitor name",
    "context": "how they were mentioned",
    "sentiment": "positive/neutral/negative",
    "confidence": 0-1
  }
]
`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying competitor mentions in business conversations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.competitors || [];
    } catch (error) {
      logger.error('Error detecting competitors:', error);
      throw new Error('Failed to detect competitors');
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey() {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      logger.error('OpenAI API key validation failed:', error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
export default openaiService;