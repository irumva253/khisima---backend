import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s\-()]+$/, 'Please provide a valid phone number']
  },
  preferredLanguage: {
    type: String,
    required: [true, 'Preferred language is required'],
    enum: ['English', 'Kinyarwanda', 'French', 'Swahili', 'Other'],
    default: 'English'
  },
  otherLanguage: {
    type: String,
    trim: true,
    maxlength: [30, 'Language name cannot exceed 30 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'responded', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'support', 'business', 'partnership', 'feedback', 'other'],
    default: 'general'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['website', 'mobile', 'api'],
    default: 'website'
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  responseNote: {
    type: String,
    trim: true,
    maxlength: [1000, 'Response note cannot exceed 1000 characters']
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming you have a User model for admin users
  },
  respondedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
notificationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted creation date
notificationSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Index for better query performance
notificationSchema.index({ email: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ priority: 1, status: 1 });

// Pre-save middleware to set category based on message content
notificationSchema.pre('save', function(next) {
  if (this.isNew) {
    const message = this.message.toLowerCase();
    
    if (message.includes('support') || message.includes('help') || message.includes('problem')) {
      this.category = 'support';
    } else if (message.includes('business') || message.includes('partnership') || message.includes('collaborate')) {
      this.category = 'business';
    } else if (message.includes('feedback') || message.includes('suggestion') || message.includes('review')) {
      this.category = 'feedback';
    }

    // Set priority based on urgency keywords
    if (message.includes('urgent') || message.includes('asap') || message.includes('emergency')) {
      this.priority = 'urgent';
    } else if (message.includes('important') || message.includes('priority')) {
      this.priority = 'high';
    }
  }
  next();
});

// Static method to get notifications by status
notificationSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function(userId = null) {
  this.status = 'read';
  if (userId) {
    this.respondedBy = userId;
  }
  return this.save();
};

// Instance method to mark as responded
notificationSchema.methods.markAsResponded = function(userId, note = '') {
  this.status = 'responded';
  this.respondedBy = userId;
  this.respondedAt = new Date();
  if (note) {
    this.responseNote = note;
  }
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;