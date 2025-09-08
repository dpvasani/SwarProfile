import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Artist } from "../models/artist.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import DocumentExtractor from "../utils/documentExtractor.js";
import AIEnhancer from "../utils/aiEnhancer.js";
import fs from "fs";
import path from "path";

const documentExtractor = new DocumentExtractor();
const aiEnhancer = new AIEnhancer();

/**
 * Upload and extract artist information from document
 * Admin only
 */
const uploadAndExtractDocument = asyncHandler(async (req, res) => {
  try {
    // Check if user is admin (you might want to add role check middleware)
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Check if document file is provided
    if (!req.file) {
      throw new ApiError(400, "Document file is required");
    }

    const documentPath = req.file.path;
    const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();

    // Create initial artist record
    const artist = new Artist({
      extractionStatus: 'processing',
      originalDocument: {
        filename: req.file.originalname,
        fileType: fileType,
        uploadedAt: new Date(),
      },
      createdBy: req.user._id,
    });

    try {
      // Extract data from document
      const extractedData = await documentExtractor.extractFromFile(documentPath, fileType);

      console.log(`📊 Extraction completed with confidence: ${extractedData.metadata?.confidence}`);
      console.log(`🔧 Method used: ${extractedData.metadata?.method}`);
      console.log(`⏱️ Processing time: ${extractedData.metadata?.processingTime}`);

      // Upload document to Cloudinary
      const documentUpload = await uploadOnCloudinary(documentPath);
      if (!documentUpload) {
        throw new ApiError(500, "Failed to upload document to cloud storage");
      }

      // Update artist with cleaned extracted data
      const cleanedData = extractedData.cleanedExtractedData;
      artist.artistName = cleanedData.artistName;
      artist.guruName = cleanedData.guruName;
      artist.gharana = cleanedData.gharana;
      artist.contactDetails = cleanedData.contactDetails;
      artist.biography = cleanedData.biography;
      artist.description = cleanedData.description;
      artist.rawExtractedData = extractedData.rawText;
      artist.originalDocument.url = documentUpload.url;
      artist.extractionStatus = 'completed';

      await artist.save();

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            artist: artist.getAdminView(),
            extractedData: {
              ...cleanedData,
              rawText: extractedData.rawText,
              metadata: extractedData.metadata
            },
          },
          "Document uploaded and processed successfully"
        )
      );

    } catch (extractionError) {
      // Update status to failed
      artist.extractionStatus = 'failed';
      await artist.save();
      
      // Clean up local file
      if (fs.existsSync(documentPath)) {
        fs.unlinkSync(documentPath);
      }
      
      throw new ApiError(500, `Document processing failed: ${extractionError.message}`);
    }

  } catch (error) {
    // Clean up local file in case of any error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

/**
 * Get all artists (Admin view with full details)
 * Admin only
 */
const getAllArtistsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  
  const query = {};
  
  if (search) {
    query.$text = { $search: search };
  }
  
  if (status) {
    query.extractionStatus = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'createdBy', select: 'fullName email' },
      { path: 'verifiedBy', select: 'fullName email' }
    ]
  };

  const artists = await Artist.paginate(query, options);

  return res.status(200).json(
    new ApiResponse(200, artists, "Artists retrieved successfully")
  );
});

/**
 * Get all artists (User view with summary only)
 * Public access
 */
const getAllArtistsUser = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  const query = { 
    extractionStatus: 'completed',
    isVerified: true 
  };
  
  if (search) {
    query.$text = { $search: search };
  }

  const artists = await Artist.find(query)
    .select('artistName guruName gharana profilePhoto createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Artist.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        artists: artists.map(artist => artist.getUserView()),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        }
      },
      "Artists retrieved successfully"
    )
  );
});

/**
 * Get single artist by ID (Admin view)
 * Admin only
 */
const getArtistByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artist = await Artist.findById(id)
    .populate('createdBy', 'fullName email')
    .populate('verifiedBy', 'fullName email');

  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { artist: artist.getAdminView() }, "Artist retrieved successfully")
  );
});

/**
 * Get single artist by ID
 */
const getArtistById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user && req.user.role === 'admin'; // Assuming you have role field

  const artist = await Artist.findById(id)
    .populate('createdBy', 'fullName email')
    .populate('verifiedBy', 'fullName email');

  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }

  // Return appropriate view based on user role
  const artistData = isAdmin ? artist.getAdminView() : artist.getUserView();

  return res.status(200).json(
    new ApiResponse(200, { artist: artistData }, "Artist retrieved successfully")
  );
});

/**
 * Update artist information
 * Admin only
 */
const updateArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const artist = await Artist.findById(id);
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }

  // Update allowed fields
  const allowedUpdates = [
    'artistName', 'guruName', 'gharana', 'contactDetails',
    'biography', 'description', 'aiGeneratedSummary', 'additionalFields'
  ];

  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      if (field === 'contactDetails') {
        // Merge contact details to preserve existing fields
        artist.contactDetails = {
          ...artist.contactDetails,
          ...updateData.contactDetails
        };
      } else {
        artist[field] = updateData[field];
      }
    }
  });

  await artist.save();

  return res.status(200).json(
    new ApiResponse(200, { artist: artist.getAdminView() }, "Artist updated successfully")
  );
});

/**
 * Upload or update artist profile photo
 * Admin only
 */
const updateArtistPhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    throw new ApiError(400, "Photo file is required");
  }

  const artist = await Artist.findById(id);
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }

  // Delete old photo if exists
  if (artist.profilePhoto) {
    const publicId = artist.profilePhoto.split('/').pop().split('.')[0];
    await deleteOnCloudinary(publicId, 'image');
  }

  // Upload new photo
  const photoUpload = await uploadOnCloudinary(req.file.path);
  if (!photoUpload) {
    throw new ApiError(500, "Failed to upload photo");
  }

  artist.profilePhoto = photoUpload.url;
  await artist.save();

  return res.status(200).json(
    new ApiResponse(200, { artist: artist.getAdminView() }, "Artist photo updated successfully")
  );
});

/**
 * Verify artist profile
 * Admin only
 */
const verifyArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artist = await Artist.findById(id);
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }

  artist.isVerified = true;
  artist.verifiedBy = req.user._id;
  artist.verifiedAt = new Date();
  artist.extractionStatus = 'verified';

  await artist.save();

  return res.status(200).json(
    new ApiResponse(200, { artist: artist.getAdminView() }, "Artist verified successfully")
  );
});

/**
 * Delete artist
 * Admin only
 */
const deleteArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artist = await Artist.findById(id);
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }

  // Delete associated files from Cloudinary
  if (artist.originalDocument.url) {
    const publicId = artist.originalDocument.url.split('/').pop().split('.')[0];
    await deleteOnCloudinary(publicId, 'auto');
  }

  if (artist.profilePhoto) {
    const publicId = artist.profilePhoto.split('/').pop().split('.')[0];
    await deleteOnCloudinary(publicId, 'image');
  }

  await Artist.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, {}, "Artist deleted successfully")
  );
});

/**
 * Get extraction statistics
 * Admin only
 */
const getExtractionStats = asyncHandler(async (req, res) => {
  const stats = await Artist.aggregate([
    {
      $group: {
        _id: '$extractionStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalArtists = await Artist.countDocuments();
  const verifiedArtists = await Artist.countDocuments({ isVerified: true });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        extractionStats: stats,
        totalArtists,
        verifiedArtists,
        verificationRate: totalArtists > 0 ? (verifiedArtists / totalArtists * 100).toFixed(2) : 0
      },
      "Statistics retrieved successfully"
    )
  );
});

/**
 * Enhance single field with AI (optimized workflow)
 * Admin only
 */
const enhanceField = asyncHandler(async (req, res) => {
  const { field, value, context } = req.body;

  console.log('🔧 Enhance field request:', { field, value: value?.substring(0, 50) + '...' });

  if (!field || !value) {
    throw new ApiError(400, "Field name and value are required");
  }

  try {
    const enhancedValue = await aiEnhancer.enhanceField(field, value, context);
    console.log('✅ Field enhanced successfully:', field);
    
    return res.status(200).json(
      new ApiResponse(200, { enhancedValue }, `Field '${field}' enhanced successfully`)
    );
  } catch (error) {
    console.error('❌ Field enhancement error:', error);
    throw new ApiError(500, `Field enhancement failed for '${field}': ${error.message}`);
  }
});

/**
 * Enhance all fields with AI (structured mode)
 * Admin only
 */
const enhanceAllFields = asyncHandler(async (req, res) => {
  const { data, rawText } = req.body;

  console.log('🔧 Enhance all fields request for artist:', data?.artistName);

  if (!data) {
    throw new ApiError(400, "Data is required for enhancement");
  }

  try {
    const enhancedFormData = await aiEnhancer.enhanceStructured(data, rawText);
    console.log('✅ All fields enhanced successfully');
    
    return res.status(200).json(
      new ApiResponse(200, { enhancedFormData }, "All fields enhanced successfully")
    );
  } catch (error) {
    console.error('❌ All fields enhancement error:', error);
    throw new ApiError(500, `Comprehensive enhancement failed: ${error.message}`);
  }
});

/**
 * Generate AI summary (summary mode)
 * Admin only
 */
const generateSummary = asyncHandler(async (req, res) => {
  const { artistName, guruName, gharana, biography, rawText } = req.body;

  console.log('📝 Generate summary request for:', artistName);

  if (!artistName) {
    throw new ApiError(400, "Artist name is required for summary generation");
  }

  try {
    const cleanedData = {
      artistName,
      guruName,
      gharana,
      biography
    };
    
    const summaryData = await aiEnhancer.enhanceSummary(cleanedData, rawText || '');
    console.log('✅ Summary generated successfully');
    
    // Save the generated summary to the database if artistId is provided
    if (req.body.artistId) {
      const artist = await Artist.findById(req.body.artistId);
      if (artist) {
        artist.aiGeneratedSummary = summaryData.summary || summaryData.description || summaryData.biography;
        await artist.save();
      }
    }
    
    return res.status(200).json(
      new ApiResponse(200, summaryData, "Summary generated successfully")
    );
  } catch (error) {
    console.error('❌ Summary generation error:', error);
    throw new ApiError(500, `Summary generation failed: ${error.message}`);
  }
});

/**
 * Get comprehensive AI details (summary mode)
 * Admin only
 */
const getComprehensiveDetails = asyncHandler(async (req, res) => {
  const { artistName, guruName, gharana, rawText } = req.body;

  console.log('🔍 Get comprehensive details request for:', artistName);

  if (!artistName) {
    throw new ApiError(400, "Artist name is required for comprehensive details");
  }

  try {
    const cleanedData = {
      artistName,
      guruName,
      gharana
    };
    
    const details = await aiEnhancer.enhanceSummary(cleanedData, rawText || '');
    console.log('✅ Comprehensive details retrieved successfully');
    
    return res.status(200).json(
      new ApiResponse(200, details, "Comprehensive details retrieved successfully")
    );
  } catch (error) {
    console.error('❌ Comprehensive details error:', error);
    throw new ApiError(500, `Comprehensive details retrieval failed: ${error.message}`);
  }
});

export {
  uploadAndExtractDocument,
  getAllArtistsAdmin,
  getAllArtistsUser,
  getArtistById,
  getArtistByIdAdmin,
  updateArtist,
  updateArtistPhoto,
  verifyArtist,
  deleteArtist,
  getExtractionStats,
  enhanceField,
  enhanceAllFields,
  generateSummary,
  getComprehensiveDetails,
};