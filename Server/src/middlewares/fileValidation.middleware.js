import { ApiError } from "../utils/ApiError.js";
import ValidationHelper from "../utils/validation.js";

/**
 * Middleware to validate document files
 */
export const validateDocumentFile = (req, res, next) => {
  try {
    if (req.file) {
      ValidationHelper.validateDocumentFile(req.file);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate image files
 */
export const validateImageFile = (req, res, next) => {
  try {
    if (req.file) {
      ValidationHelper.validateImageFile(req.file);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req, res, next) => {
  try {
    if (req.body) {
      req.body = ValidationHelper.sanitizeInput(req.body);
    }
    next();
  } catch (error) {
    next(new ApiError(500, "Error sanitizing input data"));
  }
};