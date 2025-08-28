import express from "express";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const router = express.Router();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL_S3,
  AWS_REGION,
  AWS_BUCKET_NAME,
} = process.env;

// Initialize S3 client for Tigris with correct configuration
const s3 = new S3Client({
  region: AWS_REGION || "auto",
  endpoint: AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  // Tigris requires these specific settings
  forcePathStyle: true, // This is CRITICAL for Tigris
  tls: true,
  // Custom endpoint configuration for Tigris
  customEndpoint: true,
});

// Generate presigned URL for upload
router.post("/upload", async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ message: "Missing fileName or contentType" });
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // Tigris doesn't support ACLs, so we omit them
    });

    // For Tigris, we need to use a specific approach to generate the presigned URL
    const presignedUrl = await getSignedUrl(s3, command, { 
      expiresIn: 300, // 5 minutes
      // Force the SDK to use the correct endpoint
      signingRegion: AWS_REGION || "auto",
    });

    res.json({ presignedUrl, key });
  } catch (err) {
    console.error("Presigned URL error:", err);
    res.status(500).json({ 
      message: "Failed to generate presigned URL", 
      error: err.message,
      name: err.name
    });
  }
});

// Delete file from Tigris
router.delete("/delete", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ message: "Missing file key" });

    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ 
      message: "Failed to delete file", 
      error: err.message,
      name: err.name
    });
  }
});

export default router;