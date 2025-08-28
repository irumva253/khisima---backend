import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

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
  forcePathStyle: true, // This is CRITICAL for Tigris
  tls: true,
  customEndpoint: true,
});

// Function to delete file from S3
export const deleteFileFromS3 = async (key) => {
  try {
    if (!key) {
      throw new Error("File key is required");
    }

    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);
    console.log(`Successfully deleted file: ${key}`);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Optional: Function to check if file exists
export const checkFileExists = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
};

export default s3;