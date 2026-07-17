import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import ReferralPerson from '../src/models/ReferralPerson.js';
import Invoice from '../src/models/Invoice.js';
import Product from '../src/models/Product.js';
import Counter from '../src/models/Counter.js';

const mockReferrals = [
  { name: 'Rajesh Kumar', phone: '9812345601' },
  { name: 'Vijay Singh', phone: '9812345602' },
  { name: 'Anil Sharma', phone: '9812345603' },
  { name: 'Sanjay Gupta', phone: '9812345604' },
  { name: 'Ramesh Patel', phone: '9812345605' },
  { name: 'Suresh Verma', phone: '9812345606' },
  { name: 'Mahesh Joshi', phone: '9812345607' },
  { name: 'Dinesh Mehta', phone: '9812345608' },
  { name: 'Naresh Yadav', phone: '9812345609' },
  { name: 'Harish Rao', phone: '9812345610' },
  { name: 'Sunil Nair', phone: '9812345611' },
  { name: 'Prakash Pillai', phone: '9812345612' },
  { name: 'Manoj Desai', phone: '9812345613' },
  { name: 'Deepak Shah', phone: '9812345614' },
  { name: 'Sandeep Mishra', phone: '9812345615' },
  { name: 'Vinod Pandey', phone: '9812345616' },
  { name: 'Ashok Reddy', phone: '9812345617' },
  { name: 'Karan Malhotra', phone: '9812345618' },
  { name: 'Rajan Iyer', phone: '9812345619' },
  { name: 'Vikram Saxena', phone: '9812345620' },
  { name: 'Ajay Singhal', phone: '9812345621' },
  { name: 'Amit Bose', phone: '9812345622' },
  { name: 'Rahul Sen', phone: '9812345623' },
  { name: 'Devendra Choudhary', phone: '9812345624' },
  { name: 'Satish Hegde', phone: '9812345625' },
  { name: 'Gopal Krishnan', phone: '9812345626' },
  { name: 'Arvind Tripathi', phone: '9812345627' },
  { name: 'Pradeep Shinde', phone: '9812345628' },
  { name: 'Ravi Teja', phone: '9812345629' },
  { name: 'Kartik Bhatt', phone: '9812345630' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old referral data
    console.log('Clearing old referrals...');
    const deleteRes = await ReferralPerson.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old referrals.`);

    // 2. Reset customId counters for ReferralPerson
    console.log('Resetting referral person counter...');
    await Counter.deleteMany({ _id: 'ReferralPerson_customId' });

    // Fetch dependencies
    const invoices = await Invoice.find();
    const products = await Product.find();

    console.log(`Found ${invoices.length} invoices in database.`);

    // 3. Create 30 unique referral persons using .save() to trigger custom ID generation
    console.log('Inserting 30 unique home electrical wiring referral persons...');
    const insertedReferrals = [];
    for (const refData of mockReferrals) {
      const ref = new ReferralPerson(refData);
      await ref.save();
      insertedReferrals.push(ref);
    }
    console.log(`Successfully created 30 referral persons.`);

    // 4. Map them to our 30 invoices (1-to-1 connection)
    console.log('Linking referral persons to invoices and calculating commissions...');
    const minCount = Math.min(invoices.length, insertedReferrals.length);
    for (let i = 0; i < minCount; i++) {
      const invoice = invoices[i];
      const referral = insertedReferrals[i];

      // Calculate commissions based on products inside this invoice
      let commissionDetails = 0;
      for (const item of invoice.items) {
        const prod = products.find(p => p._id.toString() === item.productId.toString());
        if (prod && prod.commissionPerUnit) {
          commissionDetails += prod.commissionPerUnit * item.quantity;
        }
      }

      // If no commission earned, give a small flat commission based on total items (e.g. ₹5 per item) as fallback
      if (commissionDetails === 0) {
        let totalQty = 0;
        for (const item of invoice.items) {
          totalQty += item.quantity;
        }
        commissionDetails = totalQty * 5; // flat ₹5 per unit
      }

      // Update invoice
      invoice.referralId = referral._id;
      invoice.commissionDetails = commissionDetails;
      await invoice.save();

      // Update referral person stats
      referral.totalCommissionEarned = commissionDetails;
      
      // Determine random payments
      const payOption = i % 3; // 0 = Settled, 1 = Partial, 2 = Pending
      if (payOption === 0) {
        referral.totalPaid = commissionDetails;
      } else if (payOption === 1) {
        referral.totalPaid = Math.round(commissionDetails * 0.4);
      } else {
        referral.totalPaid = 0;
      }

      // Set status based on payments
      const balance = referral.totalCommissionEarned - referral.totalPaid;
      if (balance <= 0) {
        referral.status = 'Settled';
      } else if (referral.totalPaid > 0) {
        referral.status = 'Partial';
      } else {
        referral.status = 'Pending';
      }

      await referral.save();
      console.log(`Linked Referral ${referral.customId} (${referral.name}) to Invoice ${invoice.invoiceNumber} -> Earned: ₹${commissionDetails}, Paid: ₹${referral.totalPaid} [Status: ${referral.status}]`);
    }

    console.log('\nSeeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
