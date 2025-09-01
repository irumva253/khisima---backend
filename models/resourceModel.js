import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['trends', 'ai-language', 'linguistics', 'open-resources'],
    default: 'trends'
  },
  type: {
    type: String,
    required: true,
    enum: ['research', 'whitepaper', 'guide', 'data', 'article', 'case-study', 
           'technical', 'paper', 'tools', 'methodology', 'dataset', 'software',
           'book', 'video', 'audio'],
    default: 'article'
  },
  content: {
    // For books, articles, etc.
    text: String,
    // For videos (YouTube URLs)
    videoUrl: String,
    // For audio files
    audioUrl: String,
    // For file downloads
    fileUrl: String
  },
  readTime: {
    type: String,
    default: '5 min'
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  downloads: {
    type: Number,
    default: 0
  },
  tags: [String],
  imageUrl: {
    type: String,
    default: ''
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Index for better search performance
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;