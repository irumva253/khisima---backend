import Notification from '../models/notificationModel.js';
import { sendContactEmail } from '../utils/emailService.js';
import { validationResult } from 'express-validator';

class NotificationController {
  // CREATE - Submit new contact form (Public endpoint)
  static async createNotification(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        preferredLanguage,
        otherLanguage,
        message
      } = req.body;

      // Create notification object
      const notificationData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        preferredLanguage,
        message: message.trim(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        source: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'website'
      };

      // Add other language if specified
      if (preferredLanguage === 'Other' && otherLanguage) {
        notificationData.otherLanguage = otherLanguage.trim();
      }

      // Create notification in database
      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      // Send email notification
      try {
        await sendContactEmail({
          firstName,
          lastName,
          email,
          phone,
          preferredLanguage: preferredLanguage === 'Other' ? otherLanguage : preferredLanguage,
          message,
          notificationId: savedNotification._id,
          submittedAt: savedNotification.createdAt
        });

        // Update notification to mark email as sent
        savedNotification.isEmailSent = true;
        savedNotification.emailSentAt = new Date();
        await savedNotification.save();

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the entire request if email fails
        // Log this for monitoring
      }

      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We have received your message and will get back to you soon.',
        data: {
          id: savedNotification._id,
          submittedAt: savedNotification.createdAt,
          status: savedNotification.status
        }
      });

    } catch (error) {
      console.error('Notification creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong while submitting your message. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // READ - Get all notifications with filtering and pagination (Admin only)
  static async getAllNotifications(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = req.query;

      // Build filter object
      const filter = {};

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Search functionality
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const notifications = await Notification.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('respondedBy', 'firstName lastName email')
        .exec();

      // Get total count for pagination
      const total = await Notification.countDocuments(filter);

      // Get status statistics
      const stats = await Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        filter: {
          status,
          priority,
          category,
          search,
          startDate,
          endDate
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // READ - Get single notification by ID (Admin only)
  static async getNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findById(id)
        .populate('respondedBy', 'firstName lastName email')
        .exec();

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: notification
      });

    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // UPDATE - Update notification status/response (Admin only)
  static async updateNotification(req, res) {
    try {
      const { id } = req.params;
      const { status, priority, category, responseNote, tags } = req.body;
      const userId = req.user?.id; // Assuming user info from auth middleware

      const updateData = {};
      
      if (status) {
        updateData.status = status;
        if (status === 'read' && userId) {
          updateData.respondedBy = userId;
        }
        if (status === 'responded') {
          updateData.respondedBy = userId;
          updateData.respondedAt = new Date();
        }
      }
      
      if (priority) updateData.priority = priority;
      if (category) updateData.category = category;
      if (responseNote) updateData.responseNote = responseNote;
      if (tags) updateData.tags = Array.isArray(tags) ? tags : [tags];

      const notification = await Notification.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('respondedBy', 'firstName lastName email');

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification updated successfully',
        data: notification
      });

    } catch (error) {
      console.error('Update notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // UPDATE - Bulk update notifications (Admin only)
  static async bulkUpdateNotifications(req, res) {
    try {
      const { ids, updateData } = req.body;
      const userId = req.user?.id;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide valid notification IDs'
        });
      }

      const update = { ...updateData };
      if (updateData.status === 'read' || updateData.status === 'responded') {
        update.respondedBy = userId;
        if (updateData.status === 'responded') {
          update.respondedAt = new Date();
        }
      }

      const result = await Notification.updateMany(
        { _id: { $in: ids } },
        update,
        { runValidators: true }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} notifications updated successfully`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });

    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // DELETE - Delete notification (Admin only)
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByIdAndDelete(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully',
        data: { id: notification._id }
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // DELETE - Bulk delete notifications (Admin only)
  static async bulkDeleteNotifications(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide valid notification IDs'
        });
      }

      const result = await Notification.deleteMany({ _id: { $in: ids } });

      res.json({
        success: true,
        message: `${result.deletedCount} notifications deleted successfully`,
        data: {
          deletedCount: result.deletedCount
        }
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ANALYTICS - Get dashboard statistics (Admin only)
  static async getDashboardStats(req, res) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalNotifications,
        unreadCount,
        todayCount,
        monthlyCount,
        statusBreakdown,
        priorityBreakdown,
        languageBreakdown,
        recentNotifications
      ] = await Promise.all([
        // Total notifications
        Notification.countDocuments(),
        
        // Unread count
        Notification.countDocuments({ status: 'unread' }),
        
        // Today's count
        Notification.countDocuments({
          createdAt: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lte: new Date().setHours(23, 59, 59, 999)
          }
        }),
        
        // Monthly count
        Notification.countDocuments({
          createdAt: { $gte: thirtyDaysAgo }
        }),
        
        // Status breakdown
        Notification.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        
        // Priority breakdown
        Notification.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        
        // Language breakdown
        Notification.aggregate([
          { $group: { _id: '$preferredLanguage', count: { $sum: 1 } } }
        ]),
        
        // Recent notifications
        Notification.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('firstName lastName email message createdAt status priority')
      ]);

      // Weekly trend
      const weeklyTrend = await Notification.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            total: totalNotifications,
            unread: unreadCount,
            today: todayCount,
            thisMonth: monthlyCount,
            responseRate: totalNotifications > 0 ? 
              Math.round((totalNotifications - unreadCount) / totalNotifications * 100) : 0
          },
          breakdown: {
            status: statusBreakdown.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {}),
            priority: priorityBreakdown.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {}),
            language: languageBreakdown.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {})
          },
          weeklyTrend,
          recentNotifications
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // UTILITY - Export notifications to CSV (Admin only)
  static async exportNotifications(req, res) {
    try {
      const { format = 'csv', status, startDate, endDate } = req.query;
      
      const filter = {};
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const notifications = await Notification.find(filter)
        .populate('respondedBy', 'firstName lastName')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        const csv = [
          'ID,First Name,Last Name,Email,Phone,Language,Message,Status,Priority,Category,Created At,Responded By,Responded At',
          ...notifications.map(n => [
            n._id,
            n.firstName,
            n.lastName,
            n.email,
            n.phone,
            n.preferredLanguage === 'Other' ? n.otherLanguage : n.preferredLanguage,
            `"${n.message.replace(/"/g, '""')}"`, // Escape quotes in CSV
            n.status,
            n.priority,
            n.category,
            n.createdAt.toISOString(),
            n.respondedBy ? `${n.respondedBy.firstName} ${n.respondedBy.lastName}` : '',
            n.respondedAt ? n.respondedAt.toISOString() : ''
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=notifications-${Date.now()}.csv`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: notifications
        });
      }

    } catch (error) {
      console.error('Export notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default NotificationController;