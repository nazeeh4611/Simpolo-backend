import Project from "../model/Project.js";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-provider-env";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

const projectCategories = [
  "Residential",
  "Commercial",
  "Hospitality",
  "Government",
  "Pool & Villa",
];

export const getProjectCategories = async (_, res) => {
  res.json({ success: true, categories: projectCategories });
};

export const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (category && category !== "all") query.category = category;

    const projects = await Project.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort("-createdAt");

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    console.log("Files received:", req.files);
    console.log("Body received:", req.body);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one image or video is required" 
      });
    }

    const images = req.files.map((file, index) => ({
      url: file.location,
      key: file.key,
      caption: req.body[`caption_${index}`] || "",
      order: index,
    }));

    let productsUsed = [];
    if (req.body.productsUsed) {
      try {
        const productsValue = req.body.productsUsed;
        if (typeof productsValue === 'string' && productsValue.trim()) {
          const parsedProducts = JSON.parse(productsValue);
          if (Array.isArray(parsedProducts)) {
            productsUsed = parsedProducts.filter(product => 
              product && product.name && product.name.trim()
            );
          }
        }
      } catch (error) {
        console.error("Error parsing productsUsed:", error);
      }
    }

    const projectData = {
      title: req.body.title,
      client: req.body.client,
      location: req.body.location,
      description: req.body.description,
      category: req.body.category,
      scope: req.body.scope || "",
      featured: req.body.featured === "true" || req.body.featured === true || false,
      images,
      productsUsed,
    };

    // Handle completionDate - it might be an array due to duplicate form fields
    if (req.body.completionDate) {
      if (Array.isArray(req.body.completionDate)) {
        // Take the first non-empty value
        const validDate = req.body.completionDate.find(date => date && date.trim());
        if (validDate && validDate.trim()) {
          projectData.completionDate = validDate;
        }
      } else if (typeof req.body.completionDate === 'string' && req.body.completionDate.trim()) {
        projectData.completionDate = req.body.completionDate;
      }
    }

    const project = await Project.create(projectData);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.errors || "Internal server error" 
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (req.files && req.files.length > 0) {
      const startIndex = project.images.length;
      req.files.forEach((file, index) => {
        project.images.push({
          url: file.location,
          key: file.key,
          caption: req.body[`caption_${index + startIndex}`] || "",
          order: project.images.length,
        });
      });
    }

    // Update basic fields
    const updateFields = [
      'title', 'client', 'location', 'description', 
      'category', 'scope', 'featured'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'featured') {
          project[field] = req.body[field] === "true" || req.body[field] === true;
        } else {
          project[field] = req.body[field];
        }
      }
    });

    // Handle completionDate
    if (req.body.completionDate !== undefined) {
      if (Array.isArray(req.body.completionDate)) {
        const validDate = req.body.completionDate.find(date => date && date.trim());
        if (validDate && validDate.trim()) {
          project.completionDate = validDate;
        } else if (req.body.completionDate.length === 0) {
          project.completionDate = null;
        }
      } else if (req.body.completionDate === '' || req.body.completionDate === null) {
        project.completionDate = null;
      } else if (typeof req.body.completionDate === 'string' && req.body.completionDate.trim()) {
        project.completionDate = req.body.completionDate;
      }
    }

    // Handle productsUsed
    if (req.body.productsUsed !== undefined) {
      try {
        let productsUsed = [];
        const productsValue = req.body.productsUsed;
        
        if (productsValue) {
          if (typeof productsValue === 'string' && productsValue.trim()) {
            const parsedProducts = JSON.parse(productsValue);
            if (Array.isArray(parsedProducts)) {
              productsUsed = parsedProducts.filter(product => 
                product && product.name && product.name.trim()
              );
            }
          } else if (Array.isArray(productsValue)) {
            productsUsed = productsValue.filter(product => 
              product && product.name && product.name.trim()
            );
          }
        }
        project.productsUsed = productsUsed;
      } catch (error) {
        console.error("Error parsing productsUsed in update:", error);
      }
    }

    await project.save();

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.errors || "Internal server error" 
    });
  }
};

export const deleteProjectImage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= project.images.length) {
      return res.status(400).json({ success: false, message: "Invalid image index" });
    }

    const image = project.images[imageIndex];

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: image.key,
      })
    );

    project.images.splice(imageIndex, 1);
    await project.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    for (const img of project.images) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: img.key,
          })
        );
      } catch (s3Error) {
        console.error("Error deleting S3 object:", s3Error);
      }
    }

    await project.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};