import Gallery from '../models/Gallery.js'
import Project from '../models/Project.js'

export const getAllGalleryItems = async (req, res) => {
  const { category } = req.query
  const filter = category ? { category } : {}
  res.json(await Gallery.find(filter).sort('-createdAt'))
}

export const getGalleryItemById = async (req, res) => {
  const item = await Gallery.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
}

export const getAllProjects = async (req, res) => {
  const { category, featured } = req.query
  const filter = {}

  if (category) filter.category = category
  if (featured === 'true') filter.featured = true

  res.json(await Project.find(filter).sort('-createdAt'))
}

export const getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id)
  if (!project) return res.status(404).json({ message: 'Not found' })
  res.json(project)
}
