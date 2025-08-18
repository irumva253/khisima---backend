import express from "express";
import {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getServicesByCategory,
  getServiceCategories,
  
} from "../controllers/serviceController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// serviceRoutes.js
router.route('/')
  .get(getServices)
  .post(protect, admin, createService);

// Add this new route
router.route('/category/:categoryId')
  .get(getServicesByCategory);

router.route('/:id')
  .get(getService)
  .put(protect, admin, updateService)
  .delete(protect, admin, deleteService);

// Add this if you want categories via service API
router.route('/categories')
  .get(getServiceCategories);

export default router;
