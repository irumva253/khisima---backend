// routes/serviceRoutes.js
import express from "express";
import {
  createSolution,
  getSolutions,
  getSolution,
  updateSolution,
  deleteSolution,
  getSolutionsByCategory,
  getSolutionCategories,
} from "../controllers/solutionController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   /api/solutions
 * @desc    Solutions CRUD
 */
router
  .route("/")
  .get(getSolutions)                     // Public → Get all solutions
  .post(protect, admin, createSolution); // Admin → Create solution

/**
 * @route   /api/solutions/categories
 * @desc    Get all solution categories
 */
router.route("/categories").get(getSolutionCategories);

/**
 * @route   /api/solutions/category/:categoryId
 * @desc    Get all solutions under a specific category
 */
router.route("/category/:categoryId").get(getSolutionsByCategory);

/**
 * @route   /api/solutions/:id
 * @desc    Single solution operations
 */
router
  .route("/:id")
  .get(getSolution)                      // Public → Get one solution
  .put(protect, admin, updateSolution)   // Admin → Update solution
  .delete(protect, admin, deleteSolution); // Admin → Delete solution

export default router;
