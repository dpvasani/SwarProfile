import { ApiError } from './ApiError.js';
import dotenv from 'dotenv';
dotenv.config();

class AIEnhancer {
  constructor() {
    // Initialize AI service (Gemini, OpenAI, etc.)
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    this.baseURL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
  }

  /**
   * Enhance a single field with AI
   */
  async enhanceField(fieldName, fieldValue, context = {}) {
    try {
      // For now, implement basic text cleaning and formatting
      // Replace with actual AI API calls
      let enhanced = fieldValue.trim();

      switch (fieldName) {
        case 'artistName':
          enhanced = this.formatName(enhanced);
          break;
        case 'guruName':
          enhanced = this.formatName(enhanced);
          break;
        case 'gharana':
          enhanced = this.formatGharana(enhanced);
          break;
        case 'biography':
        case 'description':
          enhanced = this.formatText(enhanced);
          break;
        case 'contactDetails.phone':
          enhanced = this.formatPhone(enhanced);
          break;
        case 'contactDetails.email':
          enhanced = this.formatEmail(enhanced);
          break;
        case 'contactDetails.address':
          enhanced = this.formatAddress(enhanced);
          break;
        default:
          enhanced = this.formatText(enhanced);
      }

      return enhanced;
    } catch (error) {
      console.error('Field enhancement error:', error);
      throw new ApiError(500, `Failed to enhance ${fieldName}: ${error.message}`);
    }
  }

  /**
   * Enhance all fields comprehensively
   */
  async enhanceAllFields(data, rawText = '') {
    try {
      const enhanced = { ...data };

      // Enhance each field
      if (enhanced.artistName) {
        enhanced.artistName = await this.enhanceField('artistName', enhanced.artistName);
      }
      
      if (enhanced.guruName) {
        enhanced.guruName = await this.enhanceField('guruName', enhanced.guruName);
      }
      
      if (enhanced.gharana) {
        enhanced.gharana = await this.enhanceField('gharana', enhanced.gharana);
      }
      
      if (enhanced.biography) {
        enhanced.biography = await this.enhanceField('biography', enhanced.biography);
      }
      
      if (enhanced.description) {
        enhanced.description = await this.enhanceField('description', enhanced.description);
      }

      // Enhance contact details
      if (enhanced.contactDetails) {
        if (enhanced.contactDetails.phone) {
          enhanced.contactDetails.phone = await this.enhanceField('contactDetails.phone', enhanced.contactDetails.phone);
        }
        if (enhanced.contactDetails.email) {
          enhanced.contactDetails.email = await this.enhanceField('contactDetails.email', enhanced.contactDetails.email);
        }
        if (enhanced.contactDetails.address) {
          enhanced.contactDetails.address = await this.enhanceField('contactDetails.address', enhanced.contactDetails.address);
        }
      }

      return enhanced;
    } catch (error) {
      console.error('Comprehensive enhancement error:', error);
      throw new ApiError(500, `Failed to enhance all fields: ${error.message}`);
    }
  }

  /**
   * Generate AI-powered summary
   */
  async generateSummary({ artistName, guruName, gharana, biography }) {
    try {
      // Basic summary generation - replace with AI API call
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
      
      if (biography) {
        const bioSummary = biography.length > 200 
          ? biography.substring(0, 200) + '...' 
          : biography;
        summary += '. ' + bioSummary;
      }

      // Add some standard classical music context
      summary += ' Their contributions to classical music continue to inspire audiences and preserve the rich cultural heritage of Indian classical traditions.';

      return summary;
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new ApiError(500, `Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Get comprehensive details about an artist
   */
  async getComprehensiveDetails({ artistName, guruName, gharana }) {
    try {
      // Mock comprehensive details - replace with actual AI research
      const comprehensiveData = {
        biography: `${artistName} is a renowned classical music artist known for their exceptional skill and dedication to the art form. ${gharana ? `As a representative of the ${gharana} gharana, they carry forward the rich traditions and unique characteristics of this musical school.` : ''} ${guruName ? `Under the tutelage of ${guruName}, they have developed a distinctive style that honors traditional techniques while bringing their own artistic interpretation.` : ''}`,
        
        description: `A versatile performer with deep knowledge of classical music theory and practice. ${artistName} has contributed significantly to the preservation and promotion of classical music traditions.`,
        
        summary: `${artistName} stands as a prominent figure in classical music, ${gharana ? `representing the ${gharana} gharana` : 'known for their traditional approach'} ${guruName ? `and trained by the esteemed ${guruName}` : ''}. Their performances are characterized by technical excellence and emotional depth, making them a respected artist in the classical music community.`,
        
        additionalInfo: {
          musicalStyle: gharana ? `${gharana} gharana traditions` : 'Classical music traditions',
          training: guruName ? `Trained under ${guruName}` : 'Traditional guru-shishya parampara',
          specialization: 'Classical music performance and composition'
        }
      };

      return comprehensiveData;
    } catch (error) {
      console.error('Comprehensive details error:', error);
      throw new ApiError(500, `Failed to get comprehensive details: ${error.message}`);
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