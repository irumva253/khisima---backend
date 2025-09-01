import mongoose from 'mongoose';

const workplaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  headOfStation: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    name: {
      type: String,
      required: true
    },
    flagImage: {
      type: String,
      default: ''
    }
  },
  introduction: {
    type: String,
    required: true
  },
  description: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  images: [{
    url: String,
    caption: String
  }],
  highlightVideo: {
    type: String,
    default: ''
  },
  contact: {
    emails: [{
      type: String,
      required: true
    }],
    phones: [{
      type: String,
      required: true
    }]
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    fullAddress: {
      type: String,
      required: true
    }
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  facilities: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance'],
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
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better search performance
workplaceSchema.index({ title: 'text', introduction: 'text', 'address.city': 1, 'address.state': 1 });
workplaceSchema.index({ coordinates: '2dsphere' });

const Workplace = mongoose.model('Workplace', workplaceSchema);
export default Workplace;