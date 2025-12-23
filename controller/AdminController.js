// import bcrypt from 'bcryptjs'
// import jwt from 'jsonwebtoken'
// import Admin from '../models/Admin.js'
// import Gallery from '../models/Gallery.js'
// import { deleteFromS3 } from '../config/awsS3.js'

// const galleryCategories = [
//   'Porcelain Tiles',
//   'Porcelain Tiles Fabrications',
//   'Slab Tiles',
//   'Ceramic Tiles',
//   'Outdoor Heavy-Duty Tiles',
//   'Mosaic Fabrications from Tiles',
//   'Swimming Pool Tiles',
//   'Marble and Granite',
//   'Marble Countertops and Fabrications',
//   'Sanitary Ware',
//   'Bathroom Fittings'
// ]

// export const registerAdmin = async (req, res) => {
//   const hash = await bcrypt.hash(req.body.password, 10)
//   await Admin.create({ email: req.body.email, password: hash })
//   res.json({ success: true })
// }

// export const loginAdmin = async (req, res) => {
//   const admin = await Admin.findOne({ email: req.body.email })
//   if (!admin) return res.status(401).json({ message: 'Invalid credentials' })
//   const ok = await bcrypt.compare(req.body.password, admin.password)
//   if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
//   const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
//   res.json({ token })
// }

// export const getGalleryCategories = async (_, res) => {
//   res.json(galleryCategories)
// }

// export const getAllGallery = async (_, res) => {
//   res.json(await Gallery.find().sort('-createdAt'))
// }

// export const getGalleryById = async (req, res) => {
//   res.json(await Gallery.findById(req.params.id))
// }

// export const createGallery = async (req, res) => {
//   const images = req.files.map((f, i) => ({
//     url: f.location,
//     key: f.key,
//     altText: req.body[`altText_${i}`] || '',
//     order: i
//   }))

//   const item = await Gallery.create({
//     title: req.body.title,
//     description: req.body.description,
//     category: req.body.category,
//     images,
//     specifications: {
//       size: req.body.size,
//       finish: req.body.finish,
//       usage: req.body.usage,
//       thickness: req.body.thickness,
//       waterAbsorption: req.body.waterAbsorption,
//       resistance: req.body.resistance
//     }
//   })

//   res.json(item)
// }

// export const updateGallery = async (req, res) => {
//   const item = await Gallery.findById(req.params.id)

//   const newImages = req.files.map((f, i) => ({
//     url: f.location,
//     key: f.key,
//     altText: req.body[`altText_${i}`] || '',
//     order: item.images.length + i
//   }))

//   item.title = req.body.title
//   item.description = req.body.description
//   item.category = req.body.category
//   item.images = [...item.images, ...newImages]
//   item.specifications = {
//     size: req.body.size,
//     finish: req.body.finish,
//     usage: req.body.usage,
//     thickness: req.body.thickness,
//     waterAbsorption: req.body.waterAbsorption,
//     resistance: req.body.resistance
//   }
//   item.updatedAt = new Date()

//   await item.save()
//   res.json(item)
// }

// export const deleteGalleryImage = async (req, res) => {
//   const item = await Gallery.findById(req.params.id)
//   const index = Number(req.params.imageIndex)

//   if (!item.images[index]) return res.status(400).json({ message: 'Invalid index' })

//   await deleteFromS3(item.images[index].key)
//   item.images.splice(index, 1)
//   await item.save()

//   res.json({ deleted: true })
// }

// export const deleteGallery = async (req, res) => {
//   const item = await Gallery.findById(req.params.id)
//   for (const img of item.images) await deleteFromS3(img.key)
//   await item.deleteOne()
//   res.json({ deleted: true })
// }
