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

    // 1. Fix Suppliers customIds
    const suppliers = await Supplier.find();
    let suppliersFixed = 0;
    for (const s of suppliers) {
      if (!s.customId) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'supplier_customId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        s.customId = String(1000 + counter.seq);
        await s.save();
        console.log(`Assigned customId ${s.customId} to supplier ${s.name}`);
        suppliersFixed++;
      }
    }

    // 2. Fix Categories customIds
    const categories = await Category.find();
    let categoriesFixed = 0;
    for (const c of categories) {
      if (!c.customId) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'category_customId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        c.customId = String(1000 + counter.seq);
        await c.save();
        console.log(`Assigned customId ${c.customId} to category ${c.name}`);
        categoriesFixed++;
      }
    }

    console.log(`\nFixed ${suppliersFixed} Suppliers and ${categoriesFixed} Categories.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to fix custom IDs:', err);
    process.exit(1);
  }
};

run();
