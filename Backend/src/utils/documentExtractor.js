import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { ApiError } from './ApiError.js';
import vision from '@google-cloud/vision';

class DocumentExtractor {
  constructor() {
    this.supportedFormats = ['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png'];
    
    // Initialize Google Vision client if credentials are available
    this.visionClient = null;
    if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      try {
        this.visionClient = new vision.ImageAnnotatorClient({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Optional: if using key file
          credentials: process.env.GOOGLE_CLOUD_PRIVATE_KEY ? {
            client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
          } : undefined
        });
        console.log('Google Vision API initialized successfully');
      } catch (error) {
        console.warn('Google Vision API initialization failed, falling back to Tesseract:', error.message);
      }
    }
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
    // Try Google Vision API first if available
    if (this.visionClient) {
      try {
        console.log('Attempting OCR with Google Vision API...');
        const text = await this.extractWithGoogleVision(filePath);
        if (text && text.trim().length > 0) {
          console.log('Google Vision API extraction successful');
          return text;
        }
      } catch (error) {
        console.warn('Google Vision API failed, falling back to Tesseract:', error.message);
      }
    }

    // Fallback to Tesseract.js
    try {
      console.log('Using Tesseract.js for OCR...');
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      console.log('Tesseract.js extraction completed');
      return text;
    } catch (error) {
      throw new ApiError(500, `OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text using Google Vision API
   */
  async extractWithGoogleVision(filePath) {
    try {
      const [result] = await this.visionClient.textDetection(filePath);
      const detections = result.textAnnotations;
      
      if (detections && detections.length > 0) {
        // First annotation contains the full text
        return detections[0].description || '';
      }
      
      return '';
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw new ApiError(500, `Google Vision API extraction failed: ${error.message}`);
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
      extractionMethod: this.visionClient ? 'Google Vision API + Tesseract fallback' : 'Tesseract.js only',
      confidence: this.calculateConfidence(cleanText),
    };

    return extractedData;
  }

  /**
   * Calculate extraction confidence based on text quality
   */
  calculateConfidence(text) {
    if (!text || text.length < 10) return 'low';
    
    const wordCount = text.split(/\s+/).length;
    const hasStructuredData = /(?:name|guru|gharana|phone|email)/i.test(text);
    
    if (wordCount > 50 && hasStructuredData) return 'high';
    if (wordCount > 20) return 'medium';
    return 'low';
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