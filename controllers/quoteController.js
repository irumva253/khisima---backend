import Quote from '../models/quoteModel.js';
import sendEmail from '../utils/sendEmail.js';
import asyncHandler from '../middleware/asyncHandler.js';
import path from 'path';
import fs from 'fs/promises';

// @desc    Submit a new quote request
// @route   POST /api/quotes
// @access  Public
export const submitQuoteRequest = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    projectType,
    sourceLanguage,
    targetLanguages,
    otherSourceLanguage,
    otherTargetLanguage,
    wordCount,
    deadline,
    budget,
    specialRequirements,
    description
  } = req.body;

  // Parse targetLanguages if it's a string (from FormData)
  let parsedTargetLanguages = targetLanguages;
  if (typeof targetLanguages === 'string') {
    try {
      parsedTargetLanguages = JSON.parse(targetLanguages);
    } catch (error) {
      parsedTargetLanguages = [targetLanguages];
    }
  }

  // Validate required fields
  if (!firstName || !lastName || !email || !projectType || !sourceLanguage || 
      !parsedTargetLanguages || parsedTargetLanguages.length === 0 || !description) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  // Process uploaded files
  const files = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      files.push({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      });
    }
  }

  // Get client IP and user agent for tracking
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  try {
    // Create quote request
    const quote = await Quote.create({
      firstName,
      lastName,
      email,
      phone,
      company,
      projectType,
      sourceLanguage,
      targetLanguages: parsedTargetLanguages,
      otherSourceLanguage,
      otherTargetLanguage,
      wordCount: wordCount ? parseInt(wordCount) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      budget,
      specialRequirements,
      description,
      files,
      ipAddress,
      userAgent,
      referralSource: req.get('Referer')
    });

    // Calculate initial estimate
    quote.calculateEstimate();
    await quote.save();

    // Send confirmation email to client
    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .info-box { background: white; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
          .footer { background: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Quote Request Received!</h1>
          <p>Muraho ${firstName}! We've received your translation request.</p>
        </div>
        <div class="content">
          <div class="info-box">
            <h3>📋 Request Details</h3>
            <p><strong>Request ID:</strong> #${quote._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>Project Type:</strong> ${projectType}</p>
            <p><strong>Languages:</strong> ${sourceLanguage} → ${parsedTargetLanguages.join(', ')}</p>
            ${wordCount ? `<p><strong>Word Count:</strong> ${wordCount.toLocaleString()} words</p>` : ''}
            ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>` : ''}
            ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
          </div>
          
          <div class="info-box">
            <h3>⏱️ What Happens Next?</h3>
            <ul>
              <li><strong>Within 2 hours:</strong> We'll review your request and may contact you for clarification</li>
              <li><strong>Within 24 hours:</strong> You'll receive a detailed quote with pricing and timeline</li>
              <li><strong>Upon approval:</strong> We'll begin working on your project immediately</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3>📞 Need to reach us?</h3>
            <p>Email: hello@khisima.com</p>
            <p>Phone: +250 788 123 456</p>
            <p>We speak your language! Our team is available in 50+ languages.</p>
          </div>
          
          <p>Thank you for choosing Khisima for your translation needs. We're excited to help bridge cultures through language!</p>
          
          <p><em>Murakoze cyane! (Thank you very much!)</em><br>
          The Khisima Team 🇷🇼</p>
        </div>
        <div class="footer">
          <p>Khisima - Bridging Cultures Through Language</p>
          <p>Kigali, Rwanda | hello@khisima.com | +250 788 123 456</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: `Quote Request Received - ${projectType} (ID: #${quote._id.toString().slice(-8).toUpperCase()})`,
      html: clientEmailHtml
    });

    // Send notification email to admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .info-section { background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 10px 0; }
          .priority-high { border-left: 4px solid #dc2626; }
          .priority-normal { border-left: 4px solid #2563eb; }
          .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .action-button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 New Quote Request</h1>
          <p>ID: #${quote._id.toString().slice(-8).toUpperCase()}</p>
        </div>
        <div class="content">
          <div class="info-section ${deadline && new Date(deadline) - Date.now() < 7 * 24 * 60 * 60 * 1000 ? 'priority-high' : 'priority-normal'}">
            <h3>👤 Client Information</h3>
            <table>
              <tr><th>Name</th><td>${firstName} ${lastName}</td></tr>
              <tr><th>Email</th><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><th>Phone</th><td>${phone || 'Not provided'}</td></tr>
              <tr><th>Company</th><td>${company || 'Not provided'}</td></tr>
            </table>
          </div>
          
          <div class="info-section">
            <h3>📋 Project Details</h3>
            <table>
              <tr><th>Project Type</th><td>${projectType}</td></tr>
              <tr><th>Source Language</th><td>${sourceLanguage}${otherSourceLanguage ? ` (${otherSourceLanguage})` : ''}</td></tr>
              <tr><th>Target Languages</th><td>${parsedTargetLanguages.join(', ')}${otherTargetLanguage ? ` (${otherTargetLanguage})` : ''}</td></tr>
              <tr><th>Word Count</th><td>${wordCount ? wordCount.toLocaleString() : 'Not specified'}</td></tr>
              <tr><th>Deadline</th><td>${deadline ? new Date(deadline).toLocaleDateString() : 'Flexible'}</td></tr>
              <tr><th>Budget</th><td>${budget || 'Not specified'}</td></tr>
              <tr><th>Estimated Cost</th><td>$${quote.estimatedCost || 'TBD'}</td></tr>
            </table>
          </div>
          
          <div class="info-section">
            <h3>📄 Project Description</h3>
            <p><strong>Description:</strong></p>
            <p style="background: white; padding: 10px; border-radius: 4px;">${description}</p>
            ${specialRequirements ? `<p><strong>Special Requirements:</strong></p><p style="background: white; padding: 10px; border-radius: 4px;">${specialRequirements}</p>` : ''}
          </div>
          
          ${files.length > 0 ? `
          <div class="info-section">
            <h3>📎 Uploaded Files (${files.length})</h3>
            <ul>
              ${files.map(file => `<li>${file.originalName} (${(file.size / 1024 / 1024).toFixed(2)} MB)</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="info-section">
            <h3>🔧 Technical Details</h3>
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Referral Source:</strong> ${req.get('Referer') || 'Direct'}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.ADMIN_DASHBOARD_URL}/quotes/${quote._id}" class="action-button">
              📋 Review Quote
            </a>
            <a href="mailto:${email}?subject=Re: Quote Request #${quote._id.toString().slice(-8).toUpperCase()}" class="action-button">
              ✉️ Reply to Client
            </a>
          </div>
          
          ${deadline && new Date(deadline) - Date.now() < 7 * 24 * 60 * 60 * 1000 ? 
            '<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0; color: #dc2626;"><strong>⚠️ URGENT:</strong> This request has a tight deadline. Please review immediately!</div>' : ''
          }
        </div>
        <div class="footer">
          <p>Khisima Admin Dashboard | This is an automated notification</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@khisima.com',
      subject: `🚨 New Quote Request - ${projectType} from ${firstName} ${lastName}`,
      html: adminEmailHtml
    });

    // Add initial communication log
    quote.communications.push({
      type: 'email',
      subject: 'Quote request confirmation sent',
      message: 'Confirmation email sent to client',
      direction: 'outbound',
      createdAt: new Date()
    });

    await quote.save();

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      data: {
        quoteId: quote._id,
        referenceNumber: quote._id.toString().slice(-8).toUpperCase(),
        estimatedResponseTime: '24 hours',
        status: quote.status
      }
    });

  } catch (error) {
    // Clean up uploaded files if quote creation fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }
    
    console.error('Quote submission error:', error);
    res.status(500);
    throw new Error('Failed to submit quote request. Please try again.');
  }
});

// @desc    Get all quotes (Admin)
// @route   GET /api/quotes
// @access  Private/Admin
export const getQuotes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.projectType) {
    filter.projectType = req.query.projectType;
  }
  
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { company: searchRegex }
    ];
  }
  
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) {
      filter.createdAt.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.createdAt.$lte = new Date(req.query.dateTo);
    }
  }

  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Sort options
  const sortOptions = {};
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  sortOptions[sortBy] = sortOrder;

  const quotes = await Quote.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate('quotedBy', 'name email')
    .populate('communications.createdBy', 'name email');

  const total = await Quote.countDocuments(filter);

  res.json({
    success: true,
    data: quotes,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalQuotes: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
});

// @desc    Get single quote (Admin)
// @route   GET /api/quotes/:id
// @access  Private/Admin
export const getQuoteById = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id)
    .populate('quotedBy', 'name email')
    .populate('communications.createdBy', 'name email');

  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }

  res.json({
    success: true,
    data: quote
  });
});

// @desc    Update quote (Admin)
// @route   PUT /api/quotes/:id
// @access  Private/Admin
export const updateQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }

  // Track status changes
  const oldStatus = quote.status;
  const newStatus = req.body.status;

  // Update quote
  Object.assign(quote, req.body);

  // Set quotedBy and quotedAt when status changes to 'quoted'
  if (newStatus === 'quoted' && oldStatus !== 'quoted') {
    quote.quotedBy = req.user._id;
    quote.quotedAt = new Date();
  }

  const updatedQuote = await quote.save();

  // Send email notification if status changed to 'quoted'
  if (newStatus === 'quoted' && oldStatus !== 'quoted') {
    const quoteEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f0fdf4; }
          .quote-box { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #10b981; }
          .price-highlight { background: #dcfce7; border-radius: 8px; padding: 15px; margin: 10px 0; text-align: center; }
          .footer { background: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Your Quote is Ready!</h1>
          <p>Quote #${quote._id.toString().slice(-8).toUpperCase()}</p>
        </div>
        <div class="content">
          <p>Dear ${quote.firstName},</p>
          
          <p>Thank you for your patience! We've prepared a detailed quote for your ${quote.projectType} project.</p>
          
          <div class="quote-box">
            <h3>💰 Quote Summary</h3>
            ${quote.estimatedCost ? `
            <div class="price-highlight">
              <h2 style="color: #059669; margin: 0;">${quote.estimatedCost.toLocaleString()}</h2>
              <p style="margin: 5px 0; color: #6b7280;">Total Project Cost</p>
            </div>
            ` : ''}
            
            <p><strong>Languages:</strong> ${quote.sourceLanguage} → ${quote.targetLanguages.join(', ')}</p>
            ${quote.wordCount ? `<p><strong>Word Count:</strong> ${quote.wordCount.toLocaleString()} words</p>` : ''}
            ${quote.estimatedDuration ? `<p><strong>Timeline:</strong> ${quote.estimatedDuration}</p>` : ''}
            
            ${quote.quoteNotes ? `
            <h4>📝 Additional Notes:</h4>
            <p style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${quote.quoteNotes}</p>
            ` : ''}
          </div>
          
          <div class="quote-box">
            <h3>✅ What's Included</h3>
            <ul>
              <li>Professional translation by native speakers</li>
              <li>Quality assurance review</li>
              <li>Cultural adaptation where needed</li>
              <li>Final proofreading</li>
              <li>Unlimited minor revisions</li>
              <li>Project management support</li>
            </ul>
          </div>
          
          <div class="quote-box">
            <h3>⏰ Quote Validity</h3>
            <p>This quote is valid until <strong>${quote.quoteValidUntil ? quote.quoteValidUntil.toLocaleDateString() : 'contact us'}</strong>.</p>
            <p>To proceed, simply reply to this email or call us at +250 788 123 456.</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="mailto:hello@khisima.com?subject=Quote Approval - ${quote._id.toString().slice(-8).toUpperCase()}" class="button">
              ✅ Accept Quote
            </a>
            <a href="mailto:hello@khisima.com?subject=Quote Questions - ${quote._id.toString().slice(-8).toUpperCase()}" class="button" style="background: #6b7280;">
              ❓ Ask Questions
            </a>
          </div>
          
          <p>We're excited about the opportunity to work with you and help bring your project to life!</p>
          
          <p><em>Murakoze! (Thank you!)</em><br>
          The Khisima Team 🇷🇼</p>
        </div>
        <div class="footer">
          <p>Khisima - Bridging Cultures Through Language</p>
          <p>Kigali, Rwanda | hello@khisima.com | +250 788 123 456</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: quote.email,
      subject: `Your Quote is Ready! - ${quote.projectType} (${quote.estimatedCost ? `${quote.estimatedCost}` : 'Custom pricing'})`,
      html: quoteEmailHtml
    });

    // Add communication log
    quote.communications.push({
      type: 'email',
      subject: 'Quote sent to client',
      message: `Quote sent with estimated cost: ${quote.estimatedCost || 'TBD'}`,
      direction: 'outbound',
      createdBy: req.user._id
    });
  }

  await quote.save();

  res.json({
    success: true,
    data: updatedQuote
  });
});

// @desc    Delete quote (Admin)
// @route   DELETE /api/quotes/:id
// @access  Private/Admin
export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }

  // Delete associated files
  for (const file of quote.files) {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  await Quote.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Quote deleted successfully'
  });
});

// @desc    Get quote statistics (Admin)
// @route   GET /api/quotes/stats
// @access  Private/Admin
export const getQuoteStats = asyncHandler(async (req, res) => {
  const stats = await Quote.getQuoteStats();
  const recentQuotes = await Quote.getRecentQuotes(5);
  const overdueQuotes = await Quote.getOverdueQuotes();

  // Additional stats
  const monthlyStats = await Quote.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$estimatedCost' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      ...stats,
      recentQuotes,
      overdueCount: overdueQuotes.length,
      monthlyTrends: monthlyStats
    }
  });
});

// @desc    Bulk update quotes (Admin)
// @route   PUT /api/quotes/bulk
// @access  Private/Admin
export const bulkUpdateQuotes = asyncHandler(async (req, res) => {
  const { ids, updateData } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Quote IDs are required');
  }

  const result = await Quote.updateMany(
    { _id: { $in: ids } },
    updateData,
    { new: true }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} quotes updated successfully`,
    data: { modifiedCount: result.modifiedCount }
  });
});

// @desc    Add communication to quote (Admin)
// @route   POST /api/quotes/:id/communications
// @access  Private/Admin
export const addCommunication = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }

  const communicationData = {
    ...req.body,
    createdBy: req.user._id,
    createdAt: new Date()
  };

  quote.communications.push(communicationData);
  await quote.save();

  res.status(201).json({
    success: true,
    message: 'Communication added successfully',
    data: quote.communications[quote.communications.length - 1]
  });
});

// @desc    Export quotes (Admin)
// @route   GET /api/quotes/export
// @access  Private/Admin
export const exportQuotes = asyncHandler(async (req, res) => {
  const format = req.query.format || 'json';
  const filter = {};

  // Apply same filters as getQuotes
  if (req.query.status) filter.status = req.query.status;
  if (req.query.projectType) filter.projectType = req.query.projectType;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
  }

  const quotes = await Quote.find(filter)
    .populate('quotedBy', 'name email')
    .sort({ createdAt: -1 });

  if (format === 'csv') {
    // Convert to CSV format
    const csvHeaders = [
      'ID', 'Name', 'Email', 'Company', 'Project Type', 'Source Language',
      'Target Languages', 'Word Count', 'Status', 'Estimated Cost', 'Deadline',
      'Created At', 'Quoted At', 'Description'
    ];

    const csvData = quotes.map(quote => [
      quote._id,
      `${quote.firstName} ${quote.lastName}`,
      quote.email,
      quote.company || '',
      quote.projectType,
      quote.sourceLanguage,
      quote.targetLanguages.join('; '),
      quote.wordCount || '',
      quote.status,
      quote.estimatedCost || '',
      quote.deadline ? quote.deadline.toISOString().split('T')[0] : '',
      quote.createdAt.toISOString().split('T')[0],
      quote.quotedAt ? quote.quotedAt.toISOString().split('T')[0] : '',
      `"${quote.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quotes-${Date.now()}.csv`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    data: quotes
  });
});