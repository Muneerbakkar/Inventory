import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const purchaseBillItemSchema = new mongoose.Schema({
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
});

const purchaseBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplierId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierRefNumber: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    items: [purchaseBillItemSchema],
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
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'],
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

purchaseBillSchema.pre('save', function () {
  this.balanceDue = this.grandTotal - this.amountPaid;
  if (this.balanceDue <= 0) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Pending';
  }
});

purchaseBillSchema.plugin(auditPlugin, { moduleName: 'PurchaseBill' });

const PurchaseBill = mongoose.model('PurchaseBill', purchaseBillSchema);
export default PurchaseBill;
