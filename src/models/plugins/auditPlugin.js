import mongoose from 'mongoose';
import AuditLog from '../AuditLog.js';
import { auditLocalStorage } from '../../utils/auditContext.js';

/**
 * A mongoose plugin to automatically record Audit Logs for creations, updates, and deletions.
 * To capture the user, the `req.user` must be passed via the `options.user` when saving/updating.
 * For example:
 * await document.save({ user: req.user._id });
 * or
 * await Model.findByIdAndUpdate(id, updateData, { new: true, user: req.user._id });
 */
const auditPlugin = (schema, options) => {
  const moduleName = options && options.moduleName ? options.moduleName : 'Unknown';

  // Helper to extract user from options, document or context
  const getUserId = (doc, opts) => {
    if (opts && opts.user) return opts.user;
    if (doc && doc.$locals && doc.$locals.user) return doc.$locals.user;
    
    // Check AsyncLocalStorage context
    const contextUser = auditLocalStorage?.getStore();
    if (contextUser) return contextUser;

    return null; // System action if no user
  };

  schema.post('save', async function (doc, next) {
    try {
      const userId = getUserId(doc, undefined);
      if (!userId) {
        // We skip logging if we can't identify the user (e.g. initial seed)
        // unless we want to log it as a system action
        return next();
      }

      // Check if document is new or updated
      const action = doc.$wasNew || doc.isNew ? 'CREATE' : 'UPDATE';
      
      await AuditLog.create({
        user: userId,
        action: action,
        module: moduleName,
        documentId: doc._id,
        readableId: doc.customId || doc.invoiceNumber || doc.billNumber || doc.quotationNumber || doc.returnNumber || doc.noteNumber || doc.name || doc._id,
      });

      next();
    } catch (err) {
      console.error('Error creating audit log:', err);
      next(err);
    }
  });

  schema.post('findOneAndUpdate', async function (doc, next) {
    if (!doc) return next();
    
    try {
      const opts = this.getOptions();
      let userId = opts.user;
      
      if (!userId) {
        userId = auditLocalStorage?.getStore();
      }
      
      if (!userId) return next();

      await AuditLog.create({
        user: userId,
        action: 'UPDATE',
        module: moduleName,
        documentId: doc._id,
        readableId: doc.customId || doc.invoiceNumber || doc.billNumber || doc.quotationNumber || doc.returnNumber || doc.noteNumber || doc.name || doc._id,
      });

      next();
    } catch (err) {
      console.error('Error creating audit log:', err);
      next(err);
    }
  });

  schema.post('findOneAndDelete', async function (doc, next) {
    if (!doc) return next();
    
    try {
      const opts = this.getOptions();
      let userId = opts.user;
      
      if (!userId) {
        userId = auditLocalStorage?.getStore();
      }
      
      if (!userId) return next();

      await AuditLog.create({
        user: userId,
        action: 'DELETE',
        module: moduleName,
        documentId: doc._id,
        readableId: doc.customId || doc.invoiceNumber || doc.billNumber || doc.quotationNumber || doc.returnNumber || doc.noteNumber || doc.name || doc._id,
      });

      next();
    } catch (err) {
      console.error('Error creating audit log:', err);
      next(err);
    }
  });
};

export default auditPlugin;
