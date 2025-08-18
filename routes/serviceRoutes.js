import express from "express";
import {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, admin, createService)
  .get(protect, admin, getServices);

router.route("/:id")
  .get(protect, admin, getService)
  .put(protect, admin, updateService)
  .delete(protect, admin, deleteService);

export default router;
