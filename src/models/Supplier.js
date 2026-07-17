import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';
import customIdPlugin from './plugins/customIdPlugin.js';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a supplier name'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    gstNumber: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional if not required in schema
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: props => `${props.value} is not a valid GST number!`
      }
    },
    gstType: {
      type: String,
      enum: ['Regular', 'Composition', 'Unregistered'],
      default: 'Regular'
    },
    bankDetails: {
      accountNumber: String,
      ifsc: String,
      bankName: String,
    },
    notes: String,
  },
  { timestamps: true }
);

supplierSchema.plugin(auditPlugin, { moduleName: 'Supplier' });
supplierSchema.plugin(customIdPlugin, { modelName: 'Supplier' });

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
