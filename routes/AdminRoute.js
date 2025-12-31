// routes/adminRoutes.js
import express from "express";
import multer from "multer";
import dotenv from "dotenv";

import { adminAuth } from "../middleware/auth.js";

import {
  registerAdmin,
  loginAdmin,
  seedAdmins,
  changePassword,
} from "../controller/AuthController.js";

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

/* =========================================================
   🔍 ENV CHECK (SAFE TO REMOVE AFTER CONFIRMATION)
========================================================= */
console.log("==== AWS ENV CHECK ====");
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("AWS_BUCKET:", process.env.AWS_BUCKET);
console.log("AWS_ACCESS_KEY_ID exists:", !!process.env.AWS_ACCESS_KEY_ID);
console.log(
  "AWS_SECRET_ACCESS_KEY exists:",
  !!process.env.AWS_SECRET_ACCESS_KEY
);
console.log("=======================");

/* =========================================================
   📦 MULTER CONFIG (MEMORY STORAGE)
========================================================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
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

/* =========================================================
   🔐 AUTH ROUTES
========================================================= */
router.post("/seed", seedAdmins);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/change-password", adminAuth, changePassword);

/* =========================================================
   🖼️ GALLERY ROUTES
========================================================= */
router.get("/gallery/categories", adminAuth, getGalleryCategories);
router.get("/gallery", adminAuth, getAllGallery);
router.get("/gallery/:id", adminAuth, getGalleryById);

router.post(
  "/gallery",
  adminAuth,
  upload.array("images", 10),
  createGallery
);

router.put(
  "/gallery/:id",
  adminAuth,
  upload.array("images", 10),
  updateGallery
);

router.delete(
  "/gallery/:id/images/:imageIndex",
  adminAuth,
  deleteGalleryImage
);

router.delete("/gallery/:id", adminAuth, deleteGallery);

/* =========================================================
   🏗️ PROJECT ROUTES
========================================================= */
router.get("/projects/categories", adminAuth, getProjectCategories);
router.get("/projects", adminAuth, getAllProjects);
router.get("/projects/:id", adminAuth, getProjectById);

router.post(
  "/projects",
  adminAuth,
  upload.array("images", 10),
  createProject
);

router.put(
  "/projects/:id",
  adminAuth,
  upload.array("images", 10),
  updateProject
);

router.delete(
  "/projects/:id/images/:imageIndex",
  adminAuth,
  deleteProjectImage
);

router.delete("/projects/:id", adminAuth, deleteProject);

export default router;
