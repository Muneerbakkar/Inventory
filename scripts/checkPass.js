import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkPass = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
    console.log("User password hash in DB:", user.password);
    
    const isValid = await user.correctPassword('password123', user.password);
    console.log("Is password valid?", isValid);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
};

checkPass();
