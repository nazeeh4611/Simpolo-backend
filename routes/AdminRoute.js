// routes/adminRoutes.js
import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import dotenv from 'dotenv';

import { adminAuth } from '../middleware/auth.js';
import {
  registerAdmin,
  loginAdmin,
  seedAdmins,
  changePassword
} from '../controller/AuthController.js';
import {
  getGalleryCategories,
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGalleryImage,
  deleteGallery
} from '../controller/GalleryController.js';
import {
  getProjectCategories,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProjectImage,
  deleteProject
} from '../controller/ProjectController.js';

dotenv.config();

const router = express.Router();

/* ------------------------------ AWS S3 CONFIGURATION ------------------------------ */

// Validate required environment variables
const requiredEnvVars = ['AWS_REGION', 'AWS_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

console.log('🔧 AWS S3 Configuration:');
console.log('   Region:', process.env.AWS_REGION);
console.log('   Bucket:', process.env.AWS_BUCKET);

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

// Image file filter
const isAllowedImage = (mimetype) =>
  ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'].includes(mimetype);

/* ------------------------------ UNIFIED MULTER UPLOAD ------------------------------ */

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
      });
    },
    key: (req, file, cb) => {
      // Determine prefix based on the route/endpoint
      let prefix = 'uploads';
      
      if (req.baseUrl.includes('/gallery') || req.path.includes('/gallery')) {
        prefix = 'gallery';
      } else if (req.baseUrl.includes('/projects') || req.path.includes('/projects')) {
        prefix = 'projects';
      }

      const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const filename = file.originalname.replace(/\s+/g, '-');
      const key = `${prefix}/${unique}-${filename}`;
      
      cb(null, key);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    if (isAllowedImage(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
  },
});

/* ------------------------------ AUTH ROUTES ------------------------------ */

router.post('/seed', seedAdmins);
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.put('/change-password', adminAuth, changePassword);

/* ------------------------------ GALLERY ROUTES ------------------------------ */

router.get('/gallery/categories', adminAuth, getGalleryCategories);
router.get('/gallery', adminAuth, getAllGallery);
router.get('/gallery/:id', adminAuth, getGalleryById);
router.post('/gallery', adminAuth, upload.array('images', 10), createGallery);
router.put('/gallery/:id', adminAuth, upload.array('images', 10), updateGallery);
router.delete('/gallery/:id/images/:imageIndex', adminAuth, deleteGalleryImage);
router.delete('/gallery/:id', adminAuth, deleteGallery);

/* ------------------------------ PROJECT ROUTES ------------------------------ */

router.get('/projects/categories', adminAuth, getProjectCategories);
router.get('/projects', adminAuth, getAllProjects);
router.get('/projects/:id', adminAuth, getProjectById);
router.post('/projects', adminAuth, upload.array('images', 10), createProject);
router.put('/projects/:id', adminAuth, upload.array('images', 10), updateProject);
router.delete('/projects/:id/images/:imageIndex', adminAuth, deleteProjectImage);
router.delete('/projects/:id', adminAuth, deleteProject);

export default router;