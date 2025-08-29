import mongoose from "mongoose";
import slugify from "slugify";

const solutionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    smallDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: mongoose.Schema.Types.Mixed,  
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SolutionCategory",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    fileKey: String,
    videoUrl: String,
  },
  { timestamps: true }
);

// Auto-generate slug from title
solutionSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Solution = mongoose.model("Solution", solutionSchema);

export default Solution;
