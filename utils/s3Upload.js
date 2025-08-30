import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Tigris-specific configuration
const isTigris = process.env.AWS_ENDPOINT_URL_S3 && 
                 process.env.AWS_ENDPOINT_URL_S3.includes('tigris') || 
                 process.env.AWS_ENDPOINT_URL_S3.includes('t3.storage.dev');

//console.log('🌐 Using storage provider:', isTigris ? 'Tigris' : 'AWS S3');

// Configure AWS SDK for Tigris
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'auto',
};

// Add Tigris-specific configuration
if (isTigris) {
  s3Config.endpoint = process.env.AWS_ENDPOINT_URL_S3;
  s3Config.s3ForcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === 'true' || true;
  s3Config.signatureVersion = 'v4';
  
//  console.log('Tigris endpoint:', process.env.AWS_ENDPOINT_URL_S3);
}

const s3 = new AWS.S3(s3Config);
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME environment variable is required');
}

/**
 * Upload file to Tigris/S3
 */
export const uploadToS3 = async (fileBuffer, key, contentType) => {
  try {
    console.log('Uploading to:', isTigris ? 'Tigris' : 'AWS S3', {
      bucket: BUCKET_NAME,
      key: key,
      size: fileBuffer.length,
      type: contentType
    });

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    };

    // For Tigris, you might not need ServerSideEncryption
    if (!isTigris) {
      uploadParams.ServerSideEncryption = 'AES256';
    }

    const result = await s3.upload(uploadParams).promise();
    
    console.log('Upload successful:', {
      key: result.Key,
      location: result.Location
    });

    return result;
  } catch (error) {
    console.error('Upload failed:', error.message);
    
    // Tigris-specific error handling
    if (isTigris) {
      if (error.code === 'NoSuchBucket') {
        throw new Error(`Tigris bucket '${BUCKET_NAME}' does not exist. Create it in Tigris console.`);
      } else if (error.code === 'AccessDenied') {
        throw new Error('Tigris access denied. Check your Tigris credentials and permissions.');
      }
    }
    
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download link');
  }
};

/**
 * Delete file from Tigris/S3
 */
export const deleteFromS3 = async (key) => {
  try {
    console.log('Deleting from:', isTigris ? 'Tigris' : 'AWS S3', {
      bucket: BUCKET_NAME,
      key: key
    });

    const result = await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key,
    }).promise();
    
   // console.log('Delete successful');
    return result;
  } catch (error) {
  //  console.error('❌ Delete failed:', error.message);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Test Tigris/S3 connection
 */
export const testS3Connection = async () => {
  try {
    if (isTigris) {
      // For Tigris, use a simpler test - try to list objects
      await s3.listObjectsV2({ 
        Bucket: BUCKET_NAME, 
        MaxKeys: 1 
      }).promise();
    //  console.log('Tigris connection successful');
    } else {
      // For AWS S3, use headBucket
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    //  console.log('AWS S3 connection successful');
    }
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    // if (isTigris) {
    //   console.log('💡 Tigris troubleshooting:');
    //   console.log('   1. Check if bucket exists in Tigris console');
    //   console.log('   2. Verify Tigris credentials');
    //   console.log('   3. Check endpoint URL: ', process.env.AWS_ENDPOINT_URL_S3);
    // }
    
    return false;
  }
};

// Test connection on startup
// testS3Connection().then(success => {
//   if (success) {
//     console.log('🚀 Storage provider initialized successfully');
//   } else {
//     console.log('⚠️  Storage provider may not be fully functional');
//   }
// });

export default {
  uploadToS3,
  deleteFromS3,
  testS3Connection
};