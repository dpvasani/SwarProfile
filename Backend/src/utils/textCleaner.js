import { ApiError } from './ApiError.js';

class TextCleaner {
  /**
   * Clean and normalize extracted text
   */
  static cleanText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere
      .replace(/[^\w\s@.-]/g, ' ')
      // Trim whitespace
      .trim();
  }

  /**
   * Extract and validate email addresses
   */
  static extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    
    return emails.filter(email => this.isValidEmail(email));
  }

  /**
   * Extract and validate phone numbers
   */
  static extractPhoneNumbers(text) {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones = text.match(phoneRegex) || [];
    
    return phones.map(phone => this.formatPhoneNumber(phone));
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format phone number
   */
  static formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return original if can't format
  }

  /**
   * Extract names using common patterns
   */
  static extractNames(text, context = '') {
    const patterns = [
      new RegExp(`${context}\\s*:?\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'),
      new RegExp(`${context}\\s+(?:is|was)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanName(match[1]);
      }
    }

    return null;
  }

  /**
   * Clean and validate name
   */
  static cleanName(name) {
    if (!name) return null;
    
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z\s]/g, '')
      .trim();
  }

  /**
   * Extract sentences containing keywords
   */
  static extractSentencesWithKeywords(text, keywords) {
    const sentences = text.split(/[.!?]+/);
    const relevantSentences = [];

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      sentences.forEach(sentence => {
        if (regex.test(sentence) && !relevantSentences.includes(sentence.trim())) {
          relevantSentences.push(sentence.trim());
        }
      });
    });

    return relevantSentences;
  }

  /**
   * Remove sensitive information from text
   */
  static sanitizeForLogging(text) {
    if (!text) return '';

    return text
      // Remove potential email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      // Remove potential phone numbers
      .replace(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, '[PHONE]')
      // Remove potential addresses (basic pattern)
      .replace(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd)/gi, '[ADDRESS]');
  }
}

export default TextCleaner;