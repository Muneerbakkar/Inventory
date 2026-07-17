import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';
import customIdPlugin from './plugins/customIdPlugin.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A category must have a name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentCategory: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.plugin(auditPlugin, { moduleName: 'Category' });
categorySchema.plugin(customIdPlugin, { modelName: 'Category' });

const Category = mongoose.model('Category', categorySchema);

export default Category;
