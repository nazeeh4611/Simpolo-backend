import mongoose from 'mongoose'

export default mongoose.model(
  'Project',
  new mongoose.Schema({
    title: String,
    client: String,
    location: String,
    description: String,
    category: String,
    scope: String,
    completionDate: Date,
    featured: Boolean,
    images: [
      {
        url: String,
        key: String,
        caption: String,
        order: Number
      }
    ],
    productsUsed: [
      {
        name: String,
        category: String,
        quantity: String
      }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })
)
