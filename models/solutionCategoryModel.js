import mongoose from 'mongoose';

const solutionCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    iconSvg: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true, 
  }
);

const SolutionCategory = mongoose.model('SolutionCategory', solutionCategorySchema);

export default SolutionCategory;
