/**
 * AI Enhancement Service - Optimized Workflow Implementation
 * Step 3: Dual-Mode Enhancement (Structured + Summary)
 */

import AIProviders from './aiProviders.js';
import { ApiError } from './ApiError.js';

class AIEnhancer {
  constructor() {
    this.aiProviders = new AIProviders();
    console.log('🤖 AIEnhancer initialized with optimized workflow');
  }

  /**
   * Step 3 - Mode 1: Structured Mode
   * Purpose: Guaranteed structured JSON for search/filters
   */
  async enhanceStructured(cleanedExtractedData, rawText) {
    try {
      console.log('🔧 Starting structured enhancement...');
      
      const prompt = this.createStructuredPrompt(cleanedExtractedData, rawText);
      
      try {
        const aiResponse = await this.aiProviders.callWithFallback('structured', prompt, {
          temperature: 0.1, // Low temperature for structured output
          maxTokens: 1024
        });

        // Parse AI response as JSON
        const enhancedData = this.parseStructuredResponse(aiResponse.result);
        
        console.log(`✅ Structured enhancement completed using ${aiResponse.provider}`);
        return {
          ...enhancedData,
          _metadata: {
            provider: aiResponse.provider,
            model: aiResponse.model,
            mode: 'structured'
          }
        };
      } catch (aiError) {
        console.warn('⚠️ AI structured enhancement failed, using deterministic fallback:', aiError.message);
        return this.deterministicFallback(cleanedExtractedData);
      }
    } catch (error) {
      console.error('❌ Structured enhancement error:', error);
      return this.deterministicFallback(cleanedExtractedData);
    }
  }

  /**
   * Step 3 - Mode 2: Summary Mode
   * Purpose: Rich narrative for profile pages
   */
  async enhanceSummary(cleanedExtractedData, rawText) {
    try {
      console.log('📝 Starting summary enhancement...');
      
      const prompt = this.createSummaryPrompt(cleanedExtractedData, rawText);
      
      try {
        const aiResponse = await this.aiProviders.callWithFallback('summary', prompt, {
          temperature: 0.3, // Higher temperature for creative writing
          maxTokens: 1024
        });

        const summaryData = this.parseSummaryResponse(aiResponse.result);
        
        console.log(`✅ Summary enhancement completed using ${aiResponse.provider}`);
        return {
          ...summaryData,
          _metadata: {
            provider: aiResponse.provider,
            model: aiResponse.model,
            mode: 'summary'
          }
        };
      } catch (aiError) {
        console.warn('⚠️ AI summary enhancement failed, using basic fallback:', aiError.message);
        return this.basicSummaryFallback(cleanedExtractedData);
      }
    } catch (error) {
      console.error('❌ Summary enhancement error:', error);
      return this.basicSummaryFallback(cleanedExtractedData);
    }
  }

  /**
   * Create structured enhancement prompt
   */
  createStructuredPrompt(cleanedData, rawText) {
    return `Extract and enhance the following artist information into clean, structured JSON format.

INPUT DATA:
${JSON.stringify(cleanedData, null, 2)}

RAW TEXT:
${rawText.substring(0, 2000)}...

INSTRUCTIONS:
1. Clean and format all names properly (proper capitalization, titles like "Ustad", "Pandit")
2. Standardize phone numbers and email addresses
3. Write a concise, professional biography
4. Return ONLY valid JSON in this exact format:

{
  "artistName": "properly formatted name",
  "guruName": "properly formatted guru name with title",
  "gharana": "gharana name without 'gharana' suffix",
  "biography": "2-3 sentence professional biography",
  "contactDetails": {
    "phone": "standardized phone format",
    "email": "lowercase email",
    "address": "properly formatted address"
  }
}

Return only the JSON, no additional text.`;
  }

  /**
   * Create summary enhancement prompt
   */
  createSummaryPrompt(cleanedData, rawText) {
    const { artistName, guruName, gharana } = cleanedData;
    
    return `Write a comprehensive profile for this classical music artist.

ARTIST DETAILS:
- Name: ${artistName || 'Not specified'}
- Guru: ${guruName || 'Not specified'}
- Gharana: ${gharana || 'Not specified'}

RAW INFORMATION:
${rawText.substring(0, 1500)}...

Create a professional artist profile with:
1. A detailed biography (2-3 paragraphs about their background, training, and achievements)
2. A brief description (1 paragraph summary of their style and contributions)
3. A concise summary (2-3 sentences for quick overview)

Format as JSON:
{
  "biography": "detailed 2-3 paragraph biography",
  "description": "1 paragraph description",
  "summary": "2-3 sentence summary"
}

Focus on their classical music training, artistic contributions, and cultural significance.
Return only the JSON, no additional text.`;
  }

  /**
   * Parse structured AI response
   */
  parseStructuredResponse(response) {
    try {
      // Clean response - remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required structure
      if (!parsed.artistName && !parsed.guruName && !parsed.gharana) {
        throw new Error('Invalid structured response - missing key fields');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse structured AI response:', error);
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Parse summary AI response
   */
  parseSummaryResponse(response) {
    try {
      // Clean response - remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      // Validate summary structure
      if (!parsed.biography && !parsed.description && !parsed.summary) {
        throw new Error('Invalid summary response - missing content');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse summary AI response:', error);
      // If JSON parsing fails, treat as plain text
      return {
        biography: response,
        description: response.substring(0, 300) + '...',
        summary: response.substring(0, 150) + '...'
      };
    }
  }

  /**
   * Deterministic fallback for structured mode
   */
  deterministicFallback(cleanedData) {
    return {
      artistName: this.formatName(cleanedData.artistName),
      guruName: this.formatGuruName(cleanedData.guruName),
      gharana: this.formatGharana(cleanedData.gharana),
      biography: this.formatBiography(cleanedData.biography),
      contactDetails: {
        phone: this.formatPhone(cleanedData.contactDetails?.phone),
        email: this.formatEmail(cleanedData.contactDetails?.email),
        address: this.formatAddress(cleanedData.contactDetails?.address)
      },
      _metadata: {
        provider: 'deterministic',
        mode: 'structured'
      }
    };
  }

  /**
   * Basic summary fallback
   */
  basicSummaryFallback(cleanedData) {
    const { artistName, guruName, gharana, biography } = cleanedData;
    
    let summaryText = '';
    if (artistName) summaryText += `${artistName} is a classical music artist`;
    if (gharana) summaryText += ` from the ${gharana} gharana`;
    if (guruName) summaryText += ` trained under ${guruName}`;
    summaryText += '.';
    
    return {
      biography: biography || summaryText,
      description: summaryText,
      summary: summaryText,
      _metadata: {
        provider: 'basic',
        mode: 'summary'
      }
    };
  }

  /**
   * Enhanced field processing (for individual field enhancement)
   */
  async enhanceField(fieldName, fieldValue, context = {}) {
    if (!fieldValue || typeof fieldValue !== 'string') {
      return fieldValue;
    }

    try {
      const prompt = this.createFieldPrompt(fieldName, fieldValue, context);
      
      const aiResponse = await this.aiProviders.callWithFallback('structured', prompt, {
        temperature: 0.1,
        maxTokens: 200
      });

      console.log(`✅ Field '${fieldName}' enhanced using ${aiResponse.provider}`);
      return aiResponse.result.trim();
    } catch (error) {
      console.warn(`⚠️ Field enhancement failed for '${fieldName}', using deterministic:`, error.message);
      return this.getDeterministicFieldEnhancement(fieldName, fieldValue);
    }
  }

  /**
   * Create field-specific enhancement prompt
   */
  createFieldPrompt(fieldName, fieldValue, context) {
    const prompts = {
      artistName: `Clean and format this artist name: "${fieldValue}"\nRules: Proper capitalization, add titles like "Ustad" or "Pandit" if appropriate.\nReturn only the cleaned name.`,
      
      guruName: `Clean and format this guru name: "${fieldValue}"\nRules: Proper capitalization, add "Pandit" or "Ustad" title if missing.\nReturn only the cleaned name.`,
      
      gharana: `Clean this gharana name: "${fieldValue}"\nRules: Proper capitalization, remove "gharana" suffix if present.\nReturn only the gharana name.`,
      
      biography: `Improve this biography: "${fieldValue}"\nRules: Fix grammar, improve structure, keep same information.\nReturn only the improved text.`,
      
      description: `Improve this description: "${fieldValue}"\nRules: Fix grammar, improve structure, keep same information.\nReturn only the improved text.`
    };

    return prompts[fieldName] || `Clean and format: "${fieldValue}"\nReturn only the cleaned text.`;
  }

  /**
   * Get deterministic field enhancement
   */
  getDeterministicFieldEnhancement(fieldName, fieldValue) {
    switch (fieldName) {
      case 'artistName':
      case 'guruName':
        return this.formatName(fieldValue);
      case 'gharana':
        return this.formatGharana(fieldValue);
      case 'biography':
      case 'description':
        return this.formatText(fieldValue);
      default:
        return fieldValue;
    }
  }

  // Deterministic formatting methods
  formatName(name) {
    if (!name) return null;
    return name.split(' ')
      .map(word => {
        if (word.toLowerCase() === 'ustd') return 'Ustad';
        if (word.toLowerCase() === 'pt') return 'Pandit';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  formatGuruName(name) {
    if (!name) return null;
    const formatted = this.formatName(name);
    if (!formatted.match(/^(Ustad|Pandit|Guru)/i)) {
      return `Pandit ${formatted}`;
    }
    return formatted;
  }

  formatGharana(gharana) {
    if (!gharana) return null;
    return gharana.replace(/gharana/gi, '').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatBiography(bio) {
    if (!bio) return null;
    return bio.replace(/\s+/g, ' ').trim()
      .replace(/([.!?])\s*([a-z])/g, (match, punct, letter) => punct + ' ' + letter.toUpperCase())
      .replace(/^\w/, c => c.toUpperCase());
  }

  formatText(text) {
    if (!text) return null;
    return text.replace(/\s+/g, ' ').trim();
  }

  formatPhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91 ${digits}`;
    }
    return phone;
  }

  formatEmail(email) {
    if (!email) return null;
    return email.toLowerCase().trim();
  }

  formatAddress(address) {
    if (!address) return null;
    return address.replace(/\s+/g, ' ').trim();
  }

  /**
   * Get AI provider status for debugging
   */
  async getProviderStatus() {
    return this.aiProviders.getProviderStatus();
  }

  /**
   * Test AI providers
   */
  async testProviders() {
    const results = {};
    const providers = ['gemini', 'perplexity'];
    
    for (const providerId of providers) {
      results[providerId] = await this.aiProviders.testProvider(providerId);
    }
    
    return results;
  }
}

export default AIEnhancer;