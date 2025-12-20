import mongoose from 'mongoose'

export default mongoose.model(
  'Gallery',
  new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    images: [{ url: String, key: String, altText: String, order: Number }],
    specifications: Object,
    createdAt: { type: Date, default: Date.now }
  })
)
