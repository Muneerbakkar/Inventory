import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import Supplier from './src/models/Supplier.js';
import GstSlab from './src/models/GstSlab.js';
import Invoice from './src/models/Invoice.js';
import { createInvoice } from './src/controllers/salesController.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for verification');

  try {
    // 1. Create dependencies
    const category = await Category.findOne();
    const supplier = await Supplier.findOne();
    const gstSlab = await GstSlab.findOne();
    
    if (!category || !supplier || !gstSlab) {
      console.log('Ensure you have at least one Category, Supplier, and GstSlab in the database for the test.');
      return;
    }

    // 2. Create products
    const p1 = await Product.create({
      name: 'Valid Product',
      category: category._id,
      supplierId: supplier._id,
      gstSlabId: gstSlab._id,
      purchasePrice: 100,
      maxSellingPrice: 150,
      sellingPrice: 120,
      quantity: 10
    });

    const p2 = await Product.create({
      name: 'Invalid Product (Low Stock)',
      category: category._id,
      supplierId: supplier._id,
      gstSlabId: gstSlab._id,
      purchasePrice: 200,
      maxSellingPrice: 250,
      sellingPrice: 220,
      quantity: 2
    });

    console.log(`Initial stock -> P1: ${p1.quantity}, P2: ${p2.quantity}`);

    // 3. Mock Req/Res for controller
    const req = {
      body: {
        items: [
          { productId: p1._id.toString(), quantity: 5, sellingPrice: 120, gstPercent: 18, lineTotal: 600 },
          { productId: p2._id.toString(), quantity: 5, sellingPrice: 220, gstPercent: 18, lineTotal: 1100 }
        ],
        paymentMode: 'Cash',
        amountPaid: 0
      }
    };

    const res = {
      status: function (s) { this.statusCode = s; return this; },
      json: function (d) { this.data = d; }
    };

    let controllerError = null;
    const next = (err) => {
      if (err) controllerError = err;
    };

    // 4. Run Controller
    console.log('Running createInvoice with items exceeding stock for P2...');
    try {
      await createInvoice(req, res, next);
      if (controllerError) {
        throw controllerError;
      }
      console.log('ERROR: Invoice created successfully when it should have failed!');
    } catch (err) {
      console.log(`Caught expected error: ${err.message}`);
    }

    // 5. Verify Database State directly
    const p1After = await Product.findById(p1._id);
    const p2After = await Product.findById(p2._id);
    
    console.log(`Final stock -> P1: ${p1After.quantity}, P2: ${p2After.quantity}`);
    
    if (p1After.quantity === 10 && p2After.quantity === 2) {
      console.log('✅ VERIFICATION PASSED: Stock was safely rolled back / untouched.');
    } else {
      console.log('❌ VERIFICATION FAILED: Stock was modified incorrectly.');
    }

    const invoices = await Invoice.find({ 'items.productId': p1._id });
    if (invoices.length === 0) {
      console.log('✅ VERIFICATION PASSED: No partial invoice was written.');
    } else {
      console.log('❌ VERIFICATION FAILED: Partial invoice was written.');
    }

    // Cleanup
    await Product.deleteMany({ _id: { $in: [p1._id, p2._id] } });

  } catch (error) {
    console.error('Verification script error:', error);
  } finally {
    mongoose.disconnect();
  }
}

run();
