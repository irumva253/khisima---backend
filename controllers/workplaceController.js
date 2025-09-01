import Workplace from '../models/workplaceModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all workplaces
// @route   GET /api/workplaces
// @access  Public
const getWorkplaces = asyncHandler(async (req, res) => {
  const {
    status = 'active',
    featured,
    country,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query object
  const query = { status };

  if (featured !== undefined) {
    query.isFeatured = featured === 'true';
  }

  if (country) {
    query['country.name'] = new RegExp(country, 'i');
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const workplaces = await Workplace.find(query)
    .sort(sort)
    .limit(limitNum)
    .skip(skip);

  const total = await Workplace.countDocuments(query);

  res.json({
    success: true,
    data: workplaces,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  });
});

// @desc    Get single workplace
// @route   GET /api/workplaces/:id
// @access  Public
const getWorkplaceById = asyncHandler(async (req, res) => {
  const workplace = await Workplace.findById(req.params.id);

  if (!workplace) {
    res.status(404);
    throw new Error('Workplace not found');
  }

  res.json({
    success: true,
    data: workplace
  });
});

// @desc    Create workplace
// @route   POST /api/workplaces
// @access  Private/Admin
const createWorkplace = asyncHandler(async (req, res) => {
  const workplace = new Workplace(req.body);
  const createdWorkplace = await workplace.save();

  res.status(201).json({
    success: true,
    data: createdWorkplace
  });
});

// @desc    Update workplace
// @route   PUT /api/workplaces/:id
// @access  Private/Admin
const updateWorkplace = asyncHandler(async (req, res) => {
  const workplace = await Workplace.findById(req.params.id);

  if (!workplace) {
    res.status(404);
    throw new Error('Workplace not found');
  }

  const updatedWorkplace = await Workplace.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedWorkplace
  });
});

// @desc    Delete workplace
// @route   DELETE /api/workplaces/:id
// @access  Private/Admin
const deleteWorkplace = asyncHandler(async (req, res) => {
  const workplace = await Workplace.findById(req.params.id);

  if (!workplace) {
    res.status(404);
    throw new Error('Workplace not found');
  }

  await Workplace.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Workplace deleted successfully'
  });
});

// @desc    Get workplace statistics
// @route   GET /api/workplaces/stats/summary
// @access  Public
const getWorkplaceStats = asyncHandler(async (req, res) => {
  const total = await Workplace.countDocuments({ status: 'active' });
  const featured = await Workplace.countDocuments({ 
    status: 'active', 
    isFeatured: true 
  });
  const byCountry = await Workplace.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$country.name', count: { $sum: 1 } } }
  ]);
  const averageRating = await Workplace.aggregate([
    { $match: { status: 'active', 'rating.count': { $gt: 0 } } },
    { $group: { _id: null, average: { $avg: '$rating.average' } } }
  ]);

  const stats = {
    total,
    featured,
    byCountry: byCountry.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    averageRating: averageRating[0]?.average || 0
  };

  res.json({
    success: true,
    data: stats
  });
});

export {
  getWorkplaces,
  getWorkplaceById,
  createWorkplace,
  updateWorkplace,
  deleteWorkplace,
  getWorkplaceStats
};