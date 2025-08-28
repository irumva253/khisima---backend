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
    slug,
    smallDescription,
    description,
    category,
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

  // Use provided slug or generate from title
  const serviceSlug = slug || slugify(title, { lower: true, strict: true });

  // Ensure description is properly formatted
  let formattedDescription = description;
  if (typeof description === 'string') {
    try {
      // Parse and validate the JSON structure
      const parsedDesc = JSON.parse(description);
      if (parsedDesc && parsedDesc.type === 'doc') {
        formattedDescription = parsedDesc;
      }
    } catch (error) {
      // If it's not valid JSON, create a simple paragraph structure
      formattedDescription = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [
              {
                type: 'text',
                text: description
              }
            ]
          }
        ]
      };
    }
  }

  const service = new Service({
    title,
    slug: serviceSlug,
    smallDescription,
    description: formattedDescription,
    category,
    status: status || "draft",
    fileKey: fileKey || "",
    videoUrl: videoUrl || "",
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
  
  // Ensure descriptions are properly formatted
  const formattedServices = services.map(service => {
    if (typeof service.description === 'string') {
      try {
        service.description = JSON.parse(service.description);
      } catch (error) {
        // If parsing fails, create a basic structure
        service.description = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: service.description
                }
              ]
            }
          ]
        };
      }
    }
    return service;
  });
  
  res.json({ success: true, data: formattedServices });
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
    // Ensure description is properly formatted
    if (typeof service.description === 'string') {
      try {
        service.description = JSON.parse(service.description);
      } catch (error) {
        // If parsing fails, create a basic structure
        service.description = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: service.description
                }
              ]
            }
          ]
        };
      }
    }

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
    slug,
    smallDescription,
    description,
    category,
    status,
    fileKey,
    videoUrl,
  } = req.body;

  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  // Format description if needed
  let formattedDescription = description;
  if (typeof description === 'string') {
    try {
      const parsedDesc = JSON.parse(description);
      if (parsedDesc && parsedDesc.type === 'doc') {
        formattedDescription = parsedDesc;
      }
    } catch (error) {
      formattedDescription = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [
              {
                type: 'text',
                text: description
              }
            ]
          }
        ]
      };
    }
  }

  service.title = title || service.title;
  service.slug = slug ? slug : (title ? slugify(title, { lower: true, strict: true }) : service.slug);
  service.smallDescription = smallDescription || service.smallDescription;
  service.description = formattedDescription !== undefined ? formattedDescription : service.description;
  service.category = category || service.category;
  service.status = status || service.status;
  service.fileKey = fileKey !== undefined ? fileKey : service.fileKey;
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
  
  // Ensure descriptions are properly formatted
  const formattedServices = services.map(service => {
    if (typeof service.description === 'string') {
      try {
        service.description = JSON.parse(service.description);
      } catch (error) {
        service.description = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: service.description
                }
              ]
            }
          ]
        };
      }
    }
    return service;
  });
  
  res.json({ success: true, data: formattedServices });
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