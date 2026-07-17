import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const purchaseReturnItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  gstPercent: {
    type: Number,
    required: true,
    min: 0,
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
  }
});

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    originalBillId: {
      type: mongoose.Schema.ObjectId,
      ref: 'PurchaseBill',
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    items: [purchaseReturnItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalGst: {
      type: Number,
      required: true,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

purchaseReturnSchema.plugin(auditPlugin, { moduleName: 'PurchaseReturn' });

const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
export default PurchaseReturn;
