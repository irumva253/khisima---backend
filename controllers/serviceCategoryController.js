import ServiceCategory from '../models/serviceCategoryModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Create a new service category
// @route   POST /api/service-categories
// @access  Private/Admin
export const createServiceCategory = asyncHandler(async (req, res) => {
  const { title, caption, description, iconSvg } = req.body;

  const serviceCategory = await ServiceCategory.create({
    title,
    caption,
    description,
    iconSvg,
  });

  res.status(201).json({
    success: true,
    data: serviceCategory,
  });
});

// @desc    Get all service categories
// @route   GET /api/service-categories
// @access  Private/Admin
export const getServiceCategories = asyncHandler(async (req, res) => {
  const serviceCategories = await ServiceCategory.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: serviceCategories.length,
    data: serviceCategories,
  });
});

// @desc    Get a single service category
// @route   GET /api/service-categories/:id
// @access  Private/Admin
export const getServiceCategory = asyncHandler(async (req, res) => {
  const serviceCategory = await ServiceCategory.findById(req.params.id);

  if (!serviceCategory) {
    return res.status(404).json({
      success: false,
      message: 'Service category not found',
    });
  }

  res.status(200).json({
    success: true,
    data: serviceCategory,
  });
});

// @desc    Update a service category
// @route   PUT /api/service-categories/:id
// @access  Private/Admin
export const updateServiceCategory = asyncHandler(async (req, res) => {
  const { title, caption, description, iconSvg } = req.body;

  const serviceCategory = await ServiceCategory.findByIdAndUpdate(
    req.params.id,
    { title, caption, description, iconSvg },
    { new: true, runValidators: true }
  );

  if (!serviceCategory) {
    return res.status(404).json({
      success: false,
      message: 'Service category not found',
    });
  }

  res.status(200).json({
    success: true,
    data: serviceCategory,
  });
});

// @desc    Delete a service category
// @route   DELETE /api/service-categories/:id
// @access  Private/Admin
export const deleteServiceCategory = asyncHandler(async (req, res) => {
  const serviceCategory = await ServiceCategory.findByIdAndDelete(req.params.id);

  if (!serviceCategory) {
    return res.status(404).json({
      success: false,
      message: 'Service category not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Service category removed',
  });
});
