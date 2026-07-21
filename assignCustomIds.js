import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './src/models/Product.js';
import Counter from './src/models/Counter.js';

const assignIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find products without customId
    const products = await Product.find({ customId: { $exists: false } }).lean();
    
    if (products.length === 0) {
      console.log('No products need customId.');
      process.exit(0);
    }
    
    console.log(`Found ${products.length} products needing customId.`);

    const counterId = 'product_customId';
    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: products.length } },
      { new: true, upsert: true }
    );
    
    // The new value of counter.seq is after adding products.length
    // So the sequence for the batch should start from (counter.seq - products.length + 1)
    let currentSeq = counter.seq - products.length + 1;
    
    const bulkOps = products.map((prod) => {
      const newCustomId = String(1000 + currentSeq);
      currentSeq++;
      return {
        updateOne: {
          filter: { _id: prod._id },
          update: { $set: { customId: newCustomId } }
        }
      };
    });

    // Execute bulk write
    const res = await Product.bulkWrite(bulkOps);
    console.log(`Successfully assigned custom IDs to ${res.modifiedCount} products.`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

assignIds();
