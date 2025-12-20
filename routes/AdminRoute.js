import express from 'express'
import { upload } from '../config/awsS3.js'
import { adminAuth } from '../middleware/adminAuth.js'
import { registerAdmin, loginAdmin } from '../controllers/adminAuthController.js'
import {
  getGalleryCategories,
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGalleryImage,
  deleteGallery
} from '../controllers/adminGalleryController.js'
import {
  getProjectCategories,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProjectImage,
  deleteProject
} from '../controllers/adminProjectController.js'

const router = express.Router()

router.post('/register', registerAdmin)
router.post('/login', loginAdmin)

router.get('/gallery/categories', adminAuth, getGalleryCategories)
router.get('/gallery', adminAuth, getAllGallery)
router.get('/gallery/:id', adminAuth, getGalleryById)
router.post('/gallery', adminAuth, upload.array('images', 10), createGallery)
router.put('/gallery/:id', adminAuth, upload.array('images', 10), updateGallery)
router.delete('/gallery/:imageIndex/:id', adminAuth, deleteGalleryImage)
router.delete('/gallery/:id', adminAuth, deleteGallery)

router.get('/projects/categories', adminAuth, getProjectCategories)
router.get('/projects', adminAuth, getAllProjects)
router.get('/projects/:id', adminAuth, getProjectById)
router.post('/projects', adminAuth, upload.array('images', 10), createProject)
router.put('/projects/:id', adminAuth, upload.array('images', 10), updateProject)
router.delete('/projects/:imageIndex/:id', adminAuth, deleteProjectImage)
router.delete('/projects/:id', adminAuth, deleteProject)

export default router
