import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Image key is required'],
    trim: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [300, 'Caption cannot exceed 300 characters'],
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const productUsedSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  quantity: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

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
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [200, 'Client name cannot exceed 200 characters']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [300, 'Location cannot exceed 300 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
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
      maxlength: [3000, 'Scope cannot exceed 3000 characters'],
      default: ''
    },
    completionDate: {
      type: Date,
      default: null
    },
    featured: {
      type: Boolean,
      default: false
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: function(images) {
          return images && images.length > 0;
        },
        message: 'At least one image is required'
      }
    },
    productsUsed: {
      type: [productUsedSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

projectSchema.index({ title: 'text', description: 'text', client: 'text' });
projectSchema.index({ category: 1 });
projectSchema.index({ featured: -1, completionDate: -1 });
projectSchema.index({ createdAt: -1 });

projectSchema.virtual('imageCount').get(function () {
  return this.images ? this.images.length : 0;
});

projectSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    this.images.forEach((img, index) => {
      if (img.order === undefined || img.order === null) {
        img.order = index;
      }
    });
    this.images.sort((a, b) => a.order - b.order);
  }
  
  if (this.productsUsed) {
    this.productsUsed = this.productsUsed.filter(product => 
      product && typeof product === 'object' && product.name && product.name.trim()
    );
  }
  
});

const Project = mongoose.model('Project', projectSchema);

export default Project;