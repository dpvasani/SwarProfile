import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { ApiError } from './ApiError.js';
import vision from '@google-cloud/vision';
import sharp from 'sharp';

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
        console.warn('⚠️ Google Vision API initialization failed, will use as fallback only:', error.message);
        this.visionClient = null;
      }
    } else {
      console.log('📝 Google Vision API credentials not provided - using local extraction only');
    }
  }

  /**
   * Main extraction method with comprehensive fallback logic
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
      let confidence = 'low';
      let fallbackUsed = false;

      console.log(`🔄 Starting extraction for ${normalizedType} file: ${filePath}`);

      switch (normalizedType) {
        case 'pdf':
          const pdfResult = await this.extractFromPDFWithFallback(filePath);
          extractedText = pdfResult.text;
          processingMethod = pdfResult.method;
          confidence = pdfResult.confidence;
          fallbackUsed = pdfResult.fallbackUsed;
          break;
          
        case 'doc':
        case 'docx':
          const wordResult = await this.extractFromWordWithFallback(filePath);
          extractedText = wordResult.text;
          processingMethod = wordResult.method;
          confidence = wordResult.confidence;
          fallbackUsed = wordResult.fallbackUsed;
          break;
          
        case 'jpeg':
        case 'jpg':
        case 'png':
          const imageResult = await this.extractFromImageWithFallback(filePath);
          extractedText = imageResult.text;
          processingMethod = imageResult.method;
          confidence = imageResult.confidence;
          fallbackUsed = imageResult.fallbackUsed;
          break;
          
        default:
          throw new ApiError(400, `Extraction not implemented for ${fileType}`);
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Document processed in ${processingTime}ms using ${processingMethod}${fallbackUsed ? ' (with fallback)' : ''}`);

      return this.parseExtractedData(extractedText, processingMethod, processingTime, confidence, fallbackUsed);
    } catch (error) {
      console.error('❌ Document extraction error:', error);
      throw new ApiError(500, `Failed to extract data from document: ${error.message}`);
    }
  }

  /**
   * Extract from PDF with fallback to Google Vision API
   */
  async extractFromPDFWithFallback(filePath) {
    let primaryResult = null;
    let fallbackUsed = false;

    // Primary method: PDF Parser
    try {
      console.log('📄 Attempting PDF extraction with pdf-parse...');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (data.text && data.text.trim().length > 50) {
        console.log('✅ PDF extraction successful with pdf-parse');
        return {
          text: data.text,
          method: 'PDF Parser',
          confidence: this.calculateTextConfidence(data.text),
          fallbackUsed: false
        };
      } else {
        console.log('⚠️ PDF extraction returned minimal text, trying fallback...');
        primaryResult = { text: data.text, method: 'PDF Parser (minimal)' };
      }
    } catch (error) {
      console.warn('⚠️ PDF extraction failed:', error.message);
      primaryResult = { text: '', method: 'PDF Parser (failed)' };
    }

    // Fallback method: Convert PDF to image and use OCR
    try {
      console.log('🔄 Attempting PDF fallback with image conversion + OCR...');
      const fallbackResult = await this.extractPDFViaImageConversion(filePath);
      
      if (fallbackResult.text && fallbackResult.text.trim().length > (primaryResult?.text?.length || 0)) {
        console.log('✅ PDF fallback extraction successful');
        return {
          text: fallbackResult.text,
          method: `${fallbackResult.method} (PDF Fallback)`,
          confidence: fallbackResult.confidence,
          fallbackUsed: true
        };
      }
    } catch (error) {
      console.warn('⚠️ PDF fallback extraction failed:', error.message);
    }

    // Return primary result if available, otherwise throw error
    if (primaryResult && primaryResult.text) {
      return {
        text: primaryResult.text,
        method: primaryResult.method,
        confidence: 'low',
        fallbackUsed: false
      };
    }

    throw new ApiError(500, 'PDF extraction failed with all methods');
  }

  /**
   * Extract from Word documents with fallback to Google Vision API
   */
  async extractFromWordWithFallback(filePath) {
    let primaryResult = null;
    let fallbackUsed = false;

    // Primary method: Mammoth
    try {
      console.log('📝 Attempting Word extraction with mammoth...');
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (result.value && result.value.trim().length > 50) {
        console.log('✅ Word extraction successful with mammoth');
        return {
          text: result.value,
          method: 'Mammoth (Word)',
          confidence: this.calculateTextConfidence(result.value),
          fallbackUsed: false
        };
      } else {
        console.log('⚠️ Word extraction returned minimal text, trying fallback...');
        primaryResult = { text: result.value, method: 'Mammoth (minimal)' };
      }
    } catch (error) {
      console.warn('⚠️ Word extraction failed:', error.message);
      primaryResult = { text: '', method: 'Mammoth (failed)' };
    }

    // Fallback method: Convert to image and use OCR (if possible)
    try {
      console.log('🔄 Attempting Word fallback with image conversion + OCR...');
      // Note: Converting Word to image is complex, so we'll use Google Vision API if available
      if (this.visionClient) {
        console.log('📸 Converting Word document to image for OCR...');
        const imageResult = await this.convertWordToImageAndExtract(filePath);
        
        if (imageResult.text && imageResult.text.trim().length > (primaryResult?.text?.length || 0)) {
          console.log('✅ Word fallback extraction successful');
          return {
            text: imageResult.text,
            method: `${imageResult.method} (Word Fallback)`,
            confidence: imageResult.confidence,
            fallbackUsed: true
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Word fallback extraction failed:', error.message);
    }

    // Return primary result if available, otherwise throw error
    if (primaryResult && primaryResult.text) {
      return {
        text: primaryResult.text,
        method: primaryResult.method,
        confidence: 'low',
        fallbackUsed: false
      };
    }

    throw new ApiError(500, 'Word document extraction failed with all methods');
  }

  /**
   * Extract from images with comprehensive fallback logic
   */
  async extractFromImageWithFallback(filePath) {
    const methods = [];
    
    // Method 1: Google Vision API (if available)
    if (this.visionClient) {
      try {
        console.log('🔍 Attempting OCR with Google Vision API...');
        const visionResult = await this.extractWithGoogleVision(filePath);
        if (visionResult && visionResult.trim().length > 0) {
          console.log('✨ Google Vision API extraction successful');
          return {
            text: visionResult,
            method: 'Google Vision AI',
            confidence: 'high',
            fallbackUsed: false
          };
        }
        methods.push({ method: 'Google Vision AI', text: visionResult || '', error: 'No text detected' });
      } catch (error) {
        console.warn('⚠️ Google Vision API failed:', error.message);
        methods.push({ method: 'Google Vision AI', text: '', error: error.message });
      }
    }

    // Method 2: Tesseract.js with image preprocessing
    try {
      console.log('🔄 Attempting OCR with Tesseract.js (with preprocessing)...');
      const preprocessedResult = await this.extractWithTesseractPreprocessed(filePath);
      if (preprocessedResult.text && preprocessedResult.text.trim().length > 0) {
        console.log('✅ Tesseract.js (preprocessed) extraction successful');
        return {
          text: preprocessedResult.text,
          method: 'Tesseract.js (Preprocessed)',
          confidence: preprocessedResult.confidence,
          fallbackUsed: methods.length > 0
        };
      }
      methods.push({ method: 'Tesseract.js (Preprocessed)', text: preprocessedResult.text || '', confidence: preprocessedResult.confidence });
    } catch (error) {
      console.warn('⚠️ Tesseract.js (preprocessed) failed:', error.message);
      methods.push({ method: 'Tesseract.js (Preprocessed)', text: '', error: error.message });
    }

    // Method 3: Standard Tesseract.js
    try {
      console.log('🔄 Attempting OCR with standard Tesseract.js...');
      const tesseractResult = await this.extractWithTesseractStandard(filePath);
      if (tesseractResult.text && tesseractResult.text.trim().length > 0) {
        console.log('✅ Standard Tesseract.js extraction successful');
        return {
          text: tesseractResult.text,
          method: 'Tesseract.js',
          confidence: tesseractResult.confidence,
          fallbackUsed: methods.length > 0
        };
      }
      methods.push({ method: 'Tesseract.js', text: tesseractResult.text || '', confidence: tesseractResult.confidence });
    } catch (error) {
      console.warn('⚠️ Standard Tesseract.js failed:', error.message);
      methods.push({ method: 'Tesseract.js', text: '', error: error.message });
    }

    // Return the best result from all methods
    const bestResult = methods.reduce((best, current) => {
      const currentLength = current.text?.length || 0;
      const bestLength = best.text?.length || 0;
      return currentLength > bestLength ? current : best;
    }, { text: '', method: 'None', confidence: 'low' });

    if (bestResult.text && bestResult.text.trim().length > 0) {
      console.log(`📝 Using best result from ${bestResult.method}`);
      return {
        text: bestResult.text,
        method: `${bestResult.method} (Best of ${methods.length})`,
        confidence: bestResult.confidence || 'low',
        fallbackUsed: true
      };
    }

    throw new ApiError(500, `Image OCR extraction failed with all methods: ${methods.map(m => m.method).join(', ')}`);
  }

  /**
   * Extract text using Google Vision API
   */
  async extractWithGoogleVision(filePath) {
    try {
      const [result] = await this.visionClient.textDetection(filePath);
      const detections = result.textAnnotations;
      
      if (detections && detections.length > 0) {
        return detections[0].description || '';
      }
      
      return '';
    } catch (error) {
      console.error('❌ Google Vision API error:', error);
      throw new ApiError(500, `Google Vision API extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract with Tesseract.js using image preprocessing
   */
  async extractWithTesseractPreprocessed(filePath) {
    try {
      // Preprocess image for better OCR results
      const preprocessedPath = await this.preprocessImage(filePath);
      
      const { data: { text, confidence } } = await Tesseract.recognize(preprocessedPath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`📊 Tesseract (preprocessed) progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Clean up preprocessed image
      if (preprocessedPath !== filePath && fs.existsSync(preprocessedPath)) {
        fs.unlinkSync(preprocessedPath);
      }

      return {
        text: text,
        confidence: confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low'
      };
    } catch (error) {
      throw new ApiError(500, `Tesseract.js (preprocessed) extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract with standard Tesseract.js
   */
  async extractWithTesseractStandard(filePath) {
    try {
      const { data: { text, confidence } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`📊 Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      return {
        text: text,
        confidence: confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low'
      };
    } catch (error) {
      throw new ApiError(500, `Tesseract.js extraction failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(filePath) {
    try {
      const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
      
      await sharp(filePath)
        .greyscale()
        .normalize()
        .sharpen()
        .png()
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.warn('⚠️ Image preprocessing failed, using original:', error.message);
      return filePath;
    }
  }

  /**
   * Convert PDF to image and extract text
   */
  async extractPDFViaImageConversion(filePath) {
    // This is a placeholder for PDF to image conversion
    // In a real implementation, you might use pdf2pic or similar
    console.log('📄➡️📸 PDF to image conversion not implemented yet');
    throw new Error('PDF to image conversion not implemented');
  }

  /**
   * Convert Word document to image and extract text
   */
  async convertWordToImageAndExtract(filePath) {
    // This is a placeholder for Word to image conversion
    // In a real implementation, you might use LibreOffice headless or similar
    console.log('📝➡️📸 Word to image conversion not implemented yet');
    throw new Error('Word to image conversion not implemented');
  }

  /**
   * Calculate text confidence based on content quality
   */
  calculateTextConfidence(text) {
    if (!text || text.length < 10) return 'low';
    
    const wordCount = text.split(/\s+/).length;
    const hasStructuredData = /(?:name|guru|gharana|phone|email|artist|performer)/i.test(text);
    const hasContactInfo = /(?:@|phone|mobile|\d{10})/i.test(text);
    const hasProperNouns = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text);
    const hasSpecialChars = /[^\w\s]/.test(text);
    
    let score = 0;
    if (wordCount > 100) score += 3;
    else if (wordCount > 50) score += 2;
    else if (wordCount > 20) score += 1;
    
    if (hasStructuredData) score += 2;
    if (hasContactInfo) score += 1;
    if (hasProperNouns) score += 1;
    if (!hasSpecialChars || text.match(/[^\w\s]/g).length < text.length * 0.1) score += 1;
    
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Parse extracted text to identify artist information with enhanced confidence
   */
  parseExtractedData(text, processingMethod = 'Unknown', processingTime = 0, confidence = 'medium', fallbackUsed = false) {
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
        confidence: confidence,
        fallbackUsed: fallbackUsed,
        extractedAt: new Date().toISOString(),
        textLength: cleanText.length,
        wordCount: cleanText.split(/\s+/).length,
        qualityScore: this.calculateQualityScore(cleanText)
      }
    };

    return extractedData;
  }

  /**
   * Calculate overall quality score for extracted data
   */
  calculateQualityScore(text) {
    let score = 0;
    const data = {
      artistName: this.extractArtistName(text),
      guruName: this.extractGuruName(text),
      gharana: this.extractGharana(text),
      contactDetails: this.extractContactDetails(text),
      biography: this.extractBiography(text)
    };

    if (data.artistName) score += 25;
    if (data.guruName) score += 20;
    if (data.gharana) score += 15;
    if (data.contactDetails && Object.keys(data.contactDetails).length > 0) score += 20;
    if (data.biography && data.biography.length > 100) score += 20;

    return Math.min(score, 100);
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