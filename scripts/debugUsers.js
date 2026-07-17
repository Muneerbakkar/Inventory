import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected');

const users = await User.find({ email: 'admin@example.com' }).select('+password');
console.log('Total users with this email:', users.length);
users.forEach(u => {
  console.log('---');
  console.log('ID:', u._id);
  console.log('Has password field:', !!u.password);
  console.log('Password value:', u.password);
});

// Also check ALL users
const allUsers = await User.find({}).select('+password');
console.log('\nAll users in DB:', allUsers.length);
allUsers.forEach(u => console.log('Email:', u.email, '| Has password:', !!u.password));

process.exit(0);
