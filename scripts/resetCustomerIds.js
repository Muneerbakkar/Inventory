import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Customer from '../src/models/Customer.js';
import Counter from '../src/models/Counter.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // Reset Customers
    console.log('Resetting Customer customIds starting from 1001...');
    const customers = await Customer.find().sort({ createdAt: 1 });
    let customerSeq = 0;
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      c.customId = String(1001 + i);
      await c.save();
      console.log(`Customer: "${c.name}" -> customId: ${c.customId}`);
      customerSeq = 1001 + i - 1000; // Counter sequence equivalent
    }

    // Update Counter for Customer
    await Counter.findByIdAndUpdate(
      { _id: 'customer_customId' },
      { seq: customerSeq },
      { new: true, upsert: true }
    );
    console.log(`Reset customer_customId counter sequence to ${customerSeq}`);

    console.log('\nCustomer IDs reset successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset customer IDs:', err);
    process.exit(1);
  }
};

run();
