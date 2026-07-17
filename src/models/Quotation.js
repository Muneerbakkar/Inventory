import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const quotationItemSchema = new mongoose.Schema({
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
  sellingPrice: {
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
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    validTillDate: {
      type: Date,
    },
    customerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
    },
    items: [quotationItemSchema],
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
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Converted', 'Expired', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.plugin(auditPlugin, { moduleName: 'Quotation' });

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
