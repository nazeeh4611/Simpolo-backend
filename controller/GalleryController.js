import Gallery from '../model/Gallery.js';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

const galleryCategories = [
  'Porcelain Tiles',
  'Porcelain Tiles Fabrications',
  'Slab Tiles',
  'Ceramic Tiles',
  'Outdoor Heavy-Duty Tiles',
  'Mosaic Fabrications from Tiles',
  'Swimming Pool Tiles',
  'Marble and Granite',
  'Marble Countertops and Fabrications',
  'Sanitary Ware',
  'Bathroom Fittings'
];

// ==========================================
// GET GALLERY CATEGORIES
// ==========================================
export const getGalleryCategories = async (_, res) => {
  try {
    res.json({
      success: true,
      categories: galleryCategories
    });
  } catch (error) {
    console.error('Error fetching gallery categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching gallery categories' 
    });
  }
};

// ==========================================
// GET ALL GALLERY ITEMS
// ==========================================
export const getAllGallery = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'specifications.size': { $regex: search, $options: 'i' } },
        { 'specifications.finish': { $regex: search, $options: 'i' } }
      ];
    }

    const totalItems = await Gallery.countDocuments(query);

    const galleryItems = await Gallery.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      galleryItems,
      totalItems,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching gallery items',
      error: error.message 
    });
  }
};

// ==========================================
// GET GALLERY ITEM BY ID
// ==========================================
export const getGalleryById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery item not found' 
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching gallery item',
      error: error.message 
    });
  }
};

// ==========================================
// CREATE GALLERY ITEM
// ==========================================
export const createGallery = async (req, res) => {
  try {
    console.log('📝 Creating gallery item...');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files?.length || 0);

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one image is required' 
      });
    }

    // Extract image URLs from multer-s3
    const images = req.files.map((file, index) => {
      console.log(`Processing file ${index}:`, {
        location: file.location,
        key: file.key,
        originalname: file.originalname
      });

      return {
        url: file.location,
        key: file.key,
        altText: req.body[`altText_${index}`] || '',
        order: index
      };
    });

    console.log('Images processed:', images.length);

    // Prepare gallery data
    const galleryData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      images,
      specifications: {
        size: req.body.size || '',
        finish: req.body.finish || '',
        usage: req.body.usage || '',
        thickness: req.body.thickness || '',
        waterAbsorption: req.body.waterAbsorption || '',
        resistance: req.body.resistance || ''
      }
    };

    console.log('Creating gallery item with data:', {
      ...galleryData,
      images: `${galleryData.images.length} images`
    });

    // Create gallery item
    const galleryItem = await Gallery.create(galleryData);
    
    console.log('✅ Gallery item created successfully:', galleryItem._id);
    
    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('❌ Error creating gallery item:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating gallery item',
      error: error.message 
    });
  }
};

// ==========================================
// UPDATE GALLERY ITEM
// ==========================================
export const updateGallery = async (req, res) => {
  try {
    console.log('📝 Updating gallery item:', req.params.id);
    console.log('Request body:', req.body);
    console.log('New files:', req.files?.length || 0);

    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery item not found' 
      });
    }

    // Add new images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.location,
        key: file.key,
        altText: req.body[`altText_${index}`] || '',
        order: galleryItem.images.length + index
      }));

      galleryItem.images.push(...newImages);
      console.log(`Added ${newImages.length} new images`);
    }

    // Update gallery fields
    galleryItem.title = req.body.title;
    galleryItem.description = req.body.description;
    galleryItem.category = req.body.category;
    galleryItem.specifications = {
      size: req.body.size || '',
      finish: req.body.finish || '',
      usage: req.body.usage || '',
      thickness: req.body.thickness || '',
      waterAbsorption: req.body.waterAbsorption || '',
      resistance: req.body.resistance || ''
    };
    galleryItem.updatedAt = new Date();

    await galleryItem.save();
    
    console.log('✅ Gallery item updated successfully');
    
    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('❌ Error updating gallery item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating gallery item',
      error: error.message 
    });
  }
};

// ==========================================
// DELETE GALLERY IMAGE
// ==========================================
export const deleteGalleryImage = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery item not found' 
      });
    }

    const index = Number(req.params.imageIndex);
    if (isNaN(index) || index < 0 || index >= galleryItem.images.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid image index' 
      });
    }

    // Delete from S3
    const imageToDelete = galleryItem.images[index];
    console.log('🗑️ Deleting image from S3:', imageToDelete.key);

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_GALLERY_BUCKET || process.env.AWS_PROPERTY_BUCKET,
        Key: imageToDelete.key
      });
      await s3Client.send(deleteCommand);
      console.log('✅ Image deleted from S3');
    } catch (s3Error) {
      console.error('⚠️ Error deleting from S3:', s3Error);
      // Continue anyway to remove from database
    }

    // Remove from array
    galleryItem.images.splice(index, 1);
    
    // Re-order remaining images
    galleryItem.images.forEach((img, idx) => {
      img.order = idx;
    });

    await galleryItem.save();

    console.log('✅ Image removed from gallery item');
    
    res.json({ 
      success: true,
      message: 'Image deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('❌ Error deleting gallery image:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting gallery image',
      error: error.message 
    });
  }
};

// ==========================================
// DELETE GALLERY ITEM
// ==========================================
export const deleteGallery = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery item not found' 
      });
    }

    // Delete all images from S3
    console.log(`🗑️ Deleting ${galleryItem.images.length} images from S3`);
    
    for (const img of galleryItem.images) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_GALLERY_BUCKET || process.env.AWS_PROPERTY_BUCKET,
          Key: img.key
        });
        await s3Client.send(deleteCommand);
        console.log('✅ Deleted:', img.key);
      } catch (error) {
        console.error('⚠️ Error deleting image:', img.key, error.message);
        // Continue with other deletions
      }
    }

    // Delete gallery item
    await galleryItem.deleteOne();
    
    console.log('✅ Gallery item deleted successfully');
    
    res.json({ 
      success: true,
      message: 'Gallery item deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('❌ Error deleting gallery item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting gallery item',
      error: error.message 
    });
  }
};