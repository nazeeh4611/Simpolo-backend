import Gallery from '../model/Gallery.js'
import { deleteFromS3 } from '../config/awsS3.js'

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
]

export const getGalleryCategories = async (_, res) => {
  res.json(galleryCategories)
}

export const getAllGallery = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const totalItems = await Gallery.countDocuments(filter);
    const items = await Gallery.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
      galleryItems: items
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ message: 'Error fetching gallery items' });
  }
}

export const getGalleryById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({ message: 'Error fetching gallery item' });
  }
}

export const createGallery = async (req, res) => {
  try {
    const images = req.files.map((f, i) => ({
      url: f.location,
      key: f.key,
      altText: req.body[`altText_${i}`] || '',
      order: i
    }));

    const item = await Gallery.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      images,
      specifications: {
        size: req.body.size,
        finish: req.body.finish,
        usage: req.body.usage,
        thickness: req.body.thickness,
        waterAbsorption: req.body.waterAbsorption,
        resistance: req.body.resistance
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ message: 'Error creating gallery item' });
  }
}

export const updateGallery = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    const newImages = req.files.map((f, i) => ({
      url: f.location,
      key: f.key,
      altText: req.body[`altText_${i}`] || '',
      order: item.images.length + i
    }));

    item.title = req.body.title;
    item.description = req.body.description;
    item.category = req.body.category;
    item.images = [...item.images, ...newImages];
    item.specifications = {
      size: req.body.size,
      finish: req.body.finish,
      usage: req.body.usage,
      thickness: req.body.thickness,
      waterAbsorption: req.body.waterAbsorption,
      resistance: req.body.resistance
    };
    item.updatedAt = new Date();

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ message: 'Error updating gallery item' });
  }
}

export const deleteGalleryImage = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    const index = Number(req.params.imageIndex);
    if (isNaN(index) || !item.images[index]) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    await deleteFromS3(item.images[index].key);
    item.images.splice(index, 1);
    await item.save();

    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ message: 'Error deleting gallery image' });
  }
}

export const deleteGallery = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    for (const img of item.images) {
      await deleteFromS3(img.key);
    }
    
    await item.deleteOne();
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ message: 'Error deleting gallery item' });
  }
}