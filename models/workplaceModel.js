import mongoose from 'mongoose';

const workplaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  headOfStation: {
    type: String,
    required: [true, 'Head of Station is required'],
    trim: true,
    maxlength: [100, 'Head of Station cannot exceed 100 characters']
  },
  country: {
    name: {
      type: String,
      required: [true, 'Country name is required'],
      trim: true
    },
    flagImage: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          // Allow empty string or valid URL
          if (!v) return true;
          try {
            new URL(v);
            return true;
          } catch (e) {
            return false;
          }
        },
        message: 'Flag image must be a valid URL'
      }
    }
  },
  introduction: {
    type: String,
    required: [true, 'Introduction is required'],
    maxlength: [500, 'Introduction cannot exceed 500 characters']
  },
  description: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Description is required'],
    validate: {
      validator: function(v) {
        // Ensure description is not empty
        return v && Object.keys(v).length > 0;
      },
      message: 'Description cannot be empty'
    }
  },
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      validate: {
        validator: function(v) {
          try {
            new URL(v);
            return true;
          } catch (e) {
            return false;
          }
        },
        message: 'Image URL must be a valid URL'
      }
    },
    caption: {
      type: String,
      maxlength: [200, 'Caption cannot exceed 200 characters'],
      default: ''
    }
  }],
  highlightVideo: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or valid URL
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: 'Highlight video must be a valid URL'
    }
  },
  contact: {
    emails: [{
      type: String,
      required: [true, 'At least one email is required'],
      validate: {
        validator: function(v) {
          // Simple email validation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    }],
    phones: [{
      type: String,
      required: [true, 'At least one phone number is required'],
      validate: {
        validator: function(v) {
          // Basic phone validation - allow various formats
          return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)\.]/g, ''));
        },
        message: 'Please provide a valid phone number'
      }
    }]
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required'],
      maxlength: [500, 'Full address cannot exceed 500 characters']
    }
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
      default: 0
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
      default: 0
    }
  },
  operatingHours: {
    monday: { 
      open: {
        type: String,
        default: 'opening',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: 'closing',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    },
    tuesday: { 
      open: {
        type: String,
        default: 'opening',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: 'closing',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    },
    wednesday: { 
      open: {
        type: String,
        default: 'opening',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: 'closing',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    },
    thursday: { 
      open: {
        type: String,
        default: 'opening',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: 'closing',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    },
    friday: { 
      open: {
        type: String,
        default: 'opening',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: 'closing',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    },
    saturday: { 
      open: {
        type: String,
        default: '',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: '',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    },
    sunday: { 
      open: {
        type: String,
        default: '',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for opening time']
      }, 
      close: {
        type: String,
        default: '',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for closing time']
      } 
    }
  },
  facilities: [{
    type: String,
    trim: true,
    maxlength: [50, 'Facility name cannot exceed 50 characters']
  }],
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'under_maintenance'],
      message: 'Status must be either active, inactive, or under_maintenance'
    },
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  }
}, {
  timestamps: true
});

// Index for better search performance
workplaceSchema.index({ title: 'text', introduction: 'text', 'address.city': 1, 'address.state': 1 });
workplaceSchema.index({ coordinates: '2dsphere' });

// Text search index for the controller's search functionality
workplaceSchema.index({
  title: 'text',
  introduction: 'text',
  'address.city': 'text',
  'address.state': 'text',
  'country.name': 'text'
});

// Middleware to ensure at least one email and phone
workplaceSchema.pre('save', function(next) {
  if (this.contact.emails.length === 0) {
    this.invalidate('contact.emails', 'At least one email is required');
  }
  if (this.contact.phones.length === 0) {
    this.invalidate('contact.phones', 'At least one phone number is required');
  }
  next();
});

// Virtual for simplified address
workplaceSchema.virtual('shortAddress').get(function() {
  return `${this.address.city}, ${this.address.state}`;
});

// Method to update rating
workplaceSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;
  return this.save();
};

const Workplace = mongoose.model('Workplace', workplaceSchema);
export default Workplace;