// routes/serviceRoutes.js
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

/**
 * @route   /api/services
 * @desc    Services CRUD
 */
router
  .route("/")
  .get(getServices)                     // Public → Get all services
  .post(protect, admin, createService); // Admin → Create service

/**
 * @route   /api/services/categories
 * @desc    Get all service categories
 */
router.route("/categories").get(getServiceCategories);

/**
 * @route   /api/services/category/:categoryId
 * @desc    Get all services under a specific category
 */
router.route("/category/:categoryId").get(getServicesByCategory);

/**
 * @route   /api/services/:id
 * @desc    Single service operations
 */
router
  .route("/:id")
  .get(getService)                      // Public → Get one service
  .put(protect, admin, updateService)   // Admin → Update service
  .delete(protect, admin, deleteService); // Admin → Delete service

export default router;
