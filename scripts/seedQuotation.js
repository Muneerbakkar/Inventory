import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Assuming models export the mongoose model
import Product from '../src/models/Product.js';
import Supplier from '../src/models/Supplier.js';
import Category from '../src/models/Category.js';
import GstSlab from '../src/models/GstSlab.js';
import Customer from '../src/models/Customer.js';
import Quotation from '../src/models/Quotation.js';
import Counter from '../src/models/Counter.js'; // Needed for generating ID if required

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Fetch required references
    const supplier = await Supplier.findOne();
    const category = await Category.findOne();
    const gstSlab = await GstSlab.findOne();
    const customer = await Customer.findOne();

    if (!supplier || !category || !gstSlab || !customer) {
      console.error('Missing required base data (Supplier, Category, GstSlab, or Customer).');
      process.exit(1);
    }

    console.log(`Using Supplier: ${supplier.name}, Category: ${category.name}, GST Slab: ${gstSlab.name}`);

    // Create 70 new products
    const productsToCreate = [];
    for (let i = 1; i <= 70; i++) {
      const pPrice = 100 + Math.floor(Math.random() * 500);
      const sPrice = pPrice + 50;
      productsToCreate.push({
        name: `Generated Product ${Date.now()}_${i}`,
        brand: `Brand XYZ`,
        category: category._id,
        supplierId: supplier._id,
        sku: `PRD-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}-${i}`,
        purchasePrice: pPrice,
        gstSlabId: gstSlab._id,
        maxSellingPrice: sPrice + 100,
        sellingPrice: sPrice,
        quantity: 100,
        unit: 'pcs'
      });
    }

    console.log('Inserting 70 products...');
    await Product.insertMany(productsToCreate);
    console.log('Products inserted.');

    // Fetch all products (to get at least 100)
    const allProducts = await Product.find().limit(100);
    console.log(`Found ${allProducts.length} products for the quotation.`);

    if (allProducts.length < 100) {
      console.warn(`Only found ${allProducts.length} products. Will create quotation with these.`);
    }

    // Generate quotation items
    const items = allProducts.map(p => {
      const quantity = Math.floor(Math.random() * 5) + 1;
      const gstPercent = gstSlab.totalPercent; // Assuming all same slab for simplicity
      const lineTotal = p.sellingPrice * quantity * (1 + gstPercent / 100);
      
      return {
        productId: p._id,
        quantity: quantity,
        sellingPrice: p.sellingPrice,
        gstPercent: gstPercent,
        lineTotal: lineTotal
      };
    });

    let subTotal = 0;
    let totalGst = 0;
    
    items.forEach(item => {
      const itemSub = item.sellingPrice * item.quantity;
      const itemGst = itemSub * (item.gstPercent / 100);
      subTotal += itemSub;
      totalGst += itemGst;
    });

    const grandTotal = subTotal + totalGst;
    const roundOff = Math.round(grandTotal) - grandTotal;

    // Generate Quotation Number
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'quotationId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const qNo = `QT-2425-${counter.seq.toString().padStart(4, '0')}`;

    console.log('Creating quotation...');
    const quotation = new Quotation({
      quotationNumber: qNo,
      date: new Date(),
      customerId: customer._id,
      items: items,
      subTotal: subTotal,
      totalGst: totalGst,
      roundOff: roundOff,
      grandTotal: Math.round(grandTotal),
      status: 'Pending'
    });

    await quotation.save();
    console.log(`Quotation ${qNo} created successfully with ${items.length} items!`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
