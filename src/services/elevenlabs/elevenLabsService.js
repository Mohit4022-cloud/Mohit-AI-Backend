import axios from 'axios';
import WebSocket from 'ws';
import { logger } from '../../utils/logger.js';

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.agentId = process.env.ELEVENLABS_AGENT_ID;
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async getSignedUrl() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/conversation/get-signed-url`,
        {
          params: { agent_id: this.agentId },
          headers: { 'xi-api-key': this.apiKey }
        }
      );
      
      return response.data.signed_url;
    } catch (error) {
      logger.error('Failed to get ElevenLabs signed URL:', error);
      throw error;
    }
  }

  async createConversation(leadData, context) {
    try {
      const signedUrl = await this.getSignedUrl();
      
      const conversationData = {
        agent_id: this.agentId,
        context: {
          lead_name: leadData.name,
          company: leadData.company,
          source: leadData.source,
          qualification_criteria: context.qualificationCriteria,
          business_context: context.businessContext,
          conversation_goal: context.conversationGoal
        },
        metadata: {
          lead_id: leadData.id,
          timestamp: new Date().toISOString()
        }
      };

      return {
        url: signedUrl,
        data: conversationData
      };
    } catch (error) {
      logger.error('Failed to create ElevenLabs conversation:', error);
      throw error;
    }
  }

  createWebSocketRelay(twilioWs, elevenLabsUrl) {
    const elevenLabsWs = new WebSocket(elevenLabsUrl);
    
    elevenLabsWs.on('open', () => {
      logger.info('Connected to ElevenLabs WebSocket');
    });

    elevenLabsWs.on('message', (data) => {
      // Relay audio from ElevenLabs to Twilio
      if (twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(data);
      }
    });

    elevenLabsWs.on('error', (error) => {
      logger.error('ElevenLabs WebSocket error:', error);
    });

    elevenLabsWs.on('close', () => {
      logger.info('ElevenLabs WebSocket closed');
    });

    // Relay audio from Twilio to ElevenLabs
    twilioWs.on('message', (data) => {
      if (elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(data);
      }
    });

    return { twilioWs, elevenLabsWs };
  }

  async generateVoiceResponse(text, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            ...options.voiceSettings
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'stream'
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to generate voice response:', error);
      throw error;
    }
  }

  async getVoices() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices`,
        {
          headers: { 'xi-api-key': this.apiKey }
        }
      );

      return response.data.voices;
    } catch (error) {
      logger.error('Failed to get voices:', error);
      throw error;
    }
  }
}

export default new ElevenLabsService();