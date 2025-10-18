import { logger } from '../../utils/logger.js';
import axios from 'axios';

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseURL = 'https://api.elevenlabs.io/v1';
    this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || 'rachel';
    this.defaultModelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';
    this.defaultOutputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'ulaw_8000';
    this.defaultLatencyOptimization = process.env.ELEVENLABS_OPTIMIZE_STREAMING_LATENCY || '3';
  }

  /**
   * Get available voices
   */
  async getAvailableVoices() {
    try {
      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        previewUrl: voice.preview_url,
        gender: voice.gender,
        age: voice.age,
        useCase: voice.use_case,
        accent: voice.accent,
      }));
    } catch (error) {
      logger.error('Error fetching ElevenLabs voices:', error);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Get voice settings
   */
  async getVoiceSettings(voiceId) {
    try {
      const response = await axios.get(`${this.baseURL}/voices/${voiceId}/settings`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching voice settings for ${voiceId}:`, error);
      throw new Error('Failed to fetch voice settings');
    }
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(text, options = {}) {
    try {
      const {
        voiceId = this.defaultVoiceId,
        modelId = this.defaultModelId,
        outputFormat = this.defaultOutputFormat,
        optimizeStreamingLatency = this.defaultLatencyOptimization,
        voiceSettings = {},
      } = options;

      const response = await axios.post(
        `${this.baseURL}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: modelId,
          output_format: outputFormat,
          optimize_streaming_latency: parseInt(optimizeStreamingLatency),
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            ...voiceSettings,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error converting text to speech:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Stream text to speech
   */
  async streamTextToSpeech(text, options = {}) {
    try {
      const {
        voiceId = this.defaultVoiceId,
        modelId = this.defaultModelId,
        outputFormat = this.defaultOutputFormat,
        optimizeStreamingLatency = this.defaultLatencyOptimization,
        voiceSettings = {},
      } = options;

      const response = await axios.post(
        `${this.baseURL}/text-to-speech/${voiceId}/stream`,
        {
          text,
          model_id: modelId,
          output_format: outputFormat,
          optimize_streaming_latency: parseInt(optimizeStreamingLatency),
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            ...voiceSettings,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error streaming text to speech:', error);
      throw new Error('Failed to stream text to speech');
    }
  }

  /**
   * Get user info
   */
  async getUserInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching ElevenLabs user info:', error);
      throw new Error('Failed to fetch user info');
    }
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/user/subscription`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching ElevenLabs subscription info:', error);
      throw new Error('Failed to fetch subscription info');
    }
  }

  /**
   * Delete voice file
   */
  async deleteVoiceFile(voiceId, historyItemId) {
    try {
      const response = await axios.delete(
        `${this.baseURL}/voices/${voiceId}/history/${historyItemId}`,
        {
          headers: {
            'xi-api-key': this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error deleting ElevenLabs voice file:', error);
      throw new Error('Failed to delete voice file');
    }
  }

  /**
   * Get voice history
   */
  async getVoiceHistory(voiceId) {
    try {
      const response = await axios.get(`${this.baseURL}/voices/${voiceId}/history`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data.history;
    } catch (error) {
      logger.error('Error fetching ElevenLabs voice history:', error);
      throw new Error('Failed to fetch voice history');
    }
  }

  /**
   * Test voice with sample text
   */
  async testVoice(voiceId, text = 'Hello, this is a test of the Mohit AI voice system.') {
    try {
      const audioBuffer = await this.textToSpeech(text, { voiceId });
      
      // Convert to base64 for JSON response
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      return {
        voiceId,
        text,
        audioData: base64Audio,
        mimeType: 'audio/basic', // ulaw_8000 format
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error testing voice:', error);
      throw new Error('Failed to test voice');
    }
  }

  /**
   * Get voice models
   */
  async getVoiceModels() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching ElevenLabs voice models:', error);
      throw new Error('Failed to fetch voice models');
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey() {
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      logger.error('ElevenLabs API key validation failed:', error);
      return false;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
export default elevenLabsService;