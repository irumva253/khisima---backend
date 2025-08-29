import SolutionCategory from '../models/solutionCategoryModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Create a new solution category
// @route   POST /api/solution-categories
// @access  Private/Admin
export const createSolutionCategory = asyncHandler(async (req, res) => {
  const { title, caption, description, iconSvg } = req.body;

  const solutionCategory = await SolutionCategory.create({
    title,
    caption,
    description,
    iconSvg,
  });

  res.status(201).json({ success: true, data: solutionCategory });
});

// @desc    Get all solution categories
// @route   GET /api/solution-categories
// @access  Private/Admin
export const getSolutionCategories = asyncHandler(async (req, res) => {
  const solutionCategories = await SolutionCategory.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: solutionCategories.length,
    data: solutionCategories,
  });
});

// @desc    Get a single solution category
// @route   GET /api/solution-categories/:id
// @access  Private/Admin
export const getSolutionCategory = asyncHandler(async (req, res) => {
  const solutionCategory = await SolutionCategory.findById(req.params.id);

  if (!solutionCategory) {
    return res.status(404).json({
      success: false,
      message: 'Solution category not found',
    });
  }

  res.status(200).json({
    success: true,
    data: solutionCategory,
  });
});

// @desc    Update a solution category
// @route   PUT /api/solution-categories/:id
// @access  Private/Admin
export const updateSolutionCategory = asyncHandler(async (req, res) => {
  const { title, caption, description, iconSvg } = req.body;

  const solutionCategory = await SolutionCategory.findByIdAndUpdate(
    req.params.id,
    { title, caption, description, iconSvg },
    { new: true, runValidators: true }
  );

  if (!solutionCategory) {
    return res.status(404).json({
      success: false,
      message: 'Solution category not found',
    });
  }

  res.status(200).json({
    success: true,
    data: solutionCategory,
  });
});

// @desc    Delete a solution category
// @route   DELETE /api/solution-categories/:id
// @access  Private/Admin
export const deleteSolutionCategory = asyncHandler(async (req, res) => {
  const solutionCategory = await SolutionCategory.findByIdAndDelete(req.params.id);

  if (!solutionCategory) {
    return res.status(404).json({
      success: false,
      message: 'Solution category not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Solution category removed',
  });
});
