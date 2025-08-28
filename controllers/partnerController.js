import Partner from '../models/partnerModel.js';
import { deleteFileFromS3 } from '../utils/s3Utils.js';

// @desc    Create a new partner
// @route   POST /api/partners
// @access  Private/Admin
export const createPartner = async (req, res) => {
  try {
    const { title, fileKey } = req.body;

    if (!title || !fileKey) {
      return res.status(400).json({
        message: 'Title and image are required'
      });
    }

    const partner = new Partner({
      title,
      fileKey
    });

    const createdPartner = await partner.save();
    
    res.status(201).json({
      message: 'Partner created successfully',
      data: createdPartner
    });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({
      message: 'Server error creating partner'
    });
  }
};

// @desc    Get all partners
// @route   GET /api/partners
// @access  Public
export const getPartners = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const partners = await Partner.find(filter).sort({ createdAt: -1 });
    
    res.json({
      message: 'Partners retrieved successfully',
      data: partners
    });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({
      message: 'Server error retrieving partners'
    });
  }
};

// @desc    Update partner
// @route   PUT /api/partners/:id
// @access  Private/Admin
export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fileKey, status } = req.body;

    const partner = await Partner.findById(id);
    
    if (!partner) {
      return res.status(404).json({
        message: 'Partner not found'
      });
    }

    // If updating fileKey, delete old file from S3
    if (fileKey && fileKey !== partner.fileKey) {
      try {
        await deleteFileFromS3(partner.fileKey);
      } catch (s3Error) {
        console.error('Error deleting old file from S3:', s3Error);
        // Continue with update even if S3 deletion fails
      }
    }

    partner.title = title || partner.title;
    partner.fileKey = fileKey || partner.fileKey;
    if (status !== undefined) {
      partner.status = status;
    }

    const updatedPartner = await partner.save();
    
    res.json({
      message: 'Partner updated successfully',
      data: updatedPartner
    });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({
      message: 'Server error updating partner'
    });
  }
};

// @desc    Delete partner
// @route   DELETE /api/partners/:id
// @access  Private/Admin
export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id);
    
    if (!partner) {
      return res.status(404).json({
        message: 'Partner not found'
      });
    }

    // Delete file from S3
    try {
      await deleteFileFromS3(partner.fileKey);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    await Partner.findByIdAndDelete(id);
    
    res.json({
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({
      message: 'Server error deleting partner'
    });
  }
};