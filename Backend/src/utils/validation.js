import { ApiError } from './ApiError.js';

class ValidationHelper {
  /**
   * Validate file type for document upload
   */
  static validateDocumentFile(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/jpg', 'image/png'];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpeg', '.jpg', '.png'];
    
    if (!file) {
      throw new ApiError(400, 'File is required');
    }

    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      throw new ApiError(400, 'Invalid file type. Only PDF, DOC, DOCX, JPEG, JPG, PNG files are allowed');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new ApiError(400, 'File size too large. Maximum size is 10MB');
    }

    return true;
  }

  /**
   * Validate image file for profile photo
   */
  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.jpeg', '.jpg', '.png'];
    
    if (!file) {
      throw new ApiError(400, 'Image file is required');
    }

    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      throw new ApiError(400, 'Invalid image type. Only JPEG, JPG, PNG files are allowed');
    }

    // Check file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new ApiError(400, 'Image size too large. Maximum size is 5MB');
    }

    return true;
  }

  /**
   * Validate artist data
   */
  static validateArtistData(data) {
    const errors = [];

    if (!data.artistName || data.artistName.trim().length < 2) {
      errors.push('Artist name must be at least 2 characters long');
    }

    if (data.contactDetails && data.contactDetails.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.contactDetails.email)) {
        errors.push('Invalid email format');
      }
    }

    if (data.contactDetails && data.contactDetails.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = data.contactDetails.phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
        errors.push('Invalid phone number format');
      }
    }

    if (errors.length > 0) {
      throw new ApiError(400, `Validation errors: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(data) {
    if (typeof data === 'string') {
      return data.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (pageNum < 1) {
      throw new ApiError(400, 'Page number must be greater than 0');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new ApiError(400, 'Limit must be between 1 and 100');
    }

    return { page: pageNum, limit: limitNum };
  }
}

export default ValidationHelper;