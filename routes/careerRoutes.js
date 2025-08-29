import express from 'express';
import multer from 'multer';
import {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats
} from '../controllers/careerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is a resume (PDF, DOC, DOCX)
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Resume file size cannot exceed 5MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file upload'
      });
    }
  }
  
  if (error.message === 'Only PDF, DOC, and DOCX files are allowed for resumes') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF, DOC, and DOCX files are allowed for resumes'
    });
  }
  
  next(error);
};

// Public Routes
router.route('/apply')
  .post(upload.single('resumeFile'), handleMulterError, submitApplication);

// Admin Routes
router.route('/applications')
  .get(protect, admin, getApplications);

router.route('/applications/:id')
  .get(protect, admin, getApplicationById)
  .delete(protect, admin, deleteApplication);

router.route('/applications/:id/status')
  .put(protect, admin, updateApplicationStatus);

router.route('/stats')
  .get(protect, admin, getApplicationStats);

export default router;