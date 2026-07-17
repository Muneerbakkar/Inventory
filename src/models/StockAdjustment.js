import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Adjustment must belong to a product'],
    },
    type: {
      type: String,
      enum: ['Add', 'Remove'],
      required: [true, 'Adjustment type must be Add or Remove'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      enum: ['New Stock', 'Return', 'Damage', 'Loss', 'Correction', 'Other'],
      required: [true, 'A reason is required'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An adjustment must be logged by a user'],
    },
  },
  {
    timestamps: true,
  }
);

stockAdjustmentSchema.plugin(auditPlugin, { moduleName: 'StockAdjustment' });

const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);

export default StockAdjustment;
