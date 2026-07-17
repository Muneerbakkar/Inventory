import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Supplier from '../src/models/Supplier.js';
import Category from '../src/models/Category.js';
import Counter from '../src/models/Counter.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Reset Suppliers
    console.log('Resetting Supplier customIds starting from 1001...');
    const suppliers = await Supplier.find().sort({ createdAt: 1 });
    let supplierSeq = 0;
    for (let i = 0; i < suppliers.length; i++) {
      const s = suppliers[i];
      s.customId = String(1001 + i);
      await s.save();
      console.log(`Supplier: "${s.name}" -> customId: ${s.customId}`);
      supplierSeq = 1001 + i - 1000; // Counter sequence equivalent
    }

    // Update Counter for Supplier
    await Counter.findByIdAndUpdate(
      { _id: 'supplier_customId' },
      { seq: supplierSeq },
      { new: true, upsert: true }
    );
    console.log(`Reset supplier_customId counter sequence to ${supplierSeq}`);

    // 2. Reset Categories
    console.log('\nResetting Category customIds starting from 1001...');
    const categories = await Category.find().sort({ createdAt: 1 });
    let categorySeq = 0;
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      c.customId = String(1001 + i);
      await c.save();
      console.log(`Category: "${c.name}" -> customId: ${c.customId}`);
      categorySeq = 1001 + i - 1000; // Counter sequence equivalent
    }

    // Update Counter for Category
    await Counter.findByIdAndUpdate(
      { _id: 'category_customId' },
      { seq: categorySeq },
      { new: true, upsert: true }
    );
    console.log(`Reset category_customId counter sequence to ${categorySeq}`);

    console.log('\nCustom IDs reset successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset custom IDs:', err);
    process.exit(1);
  }
};

run();
