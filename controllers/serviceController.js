import Service from "../models/serviceModel.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
});

// @desc    Get all services
// @route   GET /api/services
// @access  Private/Admin
export const getServices = asyncHandler(async (req, res) => {
  const services = await Service.find().populate("category");
  res.status(200).json({ success: true, data: services });
});

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private/Admin
export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate("category");
  if (!service) return res.status(404).json({ success: false, message: "Service not found" });
  res.status(200).json({ success: true, data: service });
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!service) return res.status(404).json({ success: false, message: "Service not found" });
  res.status(200).json({ success: true, data: service });
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service not found" });
  res.status(200).json({ success: true, data: {} });
});
