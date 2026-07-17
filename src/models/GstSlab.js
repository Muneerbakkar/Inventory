import mongoose from 'mongoose';

const gstSlabSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Please provide a label for the GST Slab (e.g. 18% GST)'],
      unique: true,
      trim: true,
    },
    cgst: {
      type: Number,
      required: [true, 'CGST is required'],
      min: [0, 'CGST cannot be negative'],
    },
    sgst: {
      type: Number,
      required: [true, 'SGST is required'],
      min: [0, 'SGST cannot be negative'],
    },
    igst: {
      type: Number,
      required: [true, 'IGST is required'],
      min: [0, 'IGST cannot be negative'],
    },
    totalPercent: {
      type: Number,
      required: true,
      min: [0, 'Total percent cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure totalPercent is strictly cgst + sgst OR just igst logic.
// For standard Indian GST, CGST+SGST = Total, and IGST = Total.
gstSlabSchema.pre('validate', function () {
  if (this.cgst !== undefined && this.sgst !== undefined) {
    this.totalPercent = this.cgst + this.sgst;
    
    // Ensure IGST equals total percent for interstate billing
    if (this.igst !== this.totalPercent) {
      this.igst = this.totalPercent;
    }
  }
});

const GstSlab = mongoose.model('GstSlab', gstSlabSchema);

export default GstSlab;
