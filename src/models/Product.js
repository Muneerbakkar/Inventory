import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'A product must have a category'],
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
    },
    supplierId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplier',
      required: [true, 'A product must belong to a supplier'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'A product must have a purchase price (excluding GST)'],
      min: [0, 'Purchase price cannot be negative'],
    },
    gstSlabId: {
      type: mongoose.Schema.ObjectId,
      ref: 'GstSlab',
      required: [true, 'A product must have an associated GST slab'],
    },
    priceAfterGst: {
      type: Number,
    },
    maxSellingPrice: {
      type: Number,
      required: [true, 'A product must have a Maximum Retail Price (MRP/MSP)'],
      min: [0, 'Price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'A product must have a selling price'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'A product must have a measurement unit (e.g., pcs, kg, box)'],
      default: 'pcs',
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    commissionPerUnit: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-calculate priceAfterGst before save
productSchema.pre('save', async function () {
  if (this.isModified('purchasePrice') || this.isModified('gstSlabId')) {
    const GstSlab = mongoose.model('GstSlab');
    const slab = await GstSlab.findById(this.gstSlabId);
    
    if (slab) {
      const gstAmount = (this.purchasePrice * slab.totalPercent) / 100;
      this.priceAfterGst = this.purchasePrice + gstAmount;
    }
  }
  
  // Auto-generate SKU if not provided
  if (!this.sku) {
    let categoryCode = 'PRD';
    if (this.category) {
      const Category = mongoose.model('Category');
      const categoryObj = await Category.findById(this.category);
      if (categoryObj && categoryObj.name) {
        categoryCode = categoryObj.name.substring(0, 3).toUpperCase();
      }
    }
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    this.sku = `${categoryCode}-${Date.now().toString().slice(-4)}${randomSuffix}`;
  }
});

import customIdPlugin from './plugins/customIdPlugin.js';

productSchema.plugin(auditPlugin, { moduleName: 'Product' });
productSchema.plugin(customIdPlugin, { modelName: 'Product' });

const Product = mongoose.model('Product', productSchema);

export default Product;
