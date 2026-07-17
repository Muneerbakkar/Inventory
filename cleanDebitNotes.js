import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import DebitNote from './src/models/DebitNote.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanDebitNotes = async () => {
  try {
    await connectDB();

    console.log("Removing data from DebitNote collection...");

    const dnRes = await DebitNote.deleteMany({});
    console.log(`Deleted ${dnRes.deletedCount} debit notes.`);

    console.log("Successfully removed all old debit notes.");
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanDebitNotes();
