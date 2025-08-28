import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  fileKey: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for better query performance
partnerSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Partner', partnerSchema);