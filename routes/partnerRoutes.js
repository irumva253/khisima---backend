import express from 'express';
import {
  createPartner,
  getPartners,
  updatePartner,
  deletePartner
} from '../controllers/partnerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, createPartner)
  .get(getPartners);

router.route('/:id')
  .put(protect, admin, updatePartner)
  .delete(protect, admin, deletePartner);

export default router;