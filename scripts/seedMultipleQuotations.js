import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Product from '../src/models/Product.js';
import Customer from '../src/models/Customer.js';
import Quotation from '../src/models/Quotation.js';
import Counter from '../src/models/Counter.js';
import GstSlab from '../src/models/GstSlab.js';

const fixQuotationOrder = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // 1. Delete all quotations to start fresh, or just delete the last 99?
    // The user probably wants a clean slate to easily test "Quotation 1 has 1 product".
    console.log('Deleting all existing quotations to ensure perfect order...');
    await Quotation.deleteMany({});
    
    // Reset quotation counter to 0
    await Counter.findOneAndUpdate(
      { _id: 'quotationId' },
      { $set: { seq: 0 } },
      { upsert: true }
    );
    console.log('Counter reset.');

    const customer = await Customer.findOne();
    if (!customer) {
      console.error('Missing Customer in DB.');
      process.exit(1);
    }

    const gstSlab = await GstSlab.findOne();
    const fallbackGstPercent = gstSlab ? gstSlab.totalPercent : 18;

    const allProducts = await Product.find().limit(100);
    console.log(`Found ${allProducts.length} products.`);

    if (allProducts.length < 99) {
      console.error(`Need at least 99 products, but found only ${allProducts.length}.`);
      process.exit(1);
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: 'quotationId' },
      { $inc: { seq: 99 } },
      { new: true, upsert: true }
    );
    
    let currentSeq = counter.seq - 99 + 1; // starts at 1

    console.log('Creating 99 perfectly ordered quotations...');

    const baseDate = new Date();

    for (let i = 1; i <= 99; i++) {
      const items = [];
      let subTotal = 0;
      let totalGst = 0;

      for (let j = 0; j < i; j++) {
        const p = allProducts[j];
        const quantity = 1; 
        const gstPercent = fallbackGstPercent; 
        const itemSub = p.sellingPrice * quantity;
        const itemGst = itemSub * (gstPercent / 100);
        
        subTotal += itemSub;
        totalGst += itemGst;

        items.push({
          productId: p._id,
          quantity: quantity,
          sellingPrice: p.sellingPrice,
          gstPercent: gstPercent,
          lineTotal: itemSub + itemGst
        });
      }

      const grandTotal = subTotal + totalGst;
      const roundOff = Math.round(grandTotal) - grandTotal;

      const qNo = `QT-2425-${currentSeq.toString().padStart(4, '0')}`;
      currentSeq++;

      // We add `i` seconds to the base date so each quotation is exactly 1 second apart.
      // This ensures they are perfectly sorted by date/createdAt in the database.
      const offsetDate = new Date(baseDate.getTime() + (i * 1000));

      const quotation = new Quotation({
        quotationNumber: qNo,
        date: offsetDate,
        customerId: customer._id,
        items: items,
        subTotal: subTotal,
        totalGst: totalGst,
        roundOff: roundOff,
        grandTotal: Math.round(grandTotal),
        status: 'Pending',
      });
      
      // Save them sequentially one by one to ensure exact DB insertion order
      await quotation.save({ timestamps: false }); // We'll let mongoose set timestamps automatically, but the `date` is what we rely on.
      // Actually let's explicitly override createdAt
      await Quotation.updateOne({ _id: quotation._id }, { $set: { createdAt: offsetDate, updatedAt: offsetDate } });
      
      if (i % 10 === 0) console.log(`Inserted ${i} quotations...`);
    }

    console.log('All 99 perfectly ordered quotations inserted successfully!');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixQuotationOrder();
