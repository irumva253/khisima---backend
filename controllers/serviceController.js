// controllers/serviceController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Service from "../models/serviceModel.js";
import ServiceCategory from "../models/serviceCategoryModel.js";
import slugify from "slugify";

/**
 * @desc    Create a new service
 * @route   POST /api/services
 * @access  Private/Admin
 */
const createService = asyncHandler(async (req, res) => {
  const {
    title,
    smallDescription,
    description,
    category,
    price,
    status,
    fileKey,
    videoUrl,
  } = req.body;

  // Validate category exists
  const categoryExists = await ServiceCategory.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error("Invalid category ID");
  }

  const service = new Service({
    title,
    slug: slugify(title, { lower: true, strict: true }),
    smallDescription,
    description,
    category,
    price,
    status: status || "draft",
    fileKey,
    videoUrl,
  });

  const createdService = await service.save();
  res.status(201).json({ success: true, data: createdService });
});

/**
 * @desc    Get all services
 * @route   GET /api/services
 * @access  Public
 */
const getServices = asyncHandler(async (req, res) => {
  const services = await Service.find().populate(
    "category",
    "title caption iconSvg"
  );
  res.json({ success: true, data: services });
});

/**
 * @desc    Get a single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    "category",
    "title caption iconSvg"
  );

  if (service) {
    res.json({ success: true, data: service });
  } else {
    res.status(404);
    throw new Error("Service not found");
  }
});

/**
 * @desc    Update a service
 * @route   PUT /api/services/:id
 * @access  Private/Admin
 */
const updateService = asyncHandler(async (req, res) => {
  const {
    title,
    smallDescription,
    description,
    category,
    price,
    status,
    fileKey,
    videoUrl,
  } = req.body;

  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  service.title = title || service.title;
  service.slug = title ? slugify(title, { lower: true, strict: true }) : service.slug;
  service.smallDescription = smallDescription || service.smallDescription;
  service.description = description || service.description;
  service.category = category || service.category;
  service.price = price || service.price;
  service.status = status || service.status;
  service.fileKey = fileKey || service.fileKey;
  service.videoUrl = videoUrl || service.videoUrl;

  const updatedService = await service.save();
  res.json({ success: true, data: updatedService });
});

/**
 * @desc    Delete a service
 * @route   DELETE /api/services/:id
 * @access  Private/Admin
 */
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  await service.deleteOne();
  res.json({ success: true, data: {} });
});

/**
 * @desc    Get all services by category
 * @route   GET /api/services/category/:categoryId
 * @access  Public
 */
const getServicesByCategory = asyncHandler(async (req, res) => {
  const services = await Service.find({ category: req.params.categoryId }).populate(
    "category",
    "title caption iconSvg"
  );
  res.json({ success: true, data: services });
});

/**
 * @desc    Get all service categories
 * @route   GET /api/services/categories
 * @access  Public
 */
const getServiceCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find();
  res.json({ success: true, data: categories });
});

export {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getServicesByCategory,
  getServiceCategories,
};
