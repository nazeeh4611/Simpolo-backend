import express from "express";
import multer from "multer";
import dotenv from "dotenv";

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

import {
  getDashboardStats
} from "../controller/DashboardController.js";

import {
  getGalleryCategories,
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGalleryImage,
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.get("/dashboard", adminAuth, getDashboardStats);

router.get("/profile", adminAuth, getAdminProfile);
router.put("/profile", adminAuth, updateAdminProfile);
router.get("/admins", adminAuth, getAllAdmins);
router.post("/admins/:adminId/reset-password", adminAuth, resetAdminPassword);

router.post("/seed", seedAdmins);
router.post("/register", adminAuth, registerAdmin);
router.post("/login", loginAdmin);
router.put("/change-password", adminAuth, changePassword);

router.get("/gallery/categories", adminAuth, getGalleryCategories);
router.get("/gallery", adminAuth, getAllGallery);
router.get("/gallery/:id", adminAuth, getGalleryById);
router.post("/gallery", adminAuth, upload.array("images", 10), createGallery);
router.put("/gallery/:id", adminAuth, upload.array("images", 10), updateGallery);
router.delete("/gallery/:id/images/:imageIndex", adminAuth, deleteGalleryImage);
router.delete("/gallery/:id", adminAuth, deleteGallery);

router.get("/projects/categories", adminAuth, getProjectCategories);
router.get("/projects", adminAuth, getAllProjects);
router.get("/projects/:id", adminAuth, getProjectById);
router.post("/projects", adminAuth, upload.array("images", 10), createProject);
router.put("/projects/:id", adminAuth, upload.array("images", 10), updateProject);
router.delete("/projects/:id/images/:imageIndex", adminAuth, deleteProjectImage);
router.delete("/projects/:id", adminAuth, deleteProject);

export default router;