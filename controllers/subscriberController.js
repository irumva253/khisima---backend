import Subscriber from '../models/subscriberModel.js';
import { validationResult } from 'express-validator';
import  asyncHandler  from '../middleware/asyncHandler.js';

// @desc    Get all subscribers
// @route   GET /api/subscribers
// @access  Private/Admin
export const getSubscribers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const search = req.query.search;

  let query = {};

  // Filter by status
  if (status && ['active', 'inactive', 'unsubscribed'].includes(status)) {
    query.status = status;
  }

  // Search by email
  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const subscribers = await Subscriber.find(query)
    .sort({ subscribedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Subscriber.countDocuments(query);

  res.json({
    success: true,
    data: subscribers,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      count: subscribers.length,
      totalItems: total
    }
  });
});

// @desc    Get subscriber statistics
// @route   GET /api/subscribers/stats
// @access  Private/Admin
export const getSubscriberStats = asyncHandler(async (req, res) => {
  const stats = await Subscriber.getStats();
  
  // Get recent subscriptions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSubscriptions = await Subscriber.countDocuments({
    subscribedAt: { $gte: thirtyDaysAgo }
  });

  // Get monthly growth
  const monthlyGrowth = await Subscriber.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$subscribedAt' },
          month: { $month: '$subscribedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || { total: 0, stats: [] },
      recentSubscriptions,
      monthlyGrowth
    }
  });
});

// @desc    Subscribe to newsletter
// @route   POST /api/subscribers
// @access  Public
export const createSubscriber = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, preferences } = req.body;

  // Check if email already exists
  const existingSubscriber = await Subscriber.findOne({ email });
  
  if (existingSubscriber) {
    if (existingSubscriber.status === 'unsubscribed') {
      // Reactivate subscription
      existingSubscriber.status = 'active';
      existingSubscriber.subscribedAt = new Date();
      existingSubscriber.unsubscribedAt = null;
      if (preferences) existingSubscriber.preferences = preferences;
      
      await existingSubscriber.save();
      
      return res.status(200).json({
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.',
        data: existingSubscriber
      });
    }
    
    return res.status(409).json({
      success: false,
      message: 'Email is already subscribed to our newsletter.'
    });
  }

  // Create new subscriber
  const subscriber = await Subscriber.create({
    email,
    preferences: preferences || {},
    source: 'website',
    metadata: {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      referrer: req.get('Referrer')
    }
  });

  res.status(201).json({
    success: true,
    message: 'Successfully subscribed to newsletter!',
    data: subscriber
  });
});

// @desc    Update subscriber
// @route   PUT /api/subscribers/:id
// @access  Private/Admin
export const updateSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({
      success: false,
      message: 'Subscriber not found'
    });
  }

  const { status, preferences } = req.body;

  if (status) subscriber.status = status;
  if (preferences) subscriber.preferences = { ...subscriber.preferences, ...preferences };

  if (status === 'unsubscribed' && subscriber.status !== 'unsubscribed') {
    subscriber.unsubscribedAt = new Date();
  }

  await subscriber.save();

  res.json({
    success: true,
    message: 'Subscriber updated successfully',
    data: subscriber
  });
});

// @desc    Delete subscriber
// @route   DELETE /api/subscribers/:id
// @access  Private/Admin
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({
      success: false,
      message: 'Subscriber not found'
    });
  }

  await subscriber.deleteOne();

  res.json({
    success: true,
    message: 'Subscriber deleted successfully'
  });
});

// @desc    Unsubscribe from newsletter
// @route   PUT /api/subscribers/unsubscribe/:id
// @access  Public
export const unsubscribeSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({
      success: false,
      message: 'Subscriber not found'
    });
  }

  await subscriber.unsubscribe();

  res.json({
    success: true,
    message: 'Successfully unsubscribed from newsletter'
  });
});

// @desc    Bulk operations
// @route   POST /api/subscribers/bulk
// @access  Private/Admin
export const bulkOperations = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;

  if (!action || !ids || !Array.isArray(ids)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid bulk operation parameters'
    });
  }

  let result;

  switch (action) {
    case 'delete':
      result = await Subscriber.deleteMany({ _id: { $in: ids } });
      break;
    case 'activate':
      result = await Subscriber.updateMany(
        { _id: { $in: ids } },
        { status: 'active', unsubscribedAt: null }
      );
      break;
    case 'deactivate':
      result = await Subscriber.updateMany(
        { _id: { $in: ids } },
        { status: 'inactive' }
      );
      break;
    case 'unsubscribe':
      result = await Subscriber.updateMany(
        { _id: { $in: ids } },
        { status: 'unsubscribed', unsubscribedAt: new Date() }
      );
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid bulk action'
      });
  }

  res.json({
    success: true,
    message: `Bulk ${action} completed successfully`,
    data: {
      modifiedCount: result.modifiedCount || result.deletedCount,
      matchedCount: result.matchedCount || result.deletedCount
    }
  });
});

// @desc    Export subscribers
// @route   GET /api/subscribers/export
// @access  Private/Admin
export const exportSubscribers = asyncHandler(async (req, res) => {
  const { status, format = 'json' } = req.query;

  let query = {};
  if (status && ['active', 'inactive', 'unsubscribed'].includes(status)) {
    query.status = status;
  }

  const subscribers = await Subscriber.find(query)
    .select('email status subscribedAt preferences')
    .sort({ subscribedAt: -1 });

  if (format === 'csv') {
    // Convert to CSV format
    const csvHeader = 'Email,Status,Subscribed At,Frequency,Topics\n';
    const csvData = subscribers.map(sub => {
      return `${sub.email},${sub.status},${sub.subscribedAt.toISOString()},${sub.preferences.frequency || 'weekly'},"${sub.preferences.topics ? sub.preferences.topics.join(';') : ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    return res.send(csvHeader + csvData);
  }

  res.json({
    success: true,
    data: subscribers,
    count: subscribers.length
  });
});