import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Supplier from '../src/models/Supplier.js';

const mockSuppliers = [
  { name: 'Apex Industries', phone: '9876543001', address: { street: 'Main St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }, gstNumber: '27ABCDE1234F1Z1', gstType: 'Regular', notes: 'Premium raw materials supplier' },
  { name: 'Zenith Distributors', phone: '9876543002', address: { street: 'Subway Ave', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, gstNumber: '27FGHIJ5678K1Z2', gstType: 'Regular', notes: 'Primary electronics packaging' },
  { name: 'Prime Tech Solutions', phone: '9876543003', address: { street: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' }, gstNumber: '29LMNOP9012Q1Z3', gstType: 'Regular' },
  { name: 'Matrix Enterprises', phone: '9876543004', address: { street: 'Hosur Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560002' }, gstNumber: '29RSTUV3456W1Z4', gstType: 'Composition' },
  { name: 'Alpha Logistics', phone: '9876543005', address: { street: 'GIDC Industrial Area', city: 'Surat', state: 'Gujarat', pincode: '395001' }, gstNumber: '24WXYZA7890A1Z5', gstType: 'Regular' },
  { name: 'Omega Trade Corp', phone: '9876543006', address: { street: 'Sarkhej Gandhinagar Hwy', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }, gstNumber: '24BCDEF2345G1Z6', gstType: 'Regular' },
  { name: 'United Wholesalers', phone: '9876543007', address: { street: 'Ring Road', city: 'Nagpur', state: 'Maharashtra', pincode: '440001' }, gstNumber: '27HIJKL6789M1Z7', gstType: 'Regular' },
  { name: 'Pioneer Polymers', phone: '9876543008', address: { street: 'Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' }, gstNumber: '33NOPQR1234S1Z8', gstType: 'Regular' },
  { name: 'Global Importers', phone: '9876543009', address: { street: 'Mount Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' }, gstNumber: '33TUVWX5678Y1Z9', gstType: 'Composition' },
  { name: 'Dynamic Exports', phone: '9876543010', address: { street: 'Okhla Industrial Area', city: 'New Delhi', state: 'Delhi', pincode: '110020' }, gstNumber: '07ZABCD9012E1ZA', gstType: 'Regular' },
  { name: 'Elite Packaging', phone: '9876543011', address: { street: 'Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' }, gstNumber: '07FGHIJ3456K1ZB', gstType: 'Regular' },
  { name: 'Stellar Steel', phone: '9876543012', address: { street: 'Sector 5', city: 'Kolkata', state: 'West Bengal', pincode: '700091' }, gstNumber: '19LMNOP7890Q1ZC', gstType: 'Regular' },
  { name: 'Horizon Chemicals', phone: '9876543013', address: { street: 'Park Street', city: 'Kolkata', state: 'West Bengal', pincode: '700016' }, gstNumber: '19RSTUV1234W1ZD', gstType: 'Composition' },
  { name: 'Vanguard Textiles', phone: '9876543014', address: { street: 'Somajiguda', city: 'Hyderabad', state: 'Telangana', pincode: '500082' }, gstNumber: '36WXYZA5678A1ZE', gstType: 'Regular' },
  { name: 'Infinity Hardware', phone: '9876543015', address: { street: 'Hitech City', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }, gstNumber: '36BCDEF9012G1ZF', gstType: 'Regular' },
  { name: 'Phoenix Electronics', phone: '9876543016', address: { street: 'Kochi InfoPark', city: 'Kochi', state: 'Kerala', pincode: '682030' }, gstNumber: '32HIJKL3456M1ZG', gstType: 'Regular' },
  { name: 'Summit Paper Mills', phone: '9876543017', address: { street: 'MG Road', city: 'Ernakulam', state: 'Kerala', pincode: '682011' }, gstNumber: '32NOPQR7890S1ZH', gstType: 'Regular' },
  { name: 'Crescent Glass', phone: '9876543018', address: { street: 'Industrial Estate', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' }, gstNumber: '23TUVWX1234Y1ZI', gstType: 'Composition' },
  { name: 'Orion Foods', phone: '9876543019', address: { street: 'Palasia', city: 'Indore', state: 'Madhya Pradesh', pincode: '452018' }, gstNumber: '23ZABCD5678E1ZJ', gstType: 'Regular' },
  { name: 'Aura Cosmetics', phone: '9876543020', address: { street: 'Tonk Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302015' }, gstNumber: '08FGHIJ9012K1ZK', gstType: 'Regular' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    let insertedCount = 0;
    for (const s of mockSuppliers) {
      const exists = await Supplier.findOne({ name: s.name });
      if (exists) {
        console.log(`Supplier ${s.name} already exists. Skipping.`);
        continue;
      }
      
      const supplier = new Supplier(s);
      await supplier.save();
      console.log(`Created supplier: ${s.name} (${s.gstNumber})`);
      insertedCount++;
    }

    console.log(`\nOperation finished. Successfully added ${insertedCount} new suppliers.`);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting mock suppliers:', err);
    process.exit(1);
  }
};

run();
