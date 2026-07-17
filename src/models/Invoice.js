import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const invoiceItemSchema = new mongoose.Schema({
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
    },
    items: [invoiceItemSchema],
    referralId: {
      type: mongoose.Schema.ObjectId,
      ref: 'ReferralPerson',
    },
    commissionDetails: {
      type: Number,
      default: 0,
    },
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
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
      default: 'Cash',
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to determine status if not explicitly set correctly
invoiceSchema.pre('save', function () {
  this.balanceDue = this.grandTotal - this.amountPaid;
  if (this.balanceDue <= 0) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Pending';
  }
});

invoiceSchema.plugin(auditPlugin, { moduleName: 'Invoice' });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
