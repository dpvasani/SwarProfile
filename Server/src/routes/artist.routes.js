import { Router } from "express";
import {
  uploadAndExtractDocument,
  getAllArtistsAdmin,
  getAllArtistsUser,
  getArtistById,
  updateArtist,
  updateArtistPhoto,
  verifyArtist,
  deleteArtist,
  getExtractionStats,
  enhanceField,
  enhanceAllFields,
  generateSummary,
  getComprehensiveDetails
} from "../controllers/artist.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { validateDocumentFile, validateImageFile, sanitizeBody } from "../middlewares/fileValidation.middleware.js";

const router = Router();

// AI Enhancement routes
router.route("/admin/enhance-field").post(verifyJWT, verifyAdmin, sanitizeBody, enhanceField);
router.route("/admin/enhance-all").post(verifyJWT, verifyAdmin, sanitizeBody, enhanceAllFields);
router.route("/admin/generate-summary").post(verifyJWT, verifyAdmin, sanitizeBody, generateSummary);
router.route("/admin/comprehensive-details").post(verifyJWT, verifyAdmin, sanitizeBody, getComprehensiveDetails);

// Public routes (User access)
router.route("/").get(sanitizeBody, getAllArtistsUser);
router.route("/:id").get(sanitizeBody, getArtistById);

// Protected routes (Admin only)
router.route("/admin/upload").post(
  verifyJWT,
  verifyAdmin,
  upload.single("document"),
  validateDocumentFile,
  uploadAndExtractDocument
);

router.route("/admin/all").get(verifyJWT, verifyAdmin, sanitizeBody, getAllArtistsAdmin);

router.route("/admin/stats").get(verifyJWT, verifyAdmin, sanitizeBody, getExtractionStats);

router.route("/admin/:id").patch(verifyJWT, verifyAdmin, sanitizeBody, updateArtist);

router.route("/admin/:id/photo").patch(
  verifyJWT,
  verifyAdmin,
  upload.single("photo"),
  validateImageFile,
  updateArtistPhoto
);

router.route("/admin/:id/verify").patch(verifyJWT, verifyAdmin, sanitizeBody, verifyArtist);

router.route("/admin/:id").delete(verifyJWT, verifyAdmin, sanitizeBody, deleteArtist);

export default router;