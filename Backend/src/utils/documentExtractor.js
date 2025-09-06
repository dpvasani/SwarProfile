import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { ApiError } from './ApiError.js';

class DocumentExtractor {
  constructor() {
    this.supportedFormats = ['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png'];
  }

  /**
   * Main extraction method that routes to appropriate extractor
   */
  async extractFromFile(filePath, fileType) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new ApiError(400, "File not found");
      }

      const normalizedType = fileType.toLowerCase();
      
      if (!this.supportedFormats.includes(normalizedType)) {
        throw new ApiError(400, `Unsupported file format: ${fileType}`);
      }

      let extractedText = '';

      switch (normalizedType) {
        case 'pdf':
          extractedText = await this.extractFromPDF(filePath);
          break;
        case 'doc':
        case 'docx':
          extractedText = await this.extractFromWord(filePath);
          break;
        case 'jpeg':
        case 'jpg':
        case 'png':
          extractedText = await this.extractFromImage(filePath);
          break;
        default:
          throw new ApiError(400, `Extraction not implemented for ${fileType}`);
      }

      return this.parseExtractedData(extractedText);
    } catch (error) {
      console.error('Document extraction error:', error);
      throw new ApiError(500, `Failed to extract data from document: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new ApiError(500, `PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Word documents
   */
  async extractFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new ApiError(500, `Word document extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from images using OCR
   */
  async extractFromImage(filePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => console.log(m) // Optional: log OCR progress
      });
      return text;
    } catch (error) {
      throw new ApiError(500, `OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Parse extracted text to identify artist information
   */
  parseExtractedData(text) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    const extractedData = {
      artistName: this.extractArtistName(cleanText),
      guruName: this.extractGuruName(cleanText),
      gharana: this.extractGharana(cleanText),
      contactDetails: this.extractContactDetails(cleanText),
      biography: this.extractBiography(cleanText),
      rawText: cleanText,
    };

    return extractedData;
  }

  /**
   * Extract artist name using patterns
   */
  extractArtistName(text) {
    const patterns = [
      /(?:artist\s*name|name)\s*:?\s*([^\n\r,]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m,
      /(?:performer|artist)\s*:?\s*([^\n\r,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract guru name using patterns
   */
  extractGuruName(text) {
    const patterns = [
      /(?:guru|teacher|mentor)\s*:?\s*([^\n\r,]+)/i,
      /(?:under|trained\s+by|student\s+of)\s+([^\n\r,]+)/i,
      /(?:disciple\s+of)\s+([^\n\r,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract gharana using patterns
   */
  extractGharana(text) {
    const patterns = [
      /(?:gharana|school|tradition)\s*:?\s*([^\n\r,]+)/i,
      /([A-Z][a-z]+)\s+gharana/i,
      /(?:belongs\s+to|from)\s+([A-Z][a-z]+\s+gharana)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract contact details
   */
  extractContactDetails(text) {
    const contactDetails = {};

    // Phone number patterns
    const phonePattern = /(?:phone|mobile|contact|tel)\s*:?\s*([+]?[\d\s\-()]{10,15})/i;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
      contactDetails.phone = phoneMatch[1].trim();
    }

    // Email pattern
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      contactDetails.email = emailMatch[1].trim();
    }

    // Address pattern (basic)
    const addressPattern = /(?:address|location)\s*:?\s*([^\n\r]+)/i;
    const addressMatch = text.match(addressPattern);
    if (addressMatch) {
      contactDetails.address = addressMatch[1].trim();
    }

    return Object.keys(contactDetails).length > 0 ? contactDetails : null;
  }

  /**
   * Extract biography/description
   */
  extractBiography(text) {
    const patterns = [
      /(?:biography|bio|about|description)\s*:?\s*([^\n\r]{50,})/i,
      /(?:background|profile)\s*:?\s*([^\n\r]{50,})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no specific pattern found, return first substantial paragraph
    const paragraphs = text.split(/\n\s*\n/);
    const substantialParagraph = paragraphs.find(p => p.length > 100);
    
    return substantialParagraph ? substantialParagraph.trim() : null;
  }
}

export default DocumentExtractor;