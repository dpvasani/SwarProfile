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
        console.log('🚀 Google Vision API initialized successfully');
      } catch (error) {
        console.warn('⚠️ Google Vision API initialization failed, falling back to Tesseract:', error.message);
      }
    } else {
      console.log('📝 Using Tesseract.js only (Google Vision API credentials not provided)');
    }
  }

  /**
   * Main extraction method that routes to appropriate extractor
   */
  async extractFromFile(filePath, fileType) {
    const startTime = Date.now();
    
    try {
      if (!fs.existsSync(filePath)) {
        throw new ApiError(400, "File not found");
      }

      const normalizedType = fileType.toLowerCase();
      
      if (!this.supportedFormats.includes(normalizedType)) {
        throw new ApiError(400, `Unsupported file format: ${fileType}`);
      }

      let extractedText = '';
      let processingMethod = '';

      switch (normalizedType) {
        case 'pdf':
          extractedText = await this.extractFromPDF(filePath);
          processingMethod = 'PDF Parser';
          break;
        case 'doc':
        case 'docx':
          extractedText = await this.extractFromWord(filePath);
          processingMethod = 'Mammoth (Word)';
          break;
        case 'jpeg':
        case 'jpg':
        case 'png':
          const ocrResult = await this.extractFromImage(filePath);
          extractedText = ocrResult.text;
          processingMethod = ocrResult.method;
          break;
        default:
          throw new ApiError(400, `Extraction not implemented for ${fileType}`);
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Document processed in ${processingTime}ms using ${processingMethod}`);

      return this.parseExtractedData(extractedText, processingMethod, processingTime);
    } catch (error) {
      console.error('❌ Document extraction error:', error);
      throw new ApiError(500, `Failed to extract data from document: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  async extractFromPDF(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new ApiError(404, `PDF file not found: ${filePath}`);
      }
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
   * Extract text from images using OCR with Google Vision AI fallback
   */
  async extractFromImage(filePath) {
    // Try Google Vision API first if available
    if (this.visionClient) {
      try {
        console.log('🔍 Attempting OCR with Google Vision API...');
        const text = await this.extractWithGoogleVision(filePath);
        if (text && text.trim().length > 0) {
          console.log('✨ Google Vision API extraction successful');
          return {
            text: text,
            method: 'Google Vision AI',
            confidence: 'high'
          };
        }
      } catch (error) {
        console.warn('⚠️ Google Vision API failed, falling back to Tesseract:', error.message);
      }
    }

    // Fallback to Tesseract.js
    try {
      console.log('🔄 Using Tesseract.js for OCR...');
      const { data: { text, confidence } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`📊 Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      console.log('✅ Tesseract.js extraction completed');
      return {
        text: text,
        method: 'Tesseract.js',
        confidence: confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low'
      };
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
      console.error('❌ Google Vision API error:', error);
      throw new ApiError(500, `Google Vision API extraction failed: ${error.message}`);
    }
  }

  /**
   * Parse extracted text to identify artist information
   */
  parseExtractedData(text, processingMethod = 'Unknown', processingTime = 0) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    const extractedData = {
      artistName: this.extractArtistName(cleanText),
      guruName: this.extractGuruName(cleanText),
      gharana: this.extractGharana(cleanText),
      contactDetails: this.extractContactDetails(cleanText),
      biography: this.extractBiography(cleanText),
      rawText: cleanText,
      extractionMetadata: {
        method: processingMethod,
        processingTime: processingTime,
        confidence: this.calculateConfidence(cleanText),
        extractedAt: new Date().toISOString(),
        textLength: cleanText.length,
        wordCount: cleanText.split(/\s+/).length
      }
    };

    return extractedData;
  }

  /**
   * Calculate extraction confidence based on text quality and content
   */
  calculateConfidence(text) {
    if (!text || text.length < 10) return 'low';
    
    const wordCount = text.split(/\s+/).length;
    const hasStructuredData = /(?:name|guru|gharana|phone|email|artist|performer)/i.test(text);
    const hasContactInfo = /(?:@|phone|mobile|\d{10})/i.test(text);
    const hasProperNouns = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text);
    
    let score = 0;
    if (wordCount > 50) score += 2;
    else if (wordCount > 20) score += 1;
    
    if (hasStructuredData) score += 2;
    if (hasContactInfo) score += 1;
    if (hasProperNouns) score += 1;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Extract artist name using enhanced patterns
   */
  extractArtistName(text) {
    const patterns = [
      /(?:artist\s*name|name\s*of\s*artist|performer\s*name)\s*:?\s*([^\n\r,;]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m,
      /(?:performer|artist|musician)\s*:?\s*([^\n\r,;]+)/i,
      /(?:name)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        const name = match[1].trim();
        // Validate it looks like a name (has at least 2 words, proper capitalization)
        if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(name)) {
          return name;
        }
      }
    }
    return null;
  }

  /**
   * Extract guru name using enhanced patterns
   */
  extractGuruName(text) {
    const patterns = [
      /(?:guru|teacher|mentor|master)\s*:?\s*([^\n\r,;]+)/i,
      /(?:under|trained\s+by|student\s+of|disciple\s+of)\s+(?:guru\s+)?([^\n\r,;]+)/i,
      /(?:learned\s+from|guidance\s+of)\s+([^\n\r,;]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        const guru = match[1].trim();
        // Validate it looks like a name
        if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(guru)) {
          return guru;
        }
      }
    }
    return null;
  }

  /**
   * Extract gharana using enhanced patterns
   */
  extractGharana(text) {
    const patterns = [
      /(?:gharana|school|tradition|style)\s*:?\s*([^\n\r,;]+)/i,
      /([A-Z][a-z]+)\s+gharana/i,
      /(?:belongs\s+to|from|represents)\s+([A-Z][a-z]+\s+gharana)/i,
      /(?:tradition\s+of)\s+([A-Z][a-z]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+gharana$/i, '');
      }
    }
    return null;
  }

  /**
   * Extract contact details with enhanced validation
   */
  extractContactDetails(text) {
    const contactDetails = {};

    // Enhanced phone number patterns
    const phonePatterns = [
      /(?:phone|mobile|contact|tel|call)\s*:?\s*([+]?[\d\s\-()]{10,15})/i,
      /(?:mob|ph)\s*:?\s*([+]?[\d\s\-()]{10,15})/i,
      /([+]?[\d\s\-()]{10,15})/g
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const phone = match[1].replace(/\D/g, '');
        if (phone.length >= 10) {
          contactDetails.phone = match[1].trim();
          break;
        }
      }
    }

    // Enhanced email pattern
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      contactDetails.email = emailMatch[1].trim().toLowerCase();
    }

    // Enhanced address pattern
    const addressPatterns = [
      /(?:address|location|residence)\s*:?\s*([^\n\r]+)/i,
      /(?:lives?\s+(?:at|in)|based\s+(?:at|in))\s+([^\n\r]+)/i,
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 10) {
        contactDetails.address = match[1].trim();
        break;
      }
    }

    return Object.keys(contactDetails).length > 0 ? contactDetails : null;
  }

  /**
   * Extract biography/description with better content detection
   */
  extractBiography(text) {
    const patterns = [
      /(?:biography|bio|about|description|profile|background)\s*:?\s*([^\n\r]{100,})/i,
      /(?:born|career|achievements|specializes)\s*[^\n\r]*([^\n\r]{100,})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no specific pattern found, return first substantial paragraph
    const paragraphs = text.split(/\n\s*\n/);
    const substantialParagraph = paragraphs.find(p => 
      p.length > 150 && 
      /[.!?]/.test(p) && // Contains sentence endings
      !/^[\d\s\-+()]+$/.test(p) // Not just numbers/phone
    );
    
    return substantialParagraph ? substantialParagraph.trim() : null;
  }
}

export default DocumentExtractor;