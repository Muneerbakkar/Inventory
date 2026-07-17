import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected to:', mongoose.connection.name);

    // Use raw collection to bypass ALL Mongoose hooks and validators
    const collection = mongoose.connection.collection('users');

    await collection.deleteMany({});
    console.log('Cleared existing users');

    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('Password hashed:', hashedPassword.substring(0, 20) + '...');

    const now = new Date();
    await collection.insertOne({
      name: 'Admin',
      email: 'admin@example.com',
      phone: '1234567890',
      password: hashedPassword,
      role: 'SuperAdmin',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
    console.log('User inserted via raw driver');

    // Verify directly
    const rawUser = await collection.findOne({ email: 'admin@example.com' });
    console.log('Raw DB check - password in doc:', !!rawUser.password);
    const isValid = await bcrypt.compare('password123', rawUser.password);
    console.log('Password verifies correctly:', isValid);

    const gstCollection = mongoose.connection.collection('gstslabs');
    await gstCollection.deleteMany({});
    console.log('Cleared existing GST slabs');

    const gstSlabs = [
      { label: '5% GST', cgst: 2.5, sgst: 2.5, igst: 5, totalPercent: 5, isActive: true, createdAt: now, updatedAt: now, __v: 0 },
      { label: '12% GST', cgst: 6, sgst: 6, igst: 12, totalPercent: 12, isActive: true, createdAt: now, updatedAt: now, __v: 0 },
      { label: '18% GST', cgst: 9, sgst: 9, igst: 18, totalPercent: 18, isActive: true, createdAt: now, updatedAt: now, __v: 0 },
      { label: '28% GST', cgst: 14, sgst: 14, igst: 28, totalPercent: 28, isActive: true, createdAt: now, updatedAt: now, __v: 0 },
    ];
    await gstCollection.insertMany(gstSlabs);
    console.log('Inserted default GST slabs');

    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
