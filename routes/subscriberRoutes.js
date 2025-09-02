import express from 'express';
import { body } from 'express-validator';
import {
  getSubscribers,
  getSubscriberStats,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  unsubscribeSubscriber,
  bulkOperations,
  exportSubscribers
} from '../controllers/subscriberController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for public endpoints
const subscribeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many subscription attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateSubscriber = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('preferences.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid frequency preference'),
  body('preferences.topics')
    .optional()
    .isArray()
    .withMessage('Topics must be an array'),
  body('preferences.topics.*')
    .optional()
    .isIn(['language-tech', 'industry-insights', 'company-updates', 'research'])
    .withMessage('Invalid topic preference')
];

const validateBulkOperation = [
  body('action')
    .isIn(['delete', 'activate', 'deactivate', 'unsubscribe'])
    .withMessage('Invalid bulk action'),
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs array is required and must not be empty'),
  body('ids.*')
    .isMongoId()
    .withMessage('Invalid subscriber ID')
];

// Public routes
router.post('/', subscribeRateLimit, validateSubscriber, createSubscriber);
router.put('/unsubscribe/:id', unsubscribeSubscriber);

// Protected admin routes
router.use(protect, admin);

router.route('/')
  .get(getSubscribers);

router.get('/stats', getSubscriberStats);
router.get('/export', exportSubscribers);
router.post('/bulk', validateBulkOperation, bulkOperations);

router.route('/:id')
  .put(updateSubscriber)
  .delete(deleteSubscriber);

export default router;