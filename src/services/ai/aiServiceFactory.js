import { logger } from '../../utils/logger.js';
import { openaiService } from './openaiService.js';
import { googleAIService } from './googleAIService.js';

class AIServiceFactory {
  constructor() {
    this.providers = {
      openai: openaiService,
      google: googleAIService,
    };
    
    this.defaultProvider = process.env.AI_PROVIDER || 'openai';
    this.fallbackProvider = 'google'; // Fallback if default fails
  }

  /**
   * Get AI service provider
   */
  getProvider(providerName = null) {
    const provider = providerName || this.defaultProvider;
    
    if (!this.providers[provider]) {
      logger.error(`Unknown AI provider: ${provider}`);
      throw new Error(`Unknown AI provider: ${provider}`);
    }
    
    return this.providers[provider];
  }

  /**
   * Execute AI operation with fallback
   */
  async executeWithFallback(operation, ...args) {
    const providers = [this.defaultProvider];
    
    // Add fallback provider if different from default
    if (this.fallbackProvider !== this.defaultProvider) {
      providers.push(this.fallbackProvider);
    }
    
    for (const providerName of providers) {
      try {
        const provider = this.getProvider(providerName);
        logger.info(`Executing AI operation with provider: ${providerName}`);
        
        const result = await provider[operation](...args);
        logger.info(`AI operation successful with provider: ${providerName}`);
        
        return result;
      } catch (error) {
        logger.error(`AI operation failed with provider ${providerName}:`, error);
        
        // Continue to next provider if available
        continue;
      }
    }
    
    // All providers failed
    throw new Error(`AI operation failed with all providers`);
  }

  /**
   * Analyze transcript
   */
  async analyzeTranscript(transcript, options = {}) {
    return this.executeWithFallback('analyzeTranscript', transcript, options);
  }

  /**
   * Generate AI response
   */
  async generateAIResponse(context, options = {}) {
    return this.executeWithFallback('generateAIResponse', context, options);
  }

  /**
   * Extract keywords
   */
  async extractKeywords(text, options = {}) {
    return this.executeWithFallback('extractKeywords', text, options);
  }

  /**
   * Detect sentiment
   */
  async detectSentiment(text, options = {}) {
    return this.executeWithFallback('detectSentiment', text, options);
  }

  /**
   * Generate call summary
   */
  async generateCallSummary(transcript, options = {}) {
    return this.executeWithFallback('generateCallSummary', transcript, options);
  }

  /**
   * Suggest talking points
   */
  async suggestTalkingPoints(context, options = {}) {
    return this.executeWithFallback('suggestTalkingPoints', context, options);
  }

  /**
   * Detect competitors
   */
  async detectCompetitors(text, options = {}) {
    return this.executeWithFallback('detectCompetitors', text, options);
  }

  /**
   * Validate all API keys
   */
  async validateAllProviders() {
    const results = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        results[name] = await provider.validateApiKey();
      } catch (error) {
        logger.error(`Failed to validate ${name} provider:`, error);
        results[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Get provider health status
   */
  async getProviderHealth() {
    const health = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        const isValid = await provider.validateApiKey();
        health[name] = {
          status: isValid ? 'healthy' : 'unhealthy',
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        health[name] = {
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString(),
        };
      }
    }
    
    return {
      defaultProvider: this.defaultProvider,
      fallbackProvider: this.fallbackProvider,
      providers: health,
    };
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Set default provider
   */
  setDefaultProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown AI provider: ${providerName}`);
    }
    
    this.defaultProvider = providerName;
    logger.info(`Default AI provider set to: ${providerName}`);
  }

  /**
   * Set fallback provider
   */
  setFallbackProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown AI provider: ${providerName}`);
    }
    
    this.fallbackProvider = providerName;
    logger.info(`Fallback AI provider set to: ${providerName}`);
  }

  /**
   * Add new provider
   */
  addProvider(name, provider) {
    this.providers[name] = provider;
    logger.info(`Added new AI provider: ${name}`);
  }

  /**
   * Remove provider
   */
  removeProvider(name) {
    if (name === this.defaultProvider) {
      throw new Error(`Cannot remove default provider: ${name}`);
    }
    
    if (name === this.fallbackProvider) {
      throw new Error(`Cannot remove fallback provider: ${name}`);
    }
    
    delete this.providers[name];
    logger.info(`Removed AI provider: ${name}`);
  }
}

export const aiServiceFactory = new AIServiceFactory();
export default aiServiceFactory;