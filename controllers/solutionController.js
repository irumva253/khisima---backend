// controllers/solutionController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Solution from "../models/solutionModel.js";
import SolutionCategory from "../models/solutionCategoryModel.js";
import slugify from "slugify";

/**
 * @desc    Create a new solution
 * @route   POST /api/solutions
 * @access  Private/Admin
 */
const createSolution = asyncHandler(async (req, res) => {
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
  const categoryExists = await SolutionCategory.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error("Invalid category ID");
  }

  // Use provided slug or generate from title
  const solutionSlug = slug || slugify(title, { lower: true, strict: true });

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

  const solution = new Solution({
    title,
    slug: solutionSlug,
    smallDescription,
    description: formattedDescription,
    category,
    status: status || "draft",
    fileKey: fileKey || "",
    videoUrl: videoUrl || "",
  });

  const createdSolution = await solution.save();

  res.status(201).json({ success: true, data: createdSolution });
});

/**
 * @desc    Get all solutions
 * @route   GET /api/solutions
 * @access  Public
 */
const getSolutions = asyncHandler(async (req, res) => {
  const solutions = await Solution.find().populate(
    "category",
    "title caption iconSvg"
  );
  
  // Ensure descriptions are properly formatted
  const formattedSolutions = solutions.map(solution => {
    if (typeof solution.description === 'string') {
      try {
        solution.description = JSON.parse(solution.description);
      } catch (error) {
        // If parsing fails, create a basic structure
        solution.description = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: solution.description
                }
              ]
            }
          ]
        };
      }
    }
    return solution;
  });

  res.json({ success: true, data: formattedSolutions });
});

/**
 * @desc    Get a single solution by ID
 * @route   GET /api/solutions/:id
 * @access  Public
 */
const getSolution = asyncHandler(async (req, res) => {
  const solution = await Solution.findById(req.params.id).populate(
    "category",
    "title caption iconSvg"
  );

  if (solution) {
    // Ensure description is properly formatted
    if (typeof solution.description === 'string') {
      try {
        solution.description = JSON.parse(solution.description);
      } catch (error) {
        // If parsing fails, create a basic structure
        solution.description = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: solution.description
                }
              ]
            }
          ]
        };
      }
    }

    res.json({ success: true, data: solution });
  } else {
    res.status(404);
    throw new Error("Solution not found");
  }
});

/**
 * @desc    Update a solution
 * @route   PUT /api/solutions/:id
 * @access  Private/Admin
 */
const updateSolution = asyncHandler(async (req, res) => {
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

  const solution = await Solution.findById(req.params.id);

  if (!solution) {
    res.status(404);
    throw new Error("Solution not found");
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

  solution.title = title || solution.title;
  solution.slug = slug ? slug : (title ? slugify(title, { lower: true, strict: true }) : solution.slug);
  solution.smallDescription = smallDescription || solution.smallDescription;
  solution.description = formattedDescription !== undefined ? formattedDescription : solution.description;
  solution.category = category || solution.category;
  solution.status = status || solution.status;
  solution.fileKey = fileKey !== undefined ? fileKey : solution.fileKey;
  solution.videoUrl = videoUrl || solution.videoUrl;

  const updatedSolution = await solution.save();

  res.json({ success: true, data: updatedSolution });
});

/**
 * @desc    Delete a solution
 * @route   DELETE /api/solutions/:id
 * @access  Private/Admin
 */
const deleteSolution = asyncHandler(async (req, res) => {
  const solution = await Solution.findById(req.params.id);

  if (!solution) {
    res.status(404);
    throw new Error("Solution not found");
  }

  await solution.deleteOne();
  res.json({ success: true, data: {} });
});

/**
 * @desc    Get all solutions by category
 * @route   GET /api/solutions/category/:categoryId
 * @access  Public
 */
const getSolutionsByCategory = asyncHandler(async (req, res) => {
  const solutions = await Solution.find({ category: req.params.categoryId }).populate(
    "category",
    "title caption iconSvg"
  );
  
  // Ensure descriptions are properly formatted
  const formattedSolutions = solutions.map(solution => {
    if (typeof solution.description === 'string') {
      try {
        solution.description = JSON.parse(solution.description);
      } catch (error) {
        solution.description = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: solution.description
                }
              ]
            }
          ]
        };
      }
    }
    return solution;
  });

  res.json({ success: true, data: formattedSolutions });
});

/**
 * @desc    Get all solution categories
 * @route   GET /api/solutions/categories
 * @access  Public
 */
const getSolutionCategories = asyncHandler(async (req, res) => {
  const categories = await SolutionCategory.find();
  res.json({ success: true, data: categories });
});

export {
  createSolution,
  getSolutions,
  getSolution,
  updateSolution,
  deleteSolution,
  getSolutionsByCategory,
  getSolutionCategories,
};