import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-provider-env";

import { adminAuth } from "../middleware/auth.js";

/* ===========================
   AUTH CONTROLLERS
=========================== */
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

/* ===========================
   DASHBOARD
=========================== */
import {
  getDashboardStats
} from "../controller/DashboardController.js";

/* ===========================
   GALLERY
=========================== */
import {
  getGalleryCategories,
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGalleryImage,
  deleteGallery,
} from "../controller/GalleryController.js";

/* ===========================
   PROJECTS
=========================== */
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

/* =====================================================
   AWS S3 CLIENT (INLINE CONFIG)
===================================================== */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

/* =====================================================
   MULTER S3 CONFIG (SINGLE INSTANCE FOR GALLERY + PROJECTS)
===================================================== */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const folder = req.originalUrl.includes("/projects")
        ? "projects"
        : "gallery";

      const fileName = `${folder}/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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

/* =====================================================
   DASHBOARD
===================================================== */
router.get("/dashboard", adminAuth, getDashboardStats);

/* =====================================================
   ADMIN AUTH
===================================================== */
router.post("/seed", seedAdmins);
router.post("/login", loginAdmin);

router.post("/register", adminAuth, registerAdmin);
router.put("/change-password", adminAuth, changePassword);

router.get("/profile", adminAuth, getAdminProfile);
router.put("/profile", adminAuth, updateAdminProfile);

router.get("/admins", adminAuth, getAllAdmins);
router.post("/admins/:adminId/reset-password", adminAuth, resetAdminPassword);

/* =====================================================
   GALLERY ROUTES
===================================================== */
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

/* =====================================================
   PROJECT ROUTES
===================================================== */
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
