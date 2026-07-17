import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';
import customIdPlugin from './plugins/customIdPlugin.js';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A customer must have a name'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.plugin(auditPlugin, { moduleName: 'Customer' });
customerSchema.plugin(customIdPlugin, { modelName: 'Customer' });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
