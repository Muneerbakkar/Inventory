import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import Supplier from './src/models/Supplier.js';
import GstSlab from './src/models/GstSlab.js';
import jwt from 'jsonwebtoken';
import app from './src/app.js';
import http from 'http';

const verify = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB Connected');
  
  // Start server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5001, resolve));
  console.log('Test Server listening on 5001');

  // Create a SalesStaff user if not exists
  let user = await User.findOne({ email: 'sales@test.com' });
  if (!user) {
    user = await User.create({
      name: 'Sales Tester',
      email: 'sales@test.com',
      password: 'password123',
      phone: '1234567890',
      role: 'SalesStaff',
      isActive: true
    });
  }

  // Create some dependencies for a product if needed
  let supplier = await Supplier.findOne();
  if (!supplier) supplier = await Supplier.create({ name: 'Test Supp', phone: '123' });
  
  let category = await Category.findOne();
  if (!category) category = await Category.create({ name: 'Test Cat' });

  let gst = await GstSlab.findOne();
  if (!gst) gst = await GstSlab.create({ label: '5%', totalPercent: 5 });

  let product = await Product.findOne();
  if (!product) {
    product = await Product.create({
      name: 'Test Prod',
      category: category._id,
      supplierId: supplier._id,
      gstSlabId: gst._id,
      purchasePrice: 100,
      maxSellingPrice: 150,
      sellingPrice: 120,
      quantity: 10,
      unit: 'pcs'
    });
  }

  // Generate Token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  console.log('--- FETCHING DASHBOARD AGGREGATES AS SALES STAFF ---');
  let res = await fetch('http://localhost:5001/api/dashboard/aggregates', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let data = await res.json();
  console.log('Dashboard Data:', JSON.stringify(data.data, null, 2));

  console.log('\n--- FETCHING PRODUCTS AS SALES STAFF ---');
  res = await fetch('http://localhost:5001/api/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  const prod = data.data.products[0];
  console.log('Sample Product keys:', Object.keys(prod));
  console.log('Has purchasePrice?', 'purchasePrice' in prod);
  console.log('Has priceAfterGst?', 'priceAfterGst' in prod);

  server.close();
  await mongoose.disconnect();
  console.log('Done.');
};

verify().catch(console.error);
