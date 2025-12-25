// controllers/ProjectController.js
import Project from '../model/Project.js'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';

// Initialize S3 client for deletion
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

const projectCategories = [
  'Residential',
  'Commercial',
  'Hospitality',
  'Government',
  'Pool & Villa'
];

// ==========================================
// GET PROJECT CATEGORIES
// ==========================================
export const getProjectCategories = async (_, res) => {
  try {
    res.json({
      success: true,
      categories: projectCategories
    });
  } catch (error) {
    console.error('Error fetching project categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching project categories' 
    });
  }
};

// ==========================================
// GET ALL PROJECTS
// ==========================================
export const getAllProjects = async (req, res) => {
  try {
    console.log("mayy")

    const { page = 1, limit = 10, category, featured, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (featured && featured !== 'all') {
      query.featured = featured === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const totalItems = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      projects,
      totalItems,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching projects',
      error: error.message 
    });
  }
};

// ==========================================
// GET PROJECT BY ID
// ==========================================
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching project',
      error: error.message 
    });
  }
};

// ==========================================
// CREATE PROJECT (with multer-s3 images)
// ==========================================
export const createProject = async (req, res) => {
  try {
    console.log('📝 Creating project...');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files?.length || 0);

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one image is required' 
      });
    }

    // Extract image URLs from multer-s3 (files already uploaded to S3)
    const images = req.files.map((file, index) => {
      console.log(`Processing file ${index}:`, {
        location: file.location,
        key: file.key,
        originalname: file.originalname
      });

      return {
        url: file.location, // S3 URL from multer-s3
        key: file.key,      // S3 key from multer-s3
        caption: req.body[`caption_${index}`] || '',
        order: index
      };
    });

    console.log('Images processed:', images.length);

    // Parse productsUsed if exists
    let productsUsed = [];
    if (req.body.productsUsed) {
      try {
        productsUsed = typeof req.body.productsUsed === 'string' 
          ? JSON.parse(req.body.productsUsed)
          : req.body.productsUsed;
      } catch (error) {
        console.error('Error parsing productsUsed:', error);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid productsUsed format',
          error: error.message 
        });
      }
    }

    // Prepare project data
    const projectData = {
      title: req.body.title,
      client: req.body.client,
      location: req.body.location,
      description: req.body.description,
      category: req.body.category,
      scope: req.body.scope || '',
      completionDate: req.body.completionDate || null,
      featured: req.body.featured === 'true' || req.body.featured === true,
      images,
      productsUsed
    };

    console.log('Creating project with data:', {
      ...projectData,
      images: `${projectData.images.length} images`
    });

    // Create project
    const project = await Project.create(projectData);
    
    console.log('✅ Project created successfully:', project._id);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating project',
      error: error.message 
    });
  }
};

// ==========================================
// UPDATE PROJECT
// ==========================================
export const updateProject = async (req, res) => {
  try {
    console.log('📝 Updating project:', req.params.id);
    console.log('Request body:', req.body);
    console.log('New files:', req.files?.length || 0);

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Add new images if provided (multer-s3 already uploaded them)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.location,
        key: file.key,
        caption: req.body[`caption_${index}`] || '',
        order: project.images.length + index
      }));

      project.images.push(...newImages);
      console.log(`Added ${newImages.length} new images`);
    }

    // Update project fields
    project.title = req.body.title;
    project.client = req.body.client;
    project.location = req.body.location;
    project.description = req.body.description;
    project.category = req.body.category;
    project.scope = req.body.scope || '';
    project.completionDate = req.body.completionDate || null;
    project.featured = req.body.featured === 'true' || req.body.featured === true;

    // Update productsUsed if provided
    if (req.body.productsUsed) {
      try {
        project.productsUsed = typeof req.body.productsUsed === 'string'
          ? JSON.parse(req.body.productsUsed)
          : req.body.productsUsed;
      } catch (error) {
        console.error('Error parsing productsUsed:', error);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid productsUsed format',
          error: error.message 
        });
      }
    }

    await project.save();
    
    console.log('✅ Project updated successfully');
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('❌ Error updating project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating project',
      error: error.message 
    });
  }
};

// ==========================================
// DELETE PROJECT IMAGE
// ==========================================
export const deleteProjectImage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    const index = Number(req.params.imageIndex);
    if (isNaN(index) || index < 0 || index >= project.images.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid image index' 
      });
    }

    // Delete from S3
    const imageToDelete = project.images[index];
    console.log('🗑️ Deleting image from S3:', imageToDelete.key);

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_PROJECT_BUCKET || process.env.AWS_PROPERTY_BUCKET,
        Key: imageToDelete.key
      });
      await s3Client.send(deleteCommand);
      console.log('✅ Image deleted from S3');
    } catch (s3Error) {
      console.error('⚠️ Error deleting from S3:', s3Error);
      // Continue anyway to remove from database
    }

    // Remove from array
    project.images.splice(index, 1);
    
    // Re-order remaining images
    project.images.forEach((img, idx) => {
      img.order = idx;
    });

    await project.save();

    console.log('✅ Image removed from project');
    
    res.json({ 
      success: true,
      message: 'Image deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting image',
      error: error.message 
    });
  }
};

// ==========================================
// DELETE PROJECT
// ==========================================
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Delete all images from S3
    console.log(`🗑️ Deleting ${project.images.length} images from S3`);
    
    for (const img of project.images) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_PROJECT_BUCKET || process.env.AWS_PROPERTY_BUCKET,
          Key: img.key
        });
        await s3Client.send(deleteCommand);
        console.log('✅ Deleted:', img.key);
      } catch (error) {
        console.error('⚠️ Error deleting image:', img.key, error.message);
        // Continue with other deletions
      }
    }

    // Delete project
    await project.deleteOne();
    
    console.log('✅ Project deleted successfully');
    
    res.json({ 
      success: true,
      message: 'Project deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting project',
      error: error.message 
    });
  }
};