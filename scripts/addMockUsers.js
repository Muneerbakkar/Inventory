import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';

const mockUsers = [
  { name: 'Liam Smith', email: 'liam.smith@example.com', phone: '9876543210', role: 'SalesStaff', password: 'password123' },
  { name: 'Olivia Jones', email: 'olivia.jones@example.com', phone: '9876543211', role: 'SalesStaff', password: 'password123' },
  { name: 'Noah Williams', email: 'noah.williams@example.com', phone: '9876543212', role: 'WarehouseStaff', password: 'password123' },
  { name: 'Emma Brown', email: 'emma.brown@example.com', phone: '9876543213', role: 'Accountant', password: 'password123' },
  { name: 'Oliver Miller', email: 'oliver.miller@example.com', phone: '9876543214', role: 'Admin', password: 'password123' },
  { name: 'Ava Davis', email: 'ava.davis@example.com', phone: '9876543215', role: 'SalesStaff', password: 'password123' },
  { name: 'Elijah Garcia', email: 'elijah.garcia@example.com', phone: '9876543216', role: 'WarehouseStaff', password: 'password123' },
  { name: 'Charlotte Rodriguez', email: 'charlotte.rodriguez@example.com', phone: '9876543217', role: 'Accountant', password: 'password123' },
  { name: 'James Wilson', email: 'james.wilson@example.com', phone: '9876543218', role: 'SalesStaff', password: 'password123' },
  { name: 'Sophia Martinez', email: 'sophia.martinez@example.com', phone: '9876543219', role: 'WarehouseStaff', password: 'password123' },
  { name: 'Benjamin Anderson', email: 'benjamin.anderson@example.com', phone: '9876543220', role: 'SalesStaff', password: 'password123' },
  { name: 'Isabella Taylor', email: 'isabella.taylor@example.com', phone: '9876543221', role: 'Accountant', password: 'password123' },
  { name: 'Lucas Thomas', email: 'lucas.thomas@example.com', phone: '9876543222', role: 'SalesStaff', password: 'password123' },
  { name: 'Mia Moore', email: 'mia.moore@example.com', phone: '9876543223', role: 'WarehouseStaff', password: 'password123' },
  { name: 'Henry Jackson', email: 'henry.jackson@example.com', phone: '9876543224', role: 'Accountant', password: 'password123' },
  { name: 'Evelyn Martin', email: 'evelyn.martin@example.com', phone: '9876543225', role: 'SalesStaff', password: 'password123' },
  { name: 'Alexander Lee', email: 'alexander.lee@example.com', phone: '9876543226', role: 'Admin', password: 'password123' },
  { name: 'Harper Perez', email: 'harper.perez@example.com', phone: '9876543227', role: 'WarehouseStaff', password: 'password123' },
  { name: 'Michael Thompson', email: 'michael.thompson@example.com', phone: '9876543228', role: 'SalesStaff', password: 'password123' },
  { name: 'Abigail White', email: 'abigail.white@example.com', phone: '9876543229', role: 'Accountant', password: 'password123' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    let insertedCount = 0;
    for (const u of mockUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`User ${u.email} already exists. Skipping.`);
        continue;
      }
      
      // Save triggers pre-save hook for password hashing and customIdPlugin
      const user = new User(u);
      await user.save();
      console.log(`Created user: ${u.name} (${u.email})`);
      insertedCount++;
    }

    console.log(`\nOperation finished. Successfully added ${insertedCount} new users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting mock users:', err);
    process.exit(1);
  }
};

run();
