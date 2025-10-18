import { logger } from '../../utils/logger.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

class GoogleAIService {
  constructor() {
    this.apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.defaultModel = 'gemini-1.5-pro';
    this.defaultTemperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    this.defaultMaxTokens = parseInt(process.env.AI_MAX_TOKENS) || 150;
  }

  /**
   * Analyze call transcript for insights
   */
  async analyzeTranscript(transcript, options = {}) {
    try {
      const { model = this.defaultModel, temperature = this.defaultTemperature } = options;
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
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

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 2000,
        },
      });

      const response = result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Error analyzing transcript with Google AI:', error);
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
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
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

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const response = result.response;
      return response.text().trim();
    } catch (error) {
      logger.error('Error generating AI response with Google AI:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Extract keywords from text
   */
  async extractKeywords(text, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.3 } = options;
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
      const prompt = `
Extract the most important keywords from the following text. Return them as a JSON array of strings.

TEXT:
${text}

KEYWORDS (JSON array):
`;

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 200,
        },
      });

      const response = result.response;
      const textResult = response.text();
      
      // Extract JSON from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }
      
      const resultObj = JSON.parse(jsonMatch[0]);
      return resultObj.keywords || [];
    } catch (error) {
      logger.error('Error extracting keywords with Google AI:', error);
      throw new Error('Failed to extract keywords');
    }
  }

  /**
   * Detect sentiment
   */
  async detectSentiment(text, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.1 } = options;
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
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

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 300,
        },
      });

      const response = result.response;
      const textResult = response.text();
      
      // Extract JSON from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Error detecting sentiment with Google AI:', error);
      throw new Error('Failed to detect sentiment');
    }
  }

  /**
   * Generate call summary
   */
  async generateCallSummary(transcript, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.5 } = options;
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
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

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 500,
        },
      });

      const response = result.response;
      return response.text().trim();
    } catch (error) {
      logger.error('Error generating call summary with Google AI:', error);
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
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
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

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 400,
        },
      });

      const response = result.response;
      const textResult = response.text();
      
      // Extract JSON from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }
      
      const resultObj = JSON.parse(jsonMatch[0]);
      return resultObj.talkingPoints || [];
    } catch (error) {
      logger.error('Error suggesting talking points with Google AI:', error);
      throw new Error('Failed to suggest talking points');
    }
  }

  /**
   * Detect competitors mentioned
   */
  async detectCompetitors(text, options = {}) {
    try {
      const { model = this.defaultModel, temperature = 0.2 } = options;
      
      const genModel = this.genAI.getGenerativeModel({ model });
      
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

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 300,
        },
      });

      const response = result.response;
      const textResult = response.text();
      
      // Extract JSON from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }
      
      const resultObj = JSON.parse(jsonMatch[0]);
      return resultObj.competitors || [];
    } catch (error) {
      logger.error('Error detecting competitors with Google AI:', error);
      throw new Error('Failed to detect competitors');
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey() {
    try {
      const genModel = this.genAI.getGenerativeModel({ model: this.defaultModel });
      await genModel.generateContent('Test');
      return true;
    } catch (error) {
      logger.error('Google AI API key validation failed:', error);
      return false;
    }
  }
}

export const googleAIService = new GoogleAIService();
export default googleAIService;