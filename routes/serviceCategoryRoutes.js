import express from 'express';
import { body } from 'express-validator';
import {
  createServiceCategory,
  getServiceCategories,
  getServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from '../controllers/serviceCategoryController.js';
import { admin, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js'; 

const router = express.Router();

// Validation rules for creating/updating service category
const serviceCategoryValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('caption').optional().isString().withMessage('Caption must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('iconUrl').optional().isURL().withMessage('Icon URL must be a valid URL'),
];

router
  .route('/')
  .post(protect, admin, serviceCategoryValidation, validateRequest, createServiceCategory)
  .get(protect, admin, getServiceCategories);

router
  .route('/:id')
  .get(protect, admin, getServiceCategory)
  .put(protect, admin, serviceCategoryValidation, validateRequest, updateServiceCategory)
  .delete(protect, admin, deleteServiceCategory);

export default router;
