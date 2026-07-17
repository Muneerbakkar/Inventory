import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';
import customIdPlugin from './plugins/customIdPlugin.js';

const referralPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A referral person must have a name'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Settled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

referralPersonSchema.plugin(auditPlugin, { moduleName: 'ReferralPerson' });
referralPersonSchema.plugin(customIdPlugin, { modelName: 'ReferralPerson' });

const ReferralPerson = mongoose.model('ReferralPerson', referralPersonSchema);
export default ReferralPerson;
