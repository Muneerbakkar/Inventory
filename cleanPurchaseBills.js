import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import PurchaseBill from './src/models/PurchaseBill.js';
import PurchaseReturn from './src/models/PurchaseReturn.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanPurchaseBills = async () => {
  try {
    await connectDB();

    console.log("Removing data from PurchaseBill and PurchaseReturn collections...");

    const pbRes = await PurchaseBill.deleteMany({});
    console.log(`Deleted ${pbRes.deletedCount} purchase bills.`);

    const prRes = await PurchaseReturn.deleteMany({});
    console.log(`Deleted ${prRes.deletedCount} purchase returns.`);

    console.log("Successfully removed all purchase bill data.");
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanPurchaseBills();
