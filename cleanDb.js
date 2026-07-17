import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Quotation from './src/models/Quotation.js';
import Invoice from './src/models/Invoice.js';
import PurchaseBill from './src/models/PurchaseBill.js';
import PurchaseReturn from './src/models/PurchaseReturn.js';
import Notification from './src/models/Notification.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanDatabase = async () => {
  try {
    await connectDB();

    console.log("Removing data from Quotation, Invoice, PurchaseBill, PurchaseReturn, and Notification collections...");

    const qtRes = await Quotation.deleteMany({});
    console.log(`Deleted ${qtRes.deletedCount} quotations.`);

    const invRes = await Invoice.deleteMany({});
    console.log(`Deleted ${invRes.deletedCount} invoices (sales).`);

    const pbRes = await PurchaseBill.deleteMany({});
    console.log(`Deleted ${pbRes.deletedCount} purchase bills.`);

    const prRes = await PurchaseReturn.deleteMany({});
    console.log(`Deleted ${prRes.deletedCount} purchase returns.`);

    const notifRes = await Notification.deleteMany({});
    console.log(`Deleted ${notifRes.deletedCount} notifications.`);

    console.log("Successfully removed all requested old data.");
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanDatabase();
