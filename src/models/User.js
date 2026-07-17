import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import customIdPlugin from './plugins/customIdPlugin.js';
import auditPlugin from './plugins/auditPlugin.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'SalesStaff', 'WarehouseStaff', 'Accountant'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  // Only hash if password field is present AND modified
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  if (!candidatePassword || !userPassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.plugin(auditPlugin, { moduleName: 'User' });
userSchema.plugin(customIdPlugin, { modelName: 'User' });

const User = mongoose.model('User', userSchema);
export default User;
