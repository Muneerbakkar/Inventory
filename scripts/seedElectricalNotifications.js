import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Notification from '../src/models/Notification.js';
import Product from '../src/models/Product.js';
import Invoice from '../src/models/Invoice.js';
import Customer from '../src/models/Customer.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old notification data
    console.log('Clearing old notifications...');
    const deleteRes = await Notification.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old notifications.`);

    // Fetch products and invoices
    const products = await Product.find();
    const invoices = await Invoice.find().populate('customerId');

    if (products.length < 15 || invoices.length < 15) {
      console.error('Error: Seeding notifications requires at least 15 products and 15 invoices in the DB.');
      process.exit(1);
    }

    console.log(`Found ${products.length} products and ${invoices.length} invoices.`);

    const createdNotifications = [];

    // 2. Generate 15 Low Stock Notifications (by adjusting product stock below reorder levels)
    console.log('Generating 15 LowStock notifications...');
    for (let i = 0; i < 15; i++) {
      const prod = products[i];
      
      // Adjust stock to trigger low stock
      prod.quantity = Math.floor(2 + Math.random() * 3); // 2 to 4 units
      prod.reorderLevel = 15; // set reorder level higher than current quantity
      await prod.save();

      const notif = new Notification({
        type: 'LowStock',
        message: `Product '${prod.name}' is running low on stock. Current quantity: ${prod.quantity}. Reorder level: ${prod.reorderLevel}.`,
        isRead: i % 3 === 0, // mix of read/unread
        relatedEntityId: prod._id,
        relatedEntityModel: 'Product'
      });

      await notif.save();
      createdNotifications.push(notif);
      console.log(`Created LowStock Notification: ${notif.message}`);
    }

    // 3. Generate 15 Overdue Payment Notifications (by adjusting invoice payments)
    console.log('\nGenerating 15 OverduePayment notifications...');
    for (let i = 0; i < 15; i++) {
      const inv = invoices[i];
      const customerName = inv.customerId?.name || 'Unknown Customer';

      // Adjust invoice payment to make it overdue/unpaid
      inv.amountPaid = Math.round(inv.grandTotal * 0.1); // paid only 10%
      await inv.save(); // triggers pre-save hook to calculate balanceDue and status

      const notif = new Notification({
        type: 'OverduePayment',
        message: `Invoice ${inv.invoiceNumber} for customer ${customerName} has an outstanding balance of ₹${inv.balanceDue}.`,
        isRead: i % 4 === 0, // mix of read/unread
        relatedEntityId: inv._id,
        relatedEntityModel: 'Invoice'
      });

      await notif.save();
      createdNotifications.push(notif);
      console.log(`Created OverduePayment Notification: ${notif.message}`);
    }

    console.log(`\nSeeding completed successfully. Generated ${createdNotifications.length} unique notifications.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
