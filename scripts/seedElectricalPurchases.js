import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import PurchaseBill from '../src/models/PurchaseBill.js';
import PurchaseReturn from '../src/models/PurchaseReturn.js';
import DebitNote from '../src/models/DebitNote.js';
import Supplier from '../src/models/Supplier.js';
import Product from '../src/models/Product.js';
import GstSlab from '../src/models/GstSlab.js';
import Counter from '../src/models/Counter.js';

const generatePurchaseBillNumber = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let startYear, endYear;
  if (month >= 3) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyString = `${startYear}-${endYear.toString().slice(-2)}`;
  const counterId = `pb_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `PB/${fyString}/${seqStr}`;
};

const generateReturnNumber = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let startYear, endYear;
  if (month >= 3) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyString = `${startYear}-${endYear.toString().slice(-2)}`;
  const counterId = `pr_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `PR/${fyString}/${seqStr}`;
};

const generateDebitNoteNumber = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let startYear, endYear;
  if (month >= 3) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyString = `${startYear}-${endYear.toString().slice(-2)}`;
  const counterId = `dn_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `DN/${fyString}/${seqStr}`;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Clear old data
    console.log('Clearing old purchases, returns, and debit notes...');
    await PurchaseBill.deleteMany({});
    await PurchaseReturn.deleteMany({});
    await DebitNote.deleteMany({});
    console.log('Cleared successfully.');

    // 2. Reset counters
    console.log('Resetting counters...');
    await Counter.deleteMany({ _id: { $regex: '^(pb_|pr_|dn_)' } });

    // Fetch dependencies
    const suppliers = await Supplier.find();
    const products = await Product.find().populate('gstSlabId');

    if (suppliers.length === 0 || products.length === 0) {
      console.error('Error: Seeding purchases requires existing Suppliers and Products in the DB.');
      process.exit(1);
    }

    const paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'];
    const purchaseBills = [];

    console.log('Generating 30 unique home electrical purchase bills...');
    for (let b = 1; b <= 30; b++) {
      const supplier = suppliers[b % suppliers.length];
      
      // Select products supplied by this supplier
      let supplierProducts = products.filter(p => p.supplierId?.toString() === supplier._id.toString());
      if (supplierProducts.length === 0) {
        // fallback to any products if supplier doesn't have products directly associated
        supplierProducts = products;
      }

      // Determine how many items (1 to 4)
      const numItems = Math.min(supplierProducts.length, Math.floor(1 + Math.random() * 4));
      
      // Choose unique products
      const selectedProducts = [];
      while (selectedProducts.length < numItems) {
        const prod = supplierProducts[Math.floor(Math.random() * supplierProducts.length)];
        if (!selectedProducts.find(p => p._id.toString() === prod._id.toString())) {
          selectedProducts.push(prod);
        }
      }

      const items = [];
      let subTotal = 0;
      let totalGst = 0;

      for (const prod of selectedProducts) {
        const quantity = Math.floor(10 + Math.random() * 50); // 10 to 59
        // Purchase price is usually slightly lower than selling price
        const purchasePrice = prod.purchasePrice || Math.round(prod.sellingPrice * 0.7);
        const gstPercent = prod.gstSlabId?.totalPercent || 18;
        const lineTotal = purchasePrice * quantity;
        const gstAmount = lineTotal * (gstPercent / 100);

        items.push({
          productId: prod._id,
          quantity,
          purchasePrice,
          gstPercent,
          lineTotal
        });

        subTotal += lineTotal;
        totalGst += gstAmount;
      }

      const exactTotal = subTotal + totalGst;
      const grandTotal = Math.round(exactTotal);
      const roundOff = Number((grandTotal - exactTotal).toFixed(2));

      const billNumber = await generatePurchaseBillNumber();
      const supplierRefNumber = `REF-${100000 + b}`;

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const paymentMode = paymentModes[b % paymentModes.length];
      const payOption = b % 3; // Paid, Partial, Pending
      let amountPaid = 0;
      if (payOption === 0) {
        amountPaid = grandTotal;
      } else if (payOption === 1) {
        amountPaid = Math.round(grandTotal * 0.4);
      }

      const purchaseBill = new PurchaseBill({
        billNumber,
        supplierId: supplier._id,
        supplierRefNumber,
        date,
        items,
        subTotal,
        totalGst,
        roundOff,
        grandTotal,
        paymentMode,
        amountPaid
      });

      await purchaseBill.save();
      purchaseBills.push(purchaseBill);
      console.log(`Created Bill: ${billNumber} (${supplier.name}) - Total: ₹${grandTotal} [Status: ${purchaseBill.status}]`);
    }

    // 3. Generate 5 Purchase Returns & corresponding Debit Notes
    console.log('\nGenerating 5 connected purchase returns and debit notes...');
    for (let r = 0; r < 5; r++) {
      const originalBill = purchaseBills[r];
      
      // Select 1 random item from original bill to return
      const itemToReturn = originalBill.items[0];
      const returnQty = Math.max(1, Math.floor(itemToReturn.quantity * 0.2)); // return 20%
      const prod = products.find(p => p._id.toString() === itemToReturn.productId.toString());
      
      const purchasePrice = itemToReturn.purchasePrice;
      const gstPercent = itemToReturn.gstPercent;
      const subTotal = purchasePrice * returnQty;
      const totalGst = subTotal * (gstPercent / 100);
      const exactTotal = subTotal + totalGst;
      const grandTotal = Math.round(exactTotal);
      const roundOff = Number((grandTotal - exactTotal).toFixed(2));

      const returnNumber = await generateReturnNumber();
      const returnDate = new Date(originalBill.date);
      returnDate.setDate(returnDate.getDate() + 2); // 2 days after bill

      const purchaseReturn = new PurchaseReturn({
        returnNumber,
        originalBillId: originalBill._id,
        supplierId: originalBill.supplierId,
        date: returnDate,
        items: [{
          productId: itemToReturn.productId,
          quantity: returnQty,
          purchasePrice,
          gstPercent,
          lineTotal: subTotal,
          reason: 'Defective packaging/fittings'
        }],
        subTotal,
        totalGst,
        roundOff,
        grandTotal
      });

      await purchaseReturn.save();
      console.log(`Created Return: ${returnNumber} connected to Bill ${originalBill.billNumber}`);

      // Create a Debit Note for this return
      const noteNumber = await generateDebitNoteNumber();
      const debitNote = new DebitNote({
        noteNumber,
        supplierId: originalBill.supplierId,
        relatedReturnId: purchaseReturn._id,
        amount: grandTotal,
        reason: `Debit note issued for return ${returnNumber} of bill ${originalBill.billNumber}`,
        date: returnDate,
        status: r % 2 === 0 ? 'Settled' : 'Finalized'
      });

      await debitNote.save();
      console.log(`Created Debit Note: ${noteNumber} for return ${returnNumber} (Amount: ₹${grandTotal})`);
    }

    console.log('\nSeeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
