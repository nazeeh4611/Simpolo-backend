import Gallery from '../model/Gallery.js';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';

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

export const createGallery = async (req, res) => {
  try {
    console.log('Creating gallery item...');
    console.log('Files received:', req.files);

    const imageFiles = req.files?.images || [];
    const catalogFile = req.files?.catalog?.[0] || null;

    if (imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    const images = imageFiles.map((file, index) => ({
      url: file.location,
      key: file.key,
      altText: req.body[`altText_${index}`] || '',
      order: index
    }));

    const catalog = catalogFile
      ? {
          url: catalogFile.location,
          key: catalogFile.key,
          filename: catalogFile.originalname,
          size: catalogFile.size
        }
      : null;

    const galleryData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      images,
      catalog,
      specifications: {
        size: req.body.size || '',
        finish: req.body.finish || '',
        usage: req.body.usage || '',
        thickness: req.body.thickness || '',
        waterAbsorption: req.body.waterAbsorption || '',
        resistance: req.body.resistance || ''
      }
    };

    const galleryItem = await Gallery.create(galleryData);

    console.log('Gallery item created:', galleryItem._id);

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gallery item',
      error: error.message
    });
  }
};


export const updateGallery = async (req, res) => {
  try {
    console.log('Updating gallery item:', req.params.id);

    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    // Multer fields()
    const imageFiles = req.files?.images || [];
    const catalogFile = req.files?.catalog?.[0] || null;

    /* ================= ADD NEW IMAGES ================= */
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map((file, index) => ({
        url: file.location,
        key: file.key,
        altText: req.body[`altText_${index}`] || '',
        order: galleryItem.images.length + index
      }));

      galleryItem.images.push(...newImages);
      console.log(`Added ${newImages.length} new images`);
    }

    /* ================= UPDATE CATALOG ================= */
    if (catalogFile) {
      // delete old catalog if exists
      if (galleryItem.catalog?.key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: galleryItem.catalog.key
          });
          await s3Client.send(deleteCommand);
          console.log('Old catalog deleted from S3');
        } catch (err) {
          console.error('Failed to delete old catalog:', err.message);
        }
      }

      galleryItem.catalog = {
        url: catalogFile.location,
        key: catalogFile.key,
        filename: catalogFile.originalname,
        size: catalogFile.size
      };

      console.log('Catalog updated');
    }

    /* ================= UPDATE TEXT FIELDS ================= */
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

    console.log('Gallery item updated successfully');

    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gallery item',
      error: error.message
    });
  }
};


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

    const imageToDelete = galleryItem.images[index];
    console.log('Deleting image from S3:', imageToDelete.key);

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: imageToDelete.key
      });
      await s3Client.send(deleteCommand);
      console.log('Image deleted from S3');
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
    }

    galleryItem.images.splice(index, 1);
    
    galleryItem.images.forEach((img, idx) => {
      img.order = idx;
    });

    await galleryItem.save();

    console.log('Image removed from gallery item');
    
    res.json({ 
      success: true,
      message: 'Image deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting gallery image',
      error: error.message 
    });
  }
};

export const deleteGalleryCatalog = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery item not found' 
      });
    }

    if (!galleryItem.catalog) {
      return res.status(400).json({ 
        success: false,
        message: 'No catalog found for this item' 
      });
    }

    console.log('Deleting catalog from S3:', galleryItem.catalog.key);

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: galleryItem.catalog.key
      });
      await s3Client.send(deleteCommand);
      console.log('Catalog deleted from S3');
    } catch (s3Error) {
      console.error('Error deleting catalog from S3:', s3Error);
    }

    galleryItem.catalog = null;
    await galleryItem.save();

    console.log('Catalog removed from gallery item');
    
    res.json({ 
      success: true,
      message: 'Catalog deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('Error deleting gallery catalog:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting gallery catalog',
      error: error.message 
    });
  }
};

export const deleteGallery = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Gallery item not found' 
      });
    }

    console.log(`Deleting ${galleryItem.images.length} images from S3`);
    
    for (const img of galleryItem.images) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET,
          Key: img.key
        });
        await s3Client.send(deleteCommand);
        console.log('Deleted:', img.key);
      } catch (error) {
        console.error('Error deleting image:', img.key, error.message);
      }
    }

    if (galleryItem.catalog && galleryItem.catalog.key) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET,
          Key: galleryItem.catalog.key
        });
        await s3Client.send(deleteCommand);
        console.log('Deleted catalog:', galleryItem.catalog.key);
      } catch (error) {
        console.error('Error deleting catalog:', error.message);
      }
    }

    await galleryItem.deleteOne();
    
    console.log('Gallery item deleted successfully');
    
    res.json({ 
      success: true,
      message: 'Gallery item deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting gallery item',
      error: error.message 
    });
  }
};