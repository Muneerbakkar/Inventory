import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const debitNoteSchema = new mongoose.Schema(
  {
    noteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplierId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    relatedReturnId: {
      type: mongoose.Schema.ObjectId,
      ref: 'PurchaseReturn',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Finalized', 'Settled'],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
  }
);

debitNoteSchema.plugin(auditPlugin, { moduleName: 'DebitNote' });

const DebitNote = mongoose.model('DebitNote', debitNoteSchema);
export default DebitNote;
