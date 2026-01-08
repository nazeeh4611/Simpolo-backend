import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Gallery title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },

    category: {
      type: String,
      required: [true, 'Gallery category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    },

    images: [
      {
        url: {
          type: String,
          required: [true, 'Image URL is required']
        },
        key: {
          type: String,
          required: true
        },
        altText: {
          type: String,
          trim: true,
          maxlength: [200, 'Alt text cannot exceed 200 characters']
        },
        order: {
          type: Number,
          default: 0
        }
      }
    ],

    catalog: {
      url: {
        type: String
      },
      key: {
        type: String
      },
      filename: {
        type: String
      },
      size: {
        type: Number
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },

    specifications: {
      type: Object
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },

    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

gallerySchema.index({ title: 'text', description: 'text' });
gallerySchema.index({ category: 1 });
gallerySchema.index({ featured: -1, createdAt: -1 });

gallerySchema.virtual('imageCount').get(function () {
  return this.images.length;
});

gallerySchema.virtual('hasCatalog').get(function () {
  return !!this.catalog;
});

const Gallery = mongoose.model('Gallery', gallerySchema);
export default Gallery;