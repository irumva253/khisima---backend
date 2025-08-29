import express from 'express';
import { body } from 'express-validator';
import {
  createSolutionCategory,
  getSolutionCategories,
  getSolutionCategory,
  updateSolutionCategory,
  deleteSolutionCategory,
} from '../controllers/solutionCategoryController.js';
import { admin, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js'; 

const router = express.Router();

// Validation rules for creating/updating solution category
const solutionCategoryValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('caption').optional().isString().withMessage('Caption must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('iconUrl').optional().isURL().withMessage('Icon URL must be a valid URL'),
];

// Public routes
router.route('/').get(getSolutionCategories);
router.route('/:id').get(getSolutionCategory);

// Admin-only routes
router
  .route('/')
  .post(protect, admin, solutionCategoryValidation, validateRequest, createSolutionCategory);

router
  .route('/:id')
  .put(protect, admin, solutionCategoryValidation, validateRequest, updateSolutionCategory)
  .delete(protect, admin, deleteSolutionCategory);

export default router;
