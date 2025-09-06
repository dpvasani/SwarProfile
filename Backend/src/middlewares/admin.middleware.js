import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    // Check if user exists (should be set by verifyJWT middleware)
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Check if user has admin role
    // Note: You might need to add a 'role' field to your User model
    // For now, we'll check if user has admin privileges
    // You can modify this logic based on your role implementation
    
    // Option 1: Check if user has admin role field
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Admin access required");
    }

    // Option 2: Alternative - check if user is in admin list (if you don't have role field)
    // const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    // if (!adminEmails.includes(req.user.email)) {
    //   throw new ApiError(403, "Admin access required");
    // }

    next();
  } catch (error) {
    throw new ApiError(403, error?.message || "Admin access required");
  }
});