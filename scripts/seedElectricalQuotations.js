import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Quotation from '../src/models/Quotation.js';
import Customer from '../src/models/Customer.js';
import Product from '../src/models/Product.js';
import GstSlab from '../src/models/GstSlab.js';
import Counter from '../src/models/Counter.js';

const generateQuotationNumber = async () => {
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
  const counterId = `qt_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `QT/${fyString}/${seqStr}`;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old quotations
    console.log('Clearing old quotations data...');
    const deleteRes = await Quotation.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old quotations.`);

    // Fetch dependencies
    const customers = await Customer.find();
    const products = await Product.find().populate('gstSlabId');
    
    if (customers.length === 0 || products.length === 0) {
      console.error('Error: Seeding quotations requires existing Customers and Products in the DB.');
      process.exit(1);
    }

    const statuses = ['Draft', 'Pending', 'Converted', 'Expired', 'Rejected', 'Cancelled'];

    console.log('Generating 30 unique electrical equipment quotations...');
    let insertedCount = 0;
    for (let q = 1; q <= 30; q++) {
      const randomCustomer = customers[q % customers.length];
      
      // Determine how many items in this quotation (1 to 4)
      const numItems = Math.floor(1 + Math.random() * 4);
      const items = [];
      let subTotal = 0;
      let totalGst = 0;

      // Select random products (making sure they are unique inside the quotation)
      const selectedProducts = [];
      while (selectedProducts.length < numItems) {
        const prod = products[Math.floor(Math.random() * products.length)];
        if (!selectedProducts.find(p => p._id.toString() === prod._id.toString())) {
          selectedProducts.push(prod);
        }
      }

      for (const prod of selectedProducts) {
        const quantity = Math.floor(2 + Math.random() * 15); // 2 to 16
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
      }

      const exactTotal = subTotal + totalGst;
      const grandTotal = Math.round(exactTotal);
      const roundOff = Number((grandTotal - exactTotal).toFixed(2));

      const quotationNumber = await generateQuotationNumber();
      
      // Date within last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const validTillDate = new Date(date);
      validTillDate.setDate(validTillDate.getDate() + 15); // Valid for 15 days

      const quotation = new Quotation({
        quotationNumber,
        date,
        validTillDate,
        customerId: randomCustomer._id,
        items,
        subTotal,
        totalGst,
        roundOff,
        grandTotal,
        status: statuses[q % statuses.length] // distribute statuses evenly
      });

      await quotation.save();
      console.log(`Created quotation: ${quotationNumber} (${randomCustomer.name}) - Total: ₹${grandTotal} [Status: ${quotation.status}]`);
      insertedCount++;
    }

    console.log(`\nSeeding completed successfully. Added ${insertedCount} new quotations.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
