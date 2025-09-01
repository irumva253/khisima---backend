import express from 'express';
import {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats
} from '../controllers/resourceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getResources)
  .post(protect, admin, createResource);

router.route('/stats/summary')
  .get(getResourceStats);

router.route('/:id')
  .get(getResource)
  .put(protect, admin, updateResource)
  .delete(protect, admin, deleteResource);

export default router;