import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  // Contact Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },

  // Project Details
  projectType: {
    type: String,
    required: [true, 'Project type is required'],
    enum: [
      'Document Translation',
      'Website Localization',
      'Software Localization',
      'Marketing Materials',
      'Legal Documents',
      'Medical Translation',
      'Technical Documentation',
      'Audio/Video Transcription',
      'Interpretation Services',
      'Other'
    ]
  },
  sourceLanguage: {
    type: String,
    required: [true, 'Source language is required'],
    trim: true
  },
  targetLanguages: [{
    type: String,
    required: [true, 'At least one target language is required'],
    trim: true
  }],
  otherSourceLanguage: {
    type: String,
    trim: true,
    maxlength: [50, 'Language specification cannot exceed 50 characters']
  },
  otherTargetLanguage: {
    type: String,
    trim: true,
    maxlength: [100, 'Language specification cannot exceed 100 characters']
  },
  wordCount: {
    type: Number,
    min: [0, 'Word count cannot be negative']
  },
  deadline: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  budget: {
    type: String,
    enum: [
      'Under $500',
      '$500 - $1,000',
      '$1,000 - $2,500',
      '$2,500 - $5,000',
      '$5,000 - $10,000',
      'Over $10,000',
      'Not sure - please advise',
      ''
    ]
  },

  // Additional Information
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special requirements cannot exceed 1000 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  // File Information
  files: [{
    originalName: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Quote Status & Admin Fields
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  estimatedDuration: {
    type: String, // e.g., "3-5 business days"
    trim: true
  },
  quoteNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Quote notes cannot exceed 2000 characters']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // Quote Response Details
  quotedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quotedAt: {
    type: Date
  },
  quoteValidUntil: {
    type: Date
  },
  
  // Client Response
  clientResponse: {
    type: String,
    enum: ['', 'accepted', 'rejected', 'negotiating']
  },
  clientResponseDate: {
    type: Date
  },
  clientResponseNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Response notes cannot exceed 1000 characters']
  },

  // Tracking & Metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  referralSource: {
    type: String,
    trim: true
  },
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'meeting', 'internal_note'],
      required: true
    },
    subject: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound', 'internal'],
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      filename: String,
      path: String,
      mimetype: String,
      size: Number
    }]
  }],

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  responseTime: {
    type: Number // Time in hours to first response
  },
  completionTime: {
    type: Number // Time in hours from quote to completion
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
quoteSchema.index({ email: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ projectType: 1 });
quoteSchema.index({ sourceLanguage: 1, targetLanguages: 1 });
quoteSchema.index({ quotedAt: 1 });
quoteSchema.index({ deadline: 1 });

// Virtual for full name
quoteSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for quote age
quoteSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time until deadline
quoteSchema.virtual('timeUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const diffTime = this.deadline - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for total file size
quoteSchema.virtual('totalFileSize').get(function() {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Pre-save middleware
quoteSchema.pre('save', function(next) {
  // Set quote validity period (30 days from quoted date)
  if (this.isModified('quotedAt') && this.quotedAt) {
    this.quoteValidUntil = new Date(this.quotedAt.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  
  // Calculate response time when first quoted
  if (this.isModified('quotedAt') && this.quotedAt && !this.responseTime) {
    this.responseTime = Math.floor((this.quotedAt - this.createdAt) / (1000 * 60 * 60));
  }
  
  // Update status based on quote validity
  if (this.quoteValidUntil && this.quoteValidUntil < new Date() && this.status === 'quoted') {
    this.status = 'expired';
  }
  
  next();
});

// Static methods
quoteSchema.statics.getQuoteStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEstimatedCost: { $sum: '$estimatedCost' }
      }
    }
  ]);
  
  const totalQuotes = await this.countDocuments();
  const avgResponseTime = await this.aggregate([
    { $match: { responseTime: { $exists: true } } },
    { $group: { _id: null, avgResponse: { $avg: '$responseTime' } } }
  ]);
  
  return {
    totalQuotes,
    statusBreakdown: stats,
    avgResponseTimeHours: avgResponseTime[0]?.avgResponse || 0
  };
};

quoteSchema.statics.getRecentQuotes = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('firstName lastName email projectType status createdAt estimatedCost deadline');
};

quoteSchema.statics.getOverdueQuotes = function() {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $in: ['pending', 'reviewing', 'quoted'] }
  });
};

// Instance methods
quoteSchema.methods.addCommunication = function(communicationData) {
  this.communications.push(communicationData);
  return this.save();
};

quoteSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.adminNotes = notes;
  }
  
  if (newStatus === 'quoted') {
    this.quotedAt = new Date();
  }
  
  return this.save();
};

quoteSchema.methods.calculateEstimate = function() {
  // Basic estimation logic - can be enhanced based on business rules
  let baseCost = 0;
  
  if (this.wordCount) {
    const ratePerWord = this.getLanguagePairRate();
    baseCost = this.wordCount * ratePerWord;
  }
  
  // Apply multipliers based on project type
  const typeMultipliers = {
    'Legal Documents': 1.5,
    'Medical Translation': 1.6,
    'Technical Documentation': 1.3,
    'Marketing Materials': 1.2,
    'Document Translation': 1.0
  };
  
  const multiplier = typeMultipliers[this.projectType] || 1.0;
  baseCost *= multiplier;
  
  // Rush job multiplier
  if (this.deadline && this.timeUntilDeadline < 3) {
    baseCost *= 1.5; // 50% rush fee
  }
  
  this.estimatedCost = Math.round(baseCost);
  return baseCost;
};

quoteSchema.methods.getLanguagePairRate = function() {
  // Simplified rate calculation - in real app, this would be more complex
  const commonPairs = ['English', 'French', 'Spanish'];
  const africanLanguages = ['Kinyarwanda', 'Swahili', 'Amharic', 'Yoruba', 'Igbo', 'Hausa'];
  
  let baseRate = 0.10; // $0.10 per word base rate
  
  if (africanLanguages.includes(this.sourceLanguage) || 
      this.targetLanguages.some(lang => africanLanguages.includes(lang))) {
    baseRate = 0.15; // Higher rate for African languages
  }
  
  if (!commonPairs.includes(this.sourceLanguage) && 
      !this.targetLanguages.some(lang => commonPairs.includes(lang))) {
    baseRate = 0.20; // Rare language pair
  }
  
  return baseRate;
};

const Quote = mongoose.model('Quote', quoteSchema);

export default Quote;