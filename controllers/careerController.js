import asyncHandler from '../middleware/asyncHandler.js';
import CareerApplication from '../models/careerModel.js';
import sendEmail from '../utils/sendEmail.js';
import { uploadToS3, deleteFromS3, getSignedDownloadUrl } from '../utils/s3Upload.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Submit career application
// @route   POST /api/careers/apply
// @access  Public
const submitApplication = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    position,
    experience,
    languages,
    coverLetter,
    portfolioUrl,
    availability,
    workType,
    expectedSalary,
    referralSource
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !position || !experience || !languages || !coverLetter) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  // Check if resume file was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Resume file is required');
  }

  let resumeKey = null; // Initialize resumeKey

  try {
    // Upload resume to S3
    resumeKey = `resumes/${uuidv4()}-${req.file.originalname}`;
    await uploadToS3(req.file.buffer, resumeKey, req.file.mimetype);

    // Create application
    const application = await CareerApplication.create({
      firstName,
      lastName,
      email,
      phone,
      position,
      experience,
      languages,
      coverLetter,
      resumeFileKey: resumeKey,
      resumeFileName: req.file.originalname,
      portfolioUrl,
      availability,
      workType,
      expectedSalary,
      referralSource
    });

    // Send confirmation email to applicant
    const applicantEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #3730a3 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Application Received!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your interest in joining Khisima</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Dear ${firstName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We have successfully received your application for the <strong>${application.getPositionTitle()}</strong> position. 
            Our team will review your application carefully and get back to you within 48 hours.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Application Summary:</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li><strong>Position:</strong> ${application.getPositionTitle()}</li>
              <li><strong>Experience Level:</strong> ${experience} years</li>
              <li><strong>Work Type:</strong> ${workType}</li>
              <li><strong>Availability:</strong> ${availability}</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            In the meantime, feel free to explore our website to learn more about our mission of empowering languages worldwide.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:careers@khisima.com" style="background: linear-gradient(135deg, #2563eb 0%, #3730a3 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Contact Our HR Team
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            This is an automated message from Khisima Career Portal.<br/>
            If you have any questions, please contact us at careers@khisima.com
          </p>
        </div>
      </div>
    `;

    // Send notification email to HR
    const hrEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">New Career Application</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Review required</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Application Details</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #374151;">Name:</strong><br/>
                <span style="color: #6b7280;">${firstName} ${lastName}</span>
              </div>
              <div>
                <strong style="color: #374151;">Email:</strong><br/>
                <span style="color: #6b7280;">${email}</span>
              </div>
              <div>
                <strong style="color: #374151;">Phone:</strong><br/>
                <span style="color: #6b7280;">${phone || 'Not provided'}</span>
              </div>
              <div>
                <strong style="color: #374151;">Position:</strong><br/>
                <span style="color: #6b7280;">${application.getPositionTitle()}</span>
              </div>
              <div>
                <strong style="color: #374151;">Experience:</strong><br/>
                <span style="color: #6b7280;">${experience} years</span>
              </div>
              <div>
                <strong style="color: #374151;">Work Type:</strong><br/>
                <span style="color: #6b7280;">${workType}</span>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #374151;">Languages:</strong><br/>
            <p style="color: #6b7280; margin: 5px 0; white-space: pre-wrap;">${languages}</p>
          </div>
          
          ${portfolioUrl ? `
          <div style="margin-bottom: 20px;">
            <strong style="color: #374151;">Portfolio:</strong><br/>
            <a href="${portfolioUrl}" style="color: #2563eb;">${portfolioUrl}</a>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #374151;">Cover Letter:</strong><br/>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 5px;">
              <p style="color: #4b5563; margin: 0; white-space: pre-wrap; line-height: 1.6;">${coverLetter}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #374151;">Resume:</strong><br/>
            <span style="color: #6b7280;">File: ${req.file.originalname}</span><br/>
            <span style="color: #6b7280;">S3 Key: ${resumeKey}</span>
          </div>
          
          ${expectedSalary ? `
          <div style="margin-bottom: 20px;">
            <strong style="color: #374151;">Expected Salary:</strong><br/>
            <span style="color: #6b7280;">${expectedSalary}</span>
          </div>
          ` : ''}
          
          ${referralSource ? `
          <div style="margin-bottom: 20px;">
            <strong style="color: #374151;">How they heard about us:</strong><br/>
            <span style="color: #6b7280;">${referralSource}</span>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fef3c7; border-radius: 12px;">
            <p style="color: #92400e; margin: 0; font-weight: bold;">
              Application ID: ${application._id}
            </p>
            <p style="color: #d97706; margin: 5px 0 0 0; font-size: 14px;">
              Submitted: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    // Send emails
    await Promise.all([
      sendEmail({
        to: email,
        subject: 'Khisima - Application Received',
        html: applicantEmailHtml
      }),
      sendEmail({
        to: process.env.HR_EMAIL || 'careers@khisima.com',
        subject: `New Career Application - ${firstName} ${lastName} (${application.getPositionTitle()})`,
        html: hrEmailHtml
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application._id,
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        position: application.position,
        status: application.status,
        submittedAt: application.createdAt
      }
    });

  } catch (error) {
    // If S3 upload failed and we have a key, try to clean up
    if (resumeKey) { // Now resumeKey is properly defined
      try {
        await deleteFromS3(resumeKey);
      } catch (cleanupError) {
        console.error('Failed to cleanup S3 file:', cleanupError);
      }
    }
    
    console.error('Application submission error:', error);
    if (error.name === 'ValidationError') {
    const fieldErrors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    res.status(400);
    throw new Error(`Validation failed: ${fieldErrors.map(e => e.message).join(', ')}`);
   }
  
  res.status(500);
  throw new Error('Failed to submit application. Please try again.');
}
});

// @desc    Get signed download URL for resume (Admin only)
// @route   GET /api/careers/applications/:id/download
// @access  Private/Admin
const getResumeDownloadUrl = asyncHandler(async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (!application.resumeFileKey) {
      res.status(404);
      throw new Error('Resume not found');
    }

    // Generate signed URL for download (valid for 1 hour)
    const signedUrl = await getSignedDownloadUrl(application.resumeFileKey, 3600);

    res.json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        fileName: application.resumeFileName,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }
    });

  } catch (error) {
    console.error('Get download URL error:', error);
    
    if (error.message.includes('NoSuchKey')) {
      res.status(404);
      throw new Error('Resume file not found in storage');
    }
    
    res.status(500);
    throw new Error('Failed to generate download link');
  }
});


// @desc    Get all applications (Admin only)
// @route   GET /api/careers/applications
// @access  Private/Admin
const getApplications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const position = req.query.position;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Build filter
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (position && position !== 'all') filter.position = position;

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder;

  try {
    const applications = await CareerApplication.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewedBy', 'firstName lastName email');

    const total = await CareerApplication.countDocuments(filter);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500);
    throw new Error('Failed to fetch applications');
  }
});

// @desc    Get application by ID (Admin only)
// @route   GET /api/careers/applications/:id
// @access  Private/Admin
const getApplicationById = asyncHandler(async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id)
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500);
    throw new Error('Failed to fetch application');
  }
});

// @desc    Update application status (Admin only)
// @route   PUT /api/careers/applications/:id/status
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, notes, interviewDate } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  try {
    const application = await CareerApplication.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Update application
    application.status = status;
    if (notes) application.reviewNotes = notes;
    if (status === 'reviewed') {
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
    }
    if (interviewDate) application.interviewDate = new Date(interviewDate);

    await application.save();

    // Send status update email to applicant
    let emailSubject = '';
    let emailHtml = '';

    switch (status) {
      case 'reviewed':
        emailSubject = 'Khisima - Application Under Review';
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3730a3 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Application Update</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 16px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Dear ${application.firstName},</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Great news! Your application for the <strong>${application.getPositionTitle()}</strong> position has been reviewed and moved to the next stage of our selection process.
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                We will contact you soon with next steps. Thank you for your patience!
              </p>
            </div>
          </div>
        `;
        break;

      case 'interviewing':
        emailSubject = 'Khisima - Interview Invitation';
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Interview Invitation</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 16px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Dear ${application.firstName},</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Congratulations! We would like to invite you for an interview for the <strong>${application.getPositionTitle()}</strong> position.
              </p>
              ${interviewDate ? `
              <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0284c7;">
                <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">Interview Details:</h3>
                <p style="color: #0369a1; margin: 0;"><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
              </div>
              ` : ''}
              <p style="color: #4b5563; line-height: 1.6;">
                Our HR team will contact you shortly with detailed interview information and instructions.
              </p>
            </div>
          </div>
        `;
        break;

      default:
        // Don't send email for other statuses unless specifically needed
        break;
    }

    if (emailSubject && emailHtml) {
      await sendEmail({
        to: application.email,
        subject: emailSubject,
        html: emailHtml
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500);
    throw new Error('Failed to update application status');
  }
});

// @desc    Delete application (Admin only)
// @route   DELETE /api/careers/applications/:id
// @access  Private/Admin
const deleteApplication = asyncHandler(async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Delete resume from S3
    if (application.resumeFileKey) {
      try {
        await deleteFromS3(application.resumeFileKey);
      } catch (s3Error) {
        console.error('Failed to delete resume from S3:', s3Error);
        // Continue with deletion even if S3 cleanup fails
      }
    }

    await CareerApplication.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500);
    throw new Error('Failed to delete application');
  }
});

// @desc    Get application statistics (Admin only)
// @route   GET /api/careers/stats
// @access  Private/Admin
const getApplicationStats = asyncHandler(async (req, res) => {
  try {
    const stats = await CareerApplication.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          reviewed: {
            $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
          },
          interviewing: {
            $sum: { $cond: [{ $eq: ['$status', 'interviewing'] }, 1, 0] }
          },
          hired: {
            $sum: { $cond: [{ $eq: ['$status', 'hired'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    const positionStats = await CareerApplication.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await CareerApplication.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          pending: 0,
          reviewed: 0,
          interviewing: 0,
          hired: 0,
          rejected: 0
        },
        byPosition: positionStats,
        monthly: monthlyStats
      }
    });

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500);
    throw new Error('Failed to fetch application statistics');
  }
});

export {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
  getResumeDownloadUrl
};