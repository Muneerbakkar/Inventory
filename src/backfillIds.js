import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Counter from './models/Counter.js';
import User from './models/User.js';
import Supplier from './models/Supplier.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import ReferralPerson from './models/ReferralPerson.js';

dotenv.config();

const backfillModel = async (Model, modelName) => {
  console.log(`Backfilling readable custom IDs for model: ${modelName}...`);
  const docs = await Model.find({ customId: { $exists: false } }).sort('createdAt');
  
  if (docs.length === 0) {
    console.log(`No documents without customId in ${modelName}.`);
    return;
  }

  console.log(`Found ${docs.length} documents in ${modelName} without customId.`);
  
  const counterId = `${modelName.toLowerCase()}_customId`;
  let counter = await Counter.findById(counterId);
  if (!counter) {
    counter = await Counter.create({ _id: counterId, seq: 0 });
  }

  for (const doc of docs) {
    counter.seq += 1;
    doc.customId = String(1000 + counter.seq);
    await doc.save();
    console.log(`Assigned customId ${doc.customId} to ${modelName} ID: ${doc._id}`);
  }

  await counter.save();
  console.log(`Finished backfilling for ${modelName}. Final sequence: ${counter.seq}`);
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-billing');
  console.log('Connected to DB for ID backfill migration');

  await backfillModel(User, 'User');
  await backfillModel(Supplier, 'Supplier');
  await backfillModel(Category, 'Category');
  await backfillModel(Product, 'Product');
  await backfillModel(Customer, 'Customer');
  await backfillModel(ReferralPerson, 'ReferralPerson');

  console.log('Migration completed successfully!');
  mongoose.connection.close();
}

run().catch(console.error);
