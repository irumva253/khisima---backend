import express from 'express';
import { body, validationResult } from 'express-validator';
import NotificationController from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js'; 
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// --- Validation middleware for contact form ---
const contactFormValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('First name can only contain letters, spaces, apostrophes, and hyphens'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Last name can only contain letters, spaces, apostrophes, and hyphens'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 255 }).withMessage('Email address is too long'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[\d\s\-()]+$/).withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),

  body('preferredLanguage')
    .notEmpty().withMessage('Preferred language is required')
    .isIn(['English', 'Kinyarwanda', 'French', 'Swahili', 'Other']).withMessage('Please select a valid language'),

  body('otherLanguage')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Language name cannot exceed 30 characters')
    .if(body('preferredLanguage').equals('Other'))
    .notEmpty().withMessage('Please specify the language when selecting "Other"'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters')
];

// --- Validation middleware for updates ---
const updateValidation = [
  body('status')
    .optional()
    .isIn(['unread', 'read', 'responded', 'archived']).withMessage('Invalid status value'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority value'),

  body('category')
    .optional()
    .isIn(['general', 'support', 'business', 'partnership', 'feedback', 'other']).withMessage('Invalid category value'),

  body('responseNote')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Response note cannot exceed 1000 characters'),

  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 30);
      } else if (typeof value === 'string') {
        return value.length <= 30;
      }
      return false;
    })
    .withMessage('Tags must be strings with maximum 30 characters each')
];

// --- Middleware to handle validation errors ---
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ------------------- PUBLIC ROUTES ------------------- //

router.post(
  '/contact',
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      message: 'Too many contact submissions. Please try again in 15 minutes.'
    }
  }),
  contactFormValidation,
  validateRequest,
  NotificationController.createNotification
);

// ------------------- ADMIN ROUTES ------------------- //

router.get('/', protect, admin, NotificationController.getAllNotifications);
router.get('/dashboard', protect, admin, NotificationController.getDashboardStats);
router.get('/export', protect, admin, NotificationController.exportNotifications);
router.get('/:id', protect, admin, NotificationController.getNotificationById);

router.put('/:id', protect, admin, updateValidation, validateRequest, NotificationController.updateNotification);

router.put(
  '/bulk/update',
  protect,
  admin,
  [
    body('ids').isArray({ min: 1 }).withMessage('Please provide at least one notification ID'),
    body('ids.*').isMongoId().withMessage('Invalid notification ID format'),
    ...updateValidation
  ],
  validateRequest,
  NotificationController.bulkUpdateNotifications
);

router.delete('/:id', protect, admin, NotificationController.deleteNotification);

router.delete(
  '/bulk/delete',
  protect,
  admin,
  [
    body('ids').isArray({ min: 1 }).withMessage('Please provide at least one notification ID'),
    body('ids.*').isMongoId().withMessage('Invalid notification ID format')
  ],
  validateRequest,
  NotificationController.bulkDeleteNotifications
);

// ------------------- QUICK ACTIONS ------------------- //

router.post('/:id/mark-read', protect, admin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.markAsRead(req.user.id);

    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:id/respond', protect, admin,
  [
    body('responseNote')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Response note cannot exceed 1000 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      await notification.markAsResponded(req.user.id, req.body.responseNote);

      res.json({ success: true, message: 'Notification marked as responded', data: notification });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as responded',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ------------------- ERROR HANDLING ------------------- //

router.use((error, req, res, next) => {
  console.error('Notification route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in notification routes',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;
