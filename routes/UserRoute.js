import express from 'express'
import {
  getAllGalleryItems,
  getGalleryItemById,
  getAllProjects,
  getProjectById
} from '../controllers/userController.js'

const router = express.Router()

router.get('/gallery', getAllGalleryItems)
router.get('/gallery/:id', getGalleryItemById)

router.get('/projects', getAllProjects)
router.get('/projects/:id', getProjectById)

export default router
