import Project from '../models/Project.js'
import { deleteFromS3 } from '../config/awsS3.js'

const projectCategories = [
  'Residential',
  'Commercial',
  'Hospitality',
  'Government',
  'Pool & Villa'
]

export const getProjectCategories = async (_, res) => {
  res.json(projectCategories)
}

export const getAllProjects = async (_, res) => {
  res.json(await Project.find().sort('-createdAt'))
}

export const getProjectById = async (req, res) => {
  res.json(await Project.findById(req.params.id))
}

export const createProject = async (req, res) => {
  const images = req.files.map((f, i) => ({
    url: f.location,
    key: f.key,
    caption: req.body[`caption_${i}`] || '',
    order: i
  }))

  const project = await Project.create({
    title: req.body.title,
    client: req.body.client,
    location: req.body.location,
    description: req.body.description,
    category: req.body.category,
    scope: req.body.scope,
    completionDate: req.body.completionDate || null,
    featured: req.body.featured === 'true' || req.body.featured === true,
    images,
    productsUsed: req.body.productsUsed
      ? JSON.parse(req.body.productsUsed)
      : []
  })

  res.json(project)
}

export const updateProject = async (req, res) => {
  const project = await Project.findById(req.params.id)

  const newImages = req.files.map((f, i) => ({
    url: f.location,
    key: f.key,
    caption: req.body[`caption_${i}`] || '',
    order: project.images.length + i
  }))

  project.title = req.body.title
  project.client = req.body.client
  project.location = req.body.location
  project.description = req.body.description
  project.category = req.body.category
  project.scope = req.body.scope
  project.completionDate = req.body.completionDate || null
  project.featured = req.body.featured === 'true' || req.body.featured === true
  project.productsUsed = req.body.productsUsed
    ? JSON.parse(req.body.productsUsed)
    : project.productsUsed
  project.images = [...project.images, ...newImages]
  project.updatedAt = new Date()

  await project.save()
  res.json(project)
}

export const deleteProjectImage = async (req, res) => {
  const project = await Project.findById(req.params.id)
  const index = Number(req.params.imageIndex)

  if (!project.images[index]) return res.status(400).json({ message: 'Invalid index' })

  await deleteFromS3(project.images[index].key)
  project.images.splice(index, 1)
  await project.save()

  res.json({ deleted: true })
}

export const deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id)
  for (const img of project.images) await deleteFromS3(img.key)
  await project.deleteOne()
  res.json({ deleted: true })
}
