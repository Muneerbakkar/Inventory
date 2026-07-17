import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from './models/AuditLog.js';
import User from './models/User.js';
import Supplier from './models/Supplier.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import ReferralPerson from './models/ReferralPerson.js';
import Invoice from './models/Invoice.js';
import PurchaseBill from './models/PurchaseBill.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-billing');
  console.log('Connected to DB for AuditLog backfill migration');

  const logs = await AuditLog.find({ readableId: { $exists: false } });
  console.log(`Found ${logs.length} audit logs without readableId.`);

  for (const log of logs) {
    try {
      const Model = mongoose.models[log.module] || mongoose.model(log.module);
      if (Model) {
        const doc = await Model.findById(log.documentId);
        if (doc) {
          log.readableId = doc.customId || doc.invoiceNumber || doc.billNumber || doc.name || doc._id;
          await log.save();
          console.log(`Updated AuditLog ${log._id} with readableId: ${log.readableId}`);
        } else {
          log.readableId = String(log.documentId);
          await log.save();
        }
      } else {
        log.readableId = String(log.documentId);
        await log.save();
      }
    } catch (err) {
      log.readableId = String(log.documentId);
      await log.save();
    }
  }

  console.log('AuditLog migration completed successfully!');
  mongoose.connection.close();
}

run().catch(console.error);
