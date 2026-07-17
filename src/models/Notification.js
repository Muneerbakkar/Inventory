import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['LowStock', 'OverduePayment', 'System'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      // Could be Product ID or Invoice ID
    },
    relatedEntityModel: {
      type: String,
      enum: ['Product', 'Invoice', null],
    }
  },
  { timestamps: true }
);

notificationSchema.index({ type: 1, relatedEntityId: 1 }, { unique: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
