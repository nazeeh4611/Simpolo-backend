import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    client: {
      type: String,
      trim: true,
      maxlength: [200, 'Client name cannot exceed 200 characters']
    },

    location: {
      type: String,
      trim: true,
      maxlength: [300, 'Location cannot exceed 300 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },

    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    },

    scope: {
      type: String,
      trim: true,
      maxlength: [3000, 'Scope cannot exceed 3000 characters']
    },

    completionDate: {
      type: Date
    },

    featured: {
      type: Boolean,
      default: false
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
        caption: {
          type: String,
          trim: true,
          maxlength: [300, 'Caption cannot exceed 300 characters']
        },
        order: {
          type: Number,
          default: 0
        }
      }
    ],

    productsUsed: [
      {
        name: {
          type: String,
          trim: true
        },
        category: {
          type: String,
          trim: true
        },
        quantity: {
          type: String,
          trim: true
        }
      }
    ],

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* Indexes */
projectSchema.index({ title: 'text', description: 'text', client: 'text' });
projectSchema.index({ category: 1 });
projectSchema.index({ featured: -1, completionDate: -1 });
projectSchema.index({ createdAt: -1 });

/* Virtuals */
projectSchema.virtual('imageCount').get(function () {
  return this.images.length;
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
