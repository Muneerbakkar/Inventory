import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Invoice from '../src/models/Invoice.js';
import Customer from '../src/models/Customer.js';
import Product from '../src/models/Product.js';
import GstSlab from '../src/models/GstSlab.js';
import Quotation from '../src/models/Quotation.js';
import Counter from '../src/models/Counter.js';
import ReferralPerson from '../src/models/ReferralPerson.js';

const generateInvoiceNumber = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let startYear, endYear;
  if (month >= 3) { // April or later
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyString = `${startYear}-${endYear.toString().slice(-2)}`;
  const counterId = `invoice_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `INV/${fyString}/${seqStr}`;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Clear old invoice data and reset invoice counters
    console.log('Clearing old sales/invoices...');
    const deleteRes = await Invoice.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old invoices.`);

    console.log('Resetting invoice counter...');
    await Counter.deleteMany({ _id: { $regex: '^invoice_' } });

    // Fetch existing customers and products
    const customers = await Customer.find();
    const products = await Product.find().populate('gstSlabId');
    const quotations = await Quotation.find();

    if (customers.length === 0 || products.length === 0) {
      console.error('Error: Seeding sales requires existing Customers and Products in the DB.');
      process.exit(1);
    }

    // 2. Setup Referral Persons if none exist or reset commission stats on existing
    let referrals = await ReferralPerson.find();
    if (referrals.length === 0) {
      console.log('Seeding mock referral persons...');
      const mockReferrals = [
        { name: 'Amit Sharma', phone: '9812345601', totalCommissionEarned: 0, totalPaid: 0, status: 'Pending' },
        { name: 'Vikram Malhotra', phone: '9812345602', totalCommissionEarned: 0, totalPaid: 0, status: 'Pending' },
        { name: 'Rajesh Patel', phone: '9812345603', totalCommissionEarned: 0, totalPaid: 0, status: 'Pending' },
      ];
      referrals = await ReferralPerson.insertMany(mockReferrals);
      console.log(`Inserted ${referrals.length} referral persons.`);
    } else {
      console.log('Resetting commission stats on existing referral persons...');
      for (const ref of referrals) {
        ref.totalCommissionEarned = 0;
        await ref.save();
      }
    }

    const paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

    // Reset all quotations statuses to Pending / Draft so we can convert them cleanly
    console.log('Resetting quotation statuses...');
    await Quotation.updateMany({}, { status: 'Pending' });

    console.log('Generating 30 unique home electrical sales...');

    let insertedCount = 0;
    
    // We will convert first 10 quotations to Invoices
    const numQuotationsToConvert = Math.min(10, quotations.length);
    for (let i = 0; i < numQuotationsToConvert; i++) {
      const q = quotations[i];
      const invoiceNumber = await generateInvoiceNumber();
      
      // Determine random payment details
      const paymentMode = paymentModes[Math.floor(Math.random() * paymentModes.length)];
      const grandTotal = q.grandTotal;
      
      const payOption = i % 3; // 0 = Paid, 1 = Partial, 2 = Pending
      let amountPaid = 0;
      if (payOption === 0) {
        amountPaid = grandTotal;
      } else if (payOption === 1) {
        amountPaid = Math.round(grandTotal * 0.4);
      }

      // Link to random referral
      const ref = referrals[i % referrals.length];
      
      // Calculate commissions based on products in quotation
      let commissionDetails = 0;
      for (const item of q.items) {
        const prod = products.find(p => p._id.toString() === item.productId.toString());
        if (prod && prod.commissionPerUnit) {
          commissionDetails += prod.commissionPerUnit * item.quantity;
        }
      }

      const invoice = new Invoice({
        invoiceNumber,
        date: q.date,
        customerId: q.customerId,
        items: q.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          gstPercent: item.gstPercent,
          lineTotal: item.lineTotal
        })),
        referralId: ref._id,
        commissionDetails,
        subTotal: q.subTotal,
        totalGst: q.totalGst,
        roundOff: q.roundOff,
        grandTotal,
        paymentMode,
        amountPaid
      });

      await invoice.save();

      // Mark quotation as Converted
      q.status = 'Converted';
      await q.save();

      // Increment referral commission
      if (commissionDetails > 0) {
        ref.totalCommissionEarned += commissionDetails;
        await ref.save();
      }

      console.log(`[Converted from QT] Invoice ${invoiceNumber}: ₹${grandTotal} (${paymentMode}) - Status: ${invoice.status}`);
      insertedCount++;
    }

    // For the remaining 20 sales, we generate them from scratch
    for (let s = insertedCount + 1; s <= 30; s++) {
      const cust = customers[s % customers.length];
      
      // Select 1 to 4 random products
      const numItems = Math.floor(1 + Math.random() * 4);
      const items = [];
      let subTotal = 0;
      let totalGst = 0;
      let commissionDetails = 0;

      const selectedProducts = [];
      while (selectedProducts.length < numItems) {
        const prod = products[Math.floor(Math.random() * products.length)];
        if (!selectedProducts.find(p => p._id.toString() === prod._id.toString())) {
          selectedProducts.push(prod);
        }
      }

      const ref = s % 4 !== 0 ? referrals[s % referrals.length] : null;

      for (const prod of selectedProducts) {
        const quantity = Math.floor(5 + Math.random() * 20); // 5 to 24
        const sellingPrice = prod.sellingPrice;
        const gstPercent = prod.gstSlabId?.totalPercent || 18;
        const lineTotal = sellingPrice * quantity;
        const gstAmount = lineTotal * (gstPercent / 100);

        items.push({
          productId: prod._id,
          quantity,
          sellingPrice,
          gstPercent,
          lineTotal
        });

        subTotal += lineTotal;
        totalGst += gstAmount;
        if (ref && prod.commissionPerUnit) {
          commissionDetails += prod.commissionPerUnit * quantity;
        }
      }

      const exactTotal = subTotal + totalGst;
      const grandTotal = Math.round(exactTotal);
      const roundOff = Number((grandTotal - exactTotal).toFixed(2));

      // Date within last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const paymentMode = paymentModes[Math.floor(Math.random() * paymentModes.length)];
      const payOption = s % 3; // 0 = Paid, 1 = Partial, 2 = Pending
      let amountPaid = 0;
      if (payOption === 0) {
        amountPaid = grandTotal;
      } else if (payOption === 1) {
        amountPaid = Math.round(grandTotal * 0.5);
      }

      const invoiceNumber = await generateInvoiceNumber();

      const invoice = new Invoice({
        invoiceNumber,
        date,
        customerId: cust._id,
        items,
        referralId: ref ? ref._id : null,
        commissionDetails,
        subTotal,
        totalGst,
        roundOff,
        grandTotal,
        paymentMode,
        amountPaid
      });

      await invoice.save();

      if (ref && commissionDetails > 0) {
        ref.totalCommissionEarned += commissionDetails;
        await ref.save();
      }

      console.log(`[Fresh Sale] Invoice ${invoiceNumber}: ₹${grandTotal} (${paymentMode}) - Status: ${invoice.status}`);
      insertedCount++;
    }

    // Now recalculate status/balance for referral persons based on total commission vs total paid
    for (const ref of referrals) {
      const balance = ref.totalCommissionEarned - ref.totalPaid;
      if (balance <= 0) {
        ref.status = 'Settled';
      } else if (ref.totalPaid > 0) {
        ref.status = 'Partial';
      } else {
        ref.status = 'Pending';
      }
      await ref.save();
    }

    console.log(`\nSeeding completed successfully. Added ${insertedCount} new invoices.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
