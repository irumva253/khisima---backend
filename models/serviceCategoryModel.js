import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
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

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);

export default ServiceCategory;
