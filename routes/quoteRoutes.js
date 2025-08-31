import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  submitQuoteRequest,
  getQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
  getQuoteStats,
  bulkUpdateQuotes,
  addCommunication,
  exportQuotes,
  getQuoteFileDownloadUrl
} from '../controllers/quoteController.js';

const router = express.Router();

// Configure multer for memory storage (for S3 uploads)
const storage = multer.memoryStorage();

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only document files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Middleware to handle multer errors
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use "files" field for uploads.'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Public Routes
router.post('/', upload.array('files', 10), handleMulterErrors, submitQuoteRequest);

// Admin Routes (Protected)
router.use(protect);
router.use(admin);

// GET routes
router.get('/stats', getQuoteStats);
router.get('/export', exportQuotes);
router.get('/', getQuotes);
router.get('/:id', getQuoteById);
router.get('/:id/files/:fileId/download', getQuoteFileDownloadUrl);

// PUT routes
router.put('/bulk', bulkUpdateQuotes);
router.put('/:id', updateQuote);

// POST routes
router.post('/:id/communications', addCommunication);

// DELETE routes
router.delete('/:id', deleteQuote);

export default router;