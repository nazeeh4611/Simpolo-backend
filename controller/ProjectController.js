import Project from "../model/Project.js";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-provider-env";

/* ===========================
   S3 CLIENT (FOR DELETE ONLY)
=========================== */
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

/* ===========================
   GET CATEGORIES
=========================== */
export const getProjectCategories = async (_, res) => {
  res.json({ success: true, categories: projectCategories });
};

/* ===========================
   GET ALL PROJECTS
=========================== */
export const getAllProjects = async (req, res) => {
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
};

/* ===========================
   GET BY ID
=========================== */
export const getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res.status(404).json({ success: false, message: "Not found" });

  res.json({ success: true, data: project });
};

/* ===========================
   CREATE PROJECT ✅ FIXED
=========================== */
export const createProject = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, message: "Images required" });

    const images = req.files.map((file, index) => ({
      url: file.location,   // ✅ from multer-s3
      key: file.key,
      caption: req.body[`caption_${index}`] || "",
      order: index,
    }));

    const productsUsed = req.body.productsUsed
      ? JSON.parse(req.body.productsUsed)
      : [];

    const project = await Project.create({
      title: req.body.title,
      client: req.body.client,
      location: req.body.location,
      description: req.body.description,
      category: req.body.category,
      scope: req.body.scope || "",
      completionDate: req.body.completionDate || null,
      featured: req.body.featured === "true",
      images,
      productsUsed,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ===========================
   UPDATE PROJECT
=========================== */
export const updateProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res.status(404).json({ success: false, message: "Not found" });

  if (req.files?.length) {
    req.files.forEach((file) => {
      project.images.push({
        url: file.location,
        key: file.key,
        order: project.images.length,
      });
    });
  }

  Object.assign(project, req.body);
  await project.save();

  res.json({ success: true, data: project });
};

/* ===========================
   DELETE PROJECT IMAGE
=========================== */
export const deleteProjectImage = async (req, res) => {
  const project = await Project.findById(req.params.id);
  const image = project.images[req.params.imageIndex];

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: image.key,
    })
  );

  project.images.splice(req.params.imageIndex, 1);
  await project.save();

  res.json({ success: true });
};

/* ===========================
   DELETE PROJECT
=========================== */
export const deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);

  for (const img of project.images) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: img.key,
      })
    );
  }

  await project.deleteOne();
  res.json({ success: true });
};
