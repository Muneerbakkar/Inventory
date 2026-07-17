import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'My Company',
    },
    logo: {
      type: String, // URL or path
    },
    address: {
      type: String,
    },
    gstin: {
      type: String,
    },
    pan: {
      type: String,
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branch: String,
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
    },
    defaultTerms: {
      type: String,
    },
  },
  { timestamps: true }
);

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
export default CompanySettings;
