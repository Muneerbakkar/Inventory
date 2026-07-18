import mongoose from 'mongoose';
import auditPlugin from './plugins/auditPlugin.js';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a role name'],
      unique: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false, // System roles cannot be deleted
    },
    description: {
      type: String,
    },
    color: {
      type: String,
      default: 'bg-zinc-500/10 text-zinc-400',
    }
  },
  { timestamps: true }
);

roleSchema.plugin(auditPlugin, { moduleName: 'Role' });

const Role = mongoose.model('Role', roleSchema);
export default Role;
