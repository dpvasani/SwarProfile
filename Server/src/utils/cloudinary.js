import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Ensure .env file is loaded
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath, deleteAfterUpload = true) => {
  try {
    console.log("Attempting to upload file:", localFilePath);
    
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.error("File path is invalid or file does not exist:", localFilePath);
      console.error("Current working directory:", process.cwd());
      console.error("Resolved path:", path.resolve(localFilePath));
      return null;
    }

    console.log("File exists, proceeding with upload...");
    
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("Upload successful:", response.secure_url);
    
    // Successfully uploaded, remove the file only if requested
    if (deleteAfterUpload) {
      fs.unlinkSync(localFilePath);
      console.log("Temporary file deleted:", localFilePath);
    }
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    try {
      // Ensure file deletion even if upload fails, only if requested
      if (deleteAfterUpload && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log("Temporary file deleted after error:", localFilePath);
      }
    } catch (unlinkError) {
      console.error("Error removing temporary file:", unlinkError);
    }

    return null;
  }
};

const deleteOnCloudinary = async (public_id, resource_type = "image") => {
  try {
    if (!public_id) return null;

    //delete file from cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: `${resource_type}`,
    });
  } catch (error) {
    return error;
    console.log("delete on cloudinary failed", error);
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
