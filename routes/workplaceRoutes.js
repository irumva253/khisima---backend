import express from 'express';
import {
  getWorkplaces,
  getWorkplaceById,
  createWorkplace,
  updateWorkplace,
  deleteWorkplace,
  getWorkplaceStats
} from '../controllers/workplaceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getWorkplaces)
  .post(protect, admin, createWorkplace);

router.route('/stats/summary')
  .get(getWorkplaceStats);

router.route('/:id')
  .get(getWorkplaceById)
  .put(protect, admin, updateWorkplace)
  .delete(protect, admin, deleteWorkplace);

export default router;