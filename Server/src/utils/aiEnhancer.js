import { ApiError } from './ApiError.js';
import dotenv from 'dotenv';
dotenv.config();

class AIEnhancer {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    console.log('AIEnhancer initialized with Gemini API key:', this.geminiApiKey ? 'Present' : 'Missing');
  }

  /**
   * Make API call to Gemini
   */
  async callGeminiAPI(prompt) {
    // If no Gemini key, skip external AI calls
    if (!this.geminiApiKey) {
      console.warn('No Gemini API key found, using fallback enhancement');
      return null;
    }

    // Try multiple possible Gemini/Generative Language endpoints to handle account differences
    const endpoints = [
      // Common REST endpoints
      `https://generativelanguage.googleapis.com/v1/models/text-bison-001:generate?key=${this.geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${this.geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.3:generate?key=${this.geminiApiKey}`,
      // older shape
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1:generate?key=${this.geminiApiKey}`
    ];

    for (const url of endpoints) {
      try {
        this.lastTriedGeminiUrl = url;
        // Choose request body shape based on endpoint
        let body;
        if (url.includes('text-bison')) {
          body = JSON.stringify({ prompt: { text: prompt }, temperature: 0.2, maxOutputTokens: 512 });
        } else if (url.includes('generateContent')) {
          body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
        } else {
          // generic/gemini models
          body = JSON.stringify({ prompt: { text: prompt }, temperature: 0.2, maxOutputTokens: 512 });
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });

        const raw = await res.text();
        if (!res.ok) {
          console.warn(`Gemini endpoint returned non-OK: ${res.status} ${res.statusText} - tried ${url} - body: ${raw}`);
          // try next endpoint
          continue;
        }

        // Parse and extract candidate text across response shapes
        let data;
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          // If not JSON, return raw text
          return raw || null;
        }

        // possible fields where content may appear
        const candidateText =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          data.candidates?.[0]?.content ||
          data.output?.[0]?.content ||
          data.reply?.content ||
          data.result?.content ||
          data.output?.text ||
          data.choices?.[0]?.message?.content ||
          data.choices?.[0]?.text ||
          null;

        if (candidateText) return typeof candidateText === 'string' ? candidateText : JSON.stringify(candidateText);

        // fallback: stringify full response
        return JSON.stringify(data);
      } catch (error) {
        console.error(`Gemini attempt failed for ${url}:`, error);
        // try next endpoint
      }
    }

    console.error('All Gemini endpoints failed or returned no usable content');
    return null;
  }

  /**
   * Enhance a single field with AI
   */
  async enhanceField(fieldName, fieldValue, context = {}) {
    try {
      console.log(`Enhancing field: ${fieldName} with value: ${fieldValue}`);
      
      // Create AI prompt based on field type
      let prompt = '';
      let enhanced = fieldValue.trim();

      switch (fieldName) {
        case 'artistName':
          prompt = `Clean and format this artist name properly with correct capitalization and spacing: "${fieldValue}"
          
          Rules:
          - Proper name capitalization
          - Remove extra spaces
          - Fix common OCR errors
          - Return only the cleaned name, nothing else`;
          break;
        case 'guruName':
          prompt = `Clean and format this guru/teacher name properly: "${fieldValue}"
          
          Rules:
          - Proper name capitalization
          - Add appropriate titles if missing (Pandit, Ustad, etc.)
          - Remove extra spaces
          - Return only the cleaned name, nothing else`;
          break;
        case 'gharana':
          prompt = `Clean and format this gharana name: "${fieldValue}"
          
          Rules:
          - Proper capitalization
          - Remove "gharana" suffix if present
          - Fix common spelling errors
          - Return only the gharana name, nothing else`;
          break;
        case 'biography':
        case 'description':
          prompt = `Improve and format this artist biography/description: "${fieldValue}"
          
          Rules:
          - Fix grammar and punctuation
          - Improve sentence structure
          - Remove OCR errors
          - Make it professional and readable
          - Keep the same information, just improve the writing
          - Return only the improved text, nothing else`;
          break;
        case 'contactDetails.phone':
          enhanced = this.formatPhone(fieldValue);
          return enhanced; // No AI needed for phone formatting
          break;
        case 'contactDetails.email':
          enhanced = this.formatEmail(fieldValue);
          return enhanced; // No AI needed for email formatting
          break;
        case 'contactDetails.address':
          prompt = `Clean and format this address properly: "${fieldValue}"
          
          Rules:
          - Proper capitalization
          - Fix common address formatting
          - Remove extra spaces and line breaks
          - Make it readable
          - Return only the cleaned address, nothing else`;
          break;
        default:
          enhanced = this.formatText(fieldValue);
          return enhanced; // Use basic formatting for unknown fields
      }

      // Try AI enhancement first
      if (prompt) {
        const aiResult = await this.callGeminiAPI(prompt);
        if (aiResult) {
          enhanced = aiResult.trim();
          console.log(`AI enhanced ${fieldName}:`, enhanced);
        } else {
          // Fallback to basic formatting
          enhanced = this.getBasicEnhancement(fieldName, fieldValue);
          console.log(`Using fallback enhancement for ${fieldName}:`, enhanced);
        }
      }

      return enhanced;
    } catch (error) {
      console.error('Field enhancement error:', error);
      // Fallback to basic enhancement
      return this.getBasicEnhancement(fieldName, fieldValue);
    }
  }

  /**
   * Get basic enhancement without AI
   */
  getBasicEnhancement(fieldName, fieldValue) {
    switch (fieldName) {
      case 'artistName':
      case 'guruName':
        return this.formatName(fieldValue);
      case 'gharana':
        return this.formatGharana(fieldValue);
      case 'biography':
      case 'description':
        return this.formatText(fieldValue);
      case 'contactDetails.phone':
        return this.formatPhone(fieldValue);
      case 'contactDetails.email':
        return this.formatEmail(fieldValue);
      case 'contactDetails.address':
        return this.formatAddress(fieldValue);
      default:
        return this.formatText(fieldValue);
    }
  }

  /**
   * Enhance all fields comprehensively
   */
  async enhanceAllFields(data, rawText = '') {
    try {
      console.log('Enhancing all fields with data:', data);
      const enhanced = { ...data };

      // Enhance each field
      if (enhanced.artistName) {
        enhanced.artistName = await this.enhanceField('artistName', enhanced.artistName, data);
      }
      
      if (enhanced.guruName) {
        enhanced.guruName = await this.enhanceField('guruName', enhanced.guruName, data);
      }
      
      if (enhanced.gharana) {
        enhanced.gharana = await this.enhanceField('gharana', enhanced.gharana, data);
      }
      
      if (enhanced.biography) {
        enhanced.biography = await this.enhanceField('biography', enhanced.biography, data);
      }
      
      if (enhanced.description) {
        enhanced.description = await this.enhanceField('description', enhanced.description, data);
      }

      // Enhance contact details
      if (enhanced.contactDetails) {
        if (enhanced.contactDetails.phone) {
          enhanced.contactDetails.phone = await this.enhanceField('contactDetails.phone', enhanced.contactDetails.phone, data);
        }
        if (enhanced.contactDetails.email) {
          enhanced.contactDetails.email = await this.enhanceField('contactDetails.email', enhanced.contactDetails.email, data);
        }
        if (enhanced.contactDetails.address) {
          enhanced.contactDetails.address = await this.enhanceField('contactDetails.address', enhanced.contactDetails.address, data);
        }
      }

      console.log('All fields enhanced:', enhanced);
      return enhanced;
    } catch (error) {
      console.error('Comprehensive enhancement error:', error);
      // Return original data if enhancement fails
      return data;
    }
  }

  /**
   * Generate AI-powered summary
   */
  async generateSummary({ artistName, guruName, gharana, biography }) {
    try {
      console.log('Generating summary for:', { artistName, guruName, gharana });
      
      const prompt = `Create a professional summary for this classical music artist:
      
      Artist Name: ${artistName || 'Not provided'}
      Guru Name: ${guruName || 'Not provided'}
      Gharana: ${gharana || 'Not provided'}
      Biography: ${biography || 'Not provided'}
      
      Rules:
      - Write a professional 2-3 sentence summary
      - Include their musical tradition and training
      - Make it suitable for a public artist profile
      - Focus on their classical music background
      - Return only the summary text, nothing else`;

      // Try AI generation first
      const aiSummary = await this.callGeminiAPI(prompt);
      if (aiSummary) {
        console.log('AI generated summary:', aiSummary);
        return aiSummary;
      }

      // Fallback to basic summary generation
      console.log('Using fallback summary generation');
      const parts = [];
      
      if (artistName) {
        parts.push(`${artistName} is a distinguished classical music artist`);
      }
      
      if (gharana) {
        parts.push(`representing the ${gharana} gharana tradition`);
      }
      
      if (guruName) {
        parts.push(`trained under the guidance of ${guruName}`);
      }

      let summary = parts.join(' ');
      summary += '. Their contributions to classical music continue to inspire audiences and preserve the rich cultural heritage of Indian classical traditions.';

      return summary;
    } catch (error) {
      console.error('Summary generation error:', error);
      // Return basic fallback summary
      return `${artistName || 'This artist'} is a classical music performer known for their dedication to traditional music.`;
    }
  }

  /**
   * Get comprehensive details about an artist
   */
  async getComprehensiveDetails({ artistName, guruName, gharana }) {
    try {
      console.log('Getting comprehensive details for:', { artistName, guruName, gharana });
      
      const prompt = `Provide comprehensive details about this classical music artist:
      
      Artist Name: ${artistName || 'Not provided'}
      Guru Name: ${guruName || 'Not provided'}
      Gharana: ${gharana || 'Not provided'}
      
      Please provide:
      1. A detailed biography (2-3 paragraphs)
      2. A brief description (1 paragraph)
      3. A professional summary (2-3 sentences)
      
      Format your response as JSON:
      {
        "biography": "detailed biography here",
        "description": "brief description here",
        "summary": "professional summary here"
      }
      
      Focus on classical music traditions, training, and artistic contributions.`;

      // Try AI generation first
      const aiResult = await this.callGeminiAPI(prompt);
      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult);
          console.log('AI generated comprehensive details:', parsed);
          return parsed;
        } catch (parseError) {
          console.warn('Failed to parse AI response as JSON, using fallback');
        }
      }

      // Fallback to basic comprehensive details
      console.log('Using fallback comprehensive details');
      const comprehensiveData = {
        biography: `${artistName || 'This artist'} is a renowned classical music artist known for their exceptional skill and dedication to the art form. ${gharana ? `As a representative of the ${gharana} gharana, they carry forward the rich traditions and unique characteristics of this musical school.` : ''} ${guruName ? `Under the tutelage of ${guruName}, they have developed a distinctive style that honors traditional techniques while bringing their own artistic interpretation.` : ''}`,
        
        description: `A versatile performer with deep knowledge of classical music theory and practice. ${artistName || 'This artist'} has contributed significantly to the preservation and promotion of classical music traditions.`,
        
        summary: `${artistName || 'This artist'} stands as a prominent figure in classical music, ${gharana ? `representing the ${gharana} gharana` : 'known for their traditional approach'} ${guruName ? `and trained by the esteemed ${guruName}` : ''}. Their performances are characterized by technical excellence and emotional depth, making them a respected artist in the classical music community.`
      };

      return comprehensiveData;
    } catch (error) {
      console.error('Comprehensive details error:', error);
      // Return basic fallback
      return {
        biography: `${artistName || 'This artist'} is a classical music performer with dedication to traditional music.`,
        description: `A classical music artist known for their skill and artistry.`,
        summary: `${artistName || 'This artist'} is a respected classical music performer.`
      };
    }
  }

  // Helper methods for formatting
  formatName(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  formatGharana(gharana) {
    const formatted = gharana
      .replace(/gharana/gi, '')
      .trim();
    return this.formatName(formatted);
  }

  formatText(text) {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/([.!?])\s*([a-z])/g, (match, punct, letter) => punct + ' ' + letter.toUpperCase())
      .replace(/^\w/, c => c.toUpperCase());
  }

  formatPhone(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone.trim();
  }

  formatEmail(email) {
    return email.toLowerCase().trim();
  }

  formatAddress(address) {
    return address
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word, index) => {
        // Capitalize first letter of each word except common prepositions
        const prepositions = ['of', 'in', 'at', 'by', 'for', 'with', 'on'];
        if (index === 0 || !prepositions.includes(word.toLowerCase())) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
      })
      .join(' ');
  }
}

export default AIEnhancer;