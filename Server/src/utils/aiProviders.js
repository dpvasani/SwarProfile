/**
 * AI Provider Layer - Pluggable Strategy Pattern
 * Step 4: AI Provider Layer with fallback order
 */

import dotenv from 'dotenv';
dotenv.config();

class AIProviders {
  constructor() {
    this.providers = {
      gemini: {
        id: "gemini",
        models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
        strengths: "cheap, fast, multimodal",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/models",
        apiKey: process.env.GEMINI_API_KEY
      },
      perplexity: {
        id: "perplexity",
        models: ["llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-online"],
        strengths: "real-time web data, citations",
        baseURL: "https://api.perplexity.ai/chat/completions",
        apiKey: process.env.PERPLEXITY_API_KEY
      }
    };

    // Provider selection logic
    this.structuredModeProviders = ['gemini', 'perplexity'];
    this.summaryModeProviders = ['gemini', 'perplexity'];
  }

  /**
   * Get available providers for a specific mode
   */
  getProvidersForMode(mode) {
    const providerList = mode === 'structured' ? this.structuredModeProviders : this.summaryModeProviders;
    return providerList
      .map(id => this.providers[id])
      .filter(provider => provider.apiKey); // Only return providers with API keys
  }

  /**
   * Call AI provider with fallback logic
   */
  async callWithFallback(mode, prompt, options = {}) {
    const providers = this.getProvidersForMode(mode);
    
    if (providers.length === 0) {
      throw new Error(`No API keys configured for ${mode} mode`);
    }

    let lastError = null;

    for (const provider of providers) {
      try {
        console.log(`🤖 Trying ${provider.id} for ${mode} mode...`);
        const result = await this.callProvider(provider, prompt, options);
        
        if (result && result.trim().length > 0) {
          console.log(`✅ ${provider.id} succeeded for ${mode} mode`);
          return {
            result: result.trim(),
            provider: provider.id,
            model: options.model || provider.models[0]
          };
        }
      } catch (error) {
        console.warn(`⚠️ ${provider.id} failed:`, error.message);
        lastError = error;
        continue; // Try next provider
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Call specific AI provider
   */
  async callProvider(provider, prompt, options = {}) {
    const model = options.model || provider.models[0];
    
    switch (provider.id) {
      case 'gemini':
        return await this.callGemini(provider, model, prompt, options);
      case 'perplexity':
        return await this.callPerplexity(provider, model, prompt, options);
      default:
        throw new Error(`Unknown provider: ${provider.id}`);
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(provider, model, prompt, options = {}) {
    const url = `${provider.baseURL}/${model}:generateContent?key=${provider.apiKey}`;
    
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.2,
        maxOutputTokens: options.maxTokens || 1024,
        topP: options.topP || 0.8,
        topK: options.topK || 40
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text content in Gemini response');
    }

    return text;
  }

  /**
   * Call Perplexity API
   */
  async callPerplexity(provider, model, prompt, options = {}) {
    const body = {
      model: model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 1024,
      top_p: options.topP || 0.8
    };

    const response = await fetch(provider.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract text from Perplexity response
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('No text content in Perplexity response');
    }

    return text;
  }

  /**
   * Test provider connectivity
   */
  async testProvider(providerId) {
    const provider = this.providers[providerId];
    if (!provider || !provider.apiKey) {
      return { success: false, error: 'Provider not configured or missing API key' };
    }

    try {
      const result = await this.callProvider(provider, "Say 'Hello' in one word.", { maxTokens: 10 });
      return { success: true, result: result.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus() {
    const status = {};
    
    for (const [id, provider] of Object.entries(this.providers)) {
      status[id] = {
        configured: !!provider.apiKey,
        models: provider.models,
        strengths: provider.strengths
      };
    }
    
    return status;
  }
}

export default AIProviders;