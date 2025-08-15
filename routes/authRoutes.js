import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('firstName').notEmpty().withMessage('First name is required').trim().isLength({ min: 2 }),
  body('lastName').notEmpty().withMessage('Last name is required').trim().isLength({ min: 2 }),
  body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('agreeToTerms').isBoolean().withMessage('You must agree to the terms and conditions')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateUpdateProfile = [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isLength({ min: 10 }),
  body('password').optional().isLength({ min: 8 })
];

// Routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, validateUpdateProfile, updateProfile);

export default router;