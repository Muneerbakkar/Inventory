import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Invoice from './src/models/Invoice.js';
import Quotation from './src/models/Quotation.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanSales = async () => {
  try {
    await connectDB();

    console.log("Removing data from Invoice and Quotation collections...");

    const invRes = await Invoice.deleteMany({});
    console.log(`Deleted ${invRes.deletedCount} invoices (sales).`);
    
    const qtRes = await Quotation.deleteMany({});
    console.log(`Deleted ${qtRes.deletedCount} quotations.`);

    console.log("Successfully removed all sales data.");
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanSales();
