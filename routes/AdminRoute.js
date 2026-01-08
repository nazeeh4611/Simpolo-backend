import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-provider-env";

import { adminAuth } from "../middleware/auth.js";

import {
  registerAdmin,
  loginAdmin,
  seedAdmins,
  changePassword,
  getAdminProfile,
  updateAdminProfile,
  resetAdminPassword,
  getAllAdmins
} from "../controller/AuthController.js";

import { getDashboardStats } from "../controller/DashboardController.js";

import {
  getGalleryCategories,
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGalleryImage,
  deleteGalleryCatalog,
  deleteGallery,
} from "../controller/GalleryController.js";

import {
  getProjectCategories,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProjectImage,
  deleteProject,
} from "../controller/ProjectController.js";

dotenv.config();
const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = req.originalUrl.includes("/projects")
        ? "projects"
        : "gallery";
      const fileType = file.mimetype === 'application/pdf' ? 'catalogs' : 'images';
      cb(null, `${folder}/${fileType}/${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 11
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    const allowedPdfTypes = ['application/pdf'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedPdfTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

router.get("/dashboard", adminAuth, getDashboardStats);

router.post("/seed", seedAdmins);
router.post("/login", loginAdmin);
router.post("/register", adminAuth, registerAdmin);
router.put("/change-password", adminAuth, changePassword);
router.get("/profile", adminAuth, getAdminProfile);
router.put("/profile", adminAuth, updateAdminProfile);
router.get("/admins", adminAuth, getAllAdmins);
router.post("/admins/:adminId/reset-password", adminAuth, resetAdminPassword);

router.get("/gallery/categories", adminAuth, getGalleryCategories);
router.get("/gallery", adminAuth, getAllGallery);
router.get("/gallery/:id", adminAuth, getGalleryById);
router.post("/gallery", adminAuth, upload.fields([
   { name: "images", maxCount: 10 },
   { name: "catalog", maxCount: 1 }
 ])
 , createGallery);
router.put("/gallery/:id", adminAuth, upload.fields([
   { name: "images", maxCount: 10 },
   { name: "catalog", maxCount: 1 }
 ])
 , updateGallery);
router.delete("/gallery/:id/images/:imageIndex", adminAuth, deleteGalleryImage);
router.delete("/gallery/:id/catalog", adminAuth, deleteGalleryCatalog);
router.delete("/gallery/:id", adminAuth, deleteGallery);

router.get("/projects/categories", adminAuth, getProjectCategories);
router.get("/projects", adminAuth, getAllProjects);
router.get("/projects/:id", adminAuth, getProjectById);
router.post("/projects", adminAuth, upload.array("images", 10), createProject);
router.put("/projects/:id", adminAuth, upload.array("images", 10), updateProject);
router.delete("/projects/:id/images/:imageIndex", adminAuth, deleteProjectImage);
router.delete("/projects/:id", adminAuth, deleteProject);

export default router;