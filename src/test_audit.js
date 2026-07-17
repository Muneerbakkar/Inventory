import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { auditLocalStorage } from './utils/auditContext.js';
import User from './models/User.js';
import Product from './models/Product.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-billing');
  console.log('Connected to DB');

  const user = await User.findOne();
  if (!user) {
    console.log('No user found to run test');
    mongoose.connection.close();
    return;
  }
  console.log('Using user for audit test:', user.name, user._id);

  // Clear previous test audit logs
  await AuditLog.deleteMany({ user: user._id });

  // Run in AsyncLocalStorage context
  await new Promise((resolve) => {
    auditLocalStorage.run(user._id, async () => {
      try {
        console.log('Inside context, store is:', auditLocalStorage.getStore());
        
        // Find a product
        const product = await Product.findOne();
        if (product) {
          console.log('Found product:', product.name);
          product.name = product.name + ' (tested)';
          await product.save();
          console.log('Product saved successfully');
        } else {
          console.log('No product found to update');
        }
      } catch (err) {
        console.error('Error during save:', err);
      }
      resolve();
    });
  });

  // Check audit logs
  const logs = await AuditLog.find({ user: user._id });
  console.log('Audit logs created:', logs.length);
  logs.forEach(l => {
    console.log(`Action: ${l.action}, Module: ${l.module}, DocId: ${l.documentId}`);
  });

  mongoose.connection.close();
}

run().catch(console.error);
