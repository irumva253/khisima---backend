import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

/**
 * Upload file to S3 bucket
 * @param {Buffer} fileBuffer - File buffer data
 * @param {string} key - S3 object key (file path)
 * @param {string} contentType - File MIME type
 * @returns {Promise<Object>} Upload result
 */
export const uploadToS3 = async (fileBuffer, key, contentType) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'private', // Private access for resume files
      ServerSideEncryption: 'AES256',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'career-portal'
      }
    };

    const result = await s3.upload(params).promise();
    
    console.log(`File uploaded successfully to S3: ${key}`);
    
    return {
      success: true,
      key: result.Key,
      location: result.Location,
      etag: result.ETag
    };
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3 bucket
 * @param {string} key - S3 object key (file path)
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };

    const result = await s3.deleteObject(params).promise();
    
    console.log(`File deleted successfully from S3: ${key}`);
    
    return {
      success: true,
      key,
      result
    };
  } catch (error) {
    console.error('S3 delete failed:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for private file access
 * @param {string} key - S3 object key (file path)
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Presigned URL
 */
export const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    
    return url;
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key (file path)
 * @returns {Promise<boolean>} File exists
 */
export const fileExistsInS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get file metadata from S3
 * @param {string} key - S3 object key (file path)
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };

    const result = await s3.headObject(params).promise();
    
    return {
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified,
      etag: result.ETag,
      metadata: result.Metadata
    };
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    throw new Error(`Failed to get file information: ${error.message}`);
  }
};

export default {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  fileExistsInS3,
  getFileMetadata
};