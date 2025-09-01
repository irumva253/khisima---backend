import Resource from '../models/resourceModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
const getResources = asyncHandler(async (req, res) => {
  const {
    category,
    type,
    search,
    featured,
    status = 'published',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query object
  const query = { status };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (type) {
    query.type = type;
  }

  if (featured !== undefined) {
    query.isFeatured = featured === 'true';
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

  const resources = await Resource.find(query)
    .sort(sort)
    .limit(limitNum)
    .skip(skip);

  const total = await Resource.countDocuments(query);

  res.json({
    success: true,
    data: resources,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  });
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Increment download count if accessing content
  if (req.query.access === 'true') {
    resource.downloads += 1;
    await resource.save();
  }

  res.json({
    success: true,
    data: resource
  });
});

// @desc    Create resource
// @route   POST /api/resources
// @access  Private/Admin
const createResource = asyncHandler(async (req, res) => {
  const resource = new Resource(req.body);
  const createdResource = await resource.save();

  res.status(201).json({
    success: true,
    data: createdResource
  });
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const updatedResource = await Resource.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedResource
  });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  await Resource.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
});

// @desc    Get resource statistics
// @route   GET /api/resources/stats/summary
// @access  Public
const getResourceStats = asyncHandler(async (req, res) => {
  const total = await Resource.countDocuments({ status: 'published' });
  const featured = await Resource.countDocuments({ 
    status: 'published', 
    isFeatured: true 
  });
  const byCategory = await Resource.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  const totalDownloads = await Resource.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: null, total: { $sum: '$downloads' } } }
  ]);

  const stats = {
    total,
    featured,
    byCategory: byCategory.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    totalDownloads: totalDownloads[0]?.total || 0
  };

  res.json({
    success: true,
    data: stats
  });
});

export {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats
};