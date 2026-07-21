import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import ReferralPerson from './src/models/ReferralPerson.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanReferrals = async () => {
  try {
    await connectDB();

    console.log("Removing data from ReferralPerson collection...");

    const res = await ReferralPerson.deleteMany({});
    console.log(`Deleted ${res.deletedCount} referral persons.`);

    console.log("Successfully removed all referral data.");
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanReferrals();
