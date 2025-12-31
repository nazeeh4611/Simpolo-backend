import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isDefaultPassword: {
      type: Boolean,
      default: true
    },
    name: {
      type: String,
      default: 'Admin'
    },
    role: {
      type: String,
      default: 'admin'
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model('Admin', adminSchema)