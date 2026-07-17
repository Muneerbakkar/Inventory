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
import Product from '../src/models/Product.js';
import Counter from '../src/models/Counter.js';

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

    // 1. Clear old return and debit note data
    console.log('Clearing old returns and debit notes...');
    const deletePR = await PurchaseReturn.deleteMany({});
    const deleteDN = await DebitNote.deleteMany({});
    console.log(`Deleted ${deletePR.deletedCount} returns and ${deleteDN.deletedCount} debit notes.`);

    // 2. Reset counters
    console.log('Resetting return and debit note counters...');
    await Counter.deleteMany({ _id: { $regex: '^(pr_|dn_)' } });

    // Fetch existing bills
    const bills = await PurchaseBill.find();
    if (bills.length === 0) {
      console.error('Error: Seeding purchase returns requires existing Purchase Bills in the DB.');
      process.exit(1);
    }

    console.log(`Found ${bills.length} purchase bills in the database.`);

    console.log('Generating 30 unique purchase returns and corresponding debit notes...');
    let insertedCount = 0;

    // Map returns 1-to-1 to bills (up to 30)
    const numToCreate = Math.min(30, bills.length);
    for (let r = 0; r < numToCreate; r++) {
      const bill = bills[r];
      
      // Select 1st item in the bill to return
      const itemToReturn = bill.items[0];
      const returnQty = Math.max(1, Math.floor(itemToReturn.quantity * 0.2)); // return 20%
      
      const purchasePrice = itemToReturn.purchasePrice;
      const gstPercent = itemToReturn.gstPercent;
      const subTotal = purchasePrice * returnQty;
      const totalGst = subTotal * (gstPercent / 100);
      const exactTotal = subTotal + totalGst;
      const grandTotal = Math.round(exactTotal);
      const roundOff = Number((grandTotal - exactTotal).toFixed(2));

      const returnNumber = await generateReturnNumber();
      const returnDate = new Date(bill.date);
      returnDate.setDate(returnDate.getDate() + 2); // 2 days after original bill

      const purchaseReturn = new PurchaseReturn({
        returnNumber,
        originalBillId: bill._id,
        supplierId: bill.supplierId,
        date: returnDate,
        items: [{
          productId: itemToReturn.productId,
          quantity: returnQty,
          purchasePrice,
          gstPercent,
          lineTotal: subTotal,
          reason: 'Defective/Incorrect specifications'
        }],
        subTotal,
        totalGst,
        roundOff,
        grandTotal
      });

      await purchaseReturn.save();
      console.log(`Created Return ${returnNumber} connected to Bill ${bill.billNumber}`);

      // Create a corresponding Debit Note
      const noteNumber = await generateDebitNoteNumber();
      const statuses = ['Draft', 'Finalized', 'Settled'];
      const debitNote = new DebitNote({
        noteNumber,
        supplierId: bill.supplierId,
        relatedReturnId: purchaseReturn._id,
        amount: grandTotal,
        reason: `Debit note issued for return ${returnNumber} of bill ${bill.billNumber}`,
        date: returnDate,
        status: statuses[r % statuses.length]
      });

      await debitNote.save();
      console.log(`Created Debit Note ${noteNumber} for Return ${returnNumber} (Amount: ₹${grandTotal}, Status: ${debitNote.status})`);
      insertedCount++;
    }

    console.log(`\nSeeding completed successfully. Added ${insertedCount} new purchase returns and debit notes.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
