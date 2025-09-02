import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema(
  {
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
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      enum: [
        'translator',
        'interpreter', 
        'intern-linguistic',
        'intern-tech',
        'other'
      ]
    },
    experience: {
      type: String,
      required: [true, 'Experience level is required'],
      enum: ['0-1', '2-3', '4-6', '7-10', '10+']
    },
    languages: {
      type: String,
      required: [true, 'Languages are required'],
      maxlength: [500, 'Languages description cannot exceed 500 characters']
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
    },
    resumeFileKey: {
      type: String,
      required: [true, 'Resume is required']
    },
    resumeFileName: {
      type: String,
      required: true
    },
    portfolioUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Empty is allowed
          
          // Try to parse as URL - if it fails, try adding https://
          try {
            new URL(v);
            return true;
          } catch (e) {
            try {
              new URL('https://' + v);
              return true;
            } catch (e2) {
              return false;
            }
          }
        },
        message: 'Portfolio URL must be a valid URL (e.g., https://example.com or example.com)'
      },
      set: function(v) {
        if (!v) return v;
        
        // Auto-add https:// if missing and it looks like a domain
        try {
          new URL(v);
          return v; // Already valid
        } catch (e) {
          // Check if it looks like a domain (contains dots and no spaces)
          if (v.includes('.') && !v.includes(' ')) {
            return 'https://' + v;
          }
          return v; // Let validation handle it
        }
      }
    },
    availability: {
      type: String,
      enum: ['immediate', '2weeks', '1month', 'flexible'],
      default: 'immediate'
    },
    workType: {
      type: String,
      enum: ['remote', 'freelance', 'hybrid', 'onsite'],
      default: 'remote'
    },
    country: {
    type: String,
    trim: true,
    maxlength: 100
  },
    expectedSalary: {
      type: String,
      trim: true,
      maxlength: [50, 'Expected salary cannot exceed 50 characters']
    },
    referralSource: {
      type: String,
      enum: ['website', 'linkedin', 'referral', 'jobboard', 'university', 'social', 'other', ''],
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'interviewing', 'rejected', 'hired'],
      default: 'pending'
    },
    reviewNotes: {
      type: String,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters']
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    interviewDate: {
      type: Date
    },
    interviewNotes: {
      type: String,
      maxlength: [1000, 'Interview notes cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
careerApplicationSchema.index({ email: 1 });
careerApplicationSchema.index({ status: 1 });
careerApplicationSchema.index({ position: 1 });
careerApplicationSchema.index({ createdAt: -1 });

// Virtual for full name
careerApplicationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get position title
careerApplicationSchema.methods.getPositionTitle = function() {
  const positions = {
    'translator': 'Freelance Translator',
    'interpreter': 'Remote Interpreter',
    'intern-linguistic': 'Linguistic Research Intern',
    'intern-tech': 'Tech & Localization Intern',
    'other': 'Other Position'
  };
  return positions[this.position] || this.position;
};

// Method to mark as reviewed
careerApplicationSchema.methods.markAsReviewed = function(reviewerId, notes) {
  this.status = 'reviewed';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  return this.save();
};

const CareerApplication = mongoose.model('CareerApplication', careerApplicationSchema);

export default CareerApplication;