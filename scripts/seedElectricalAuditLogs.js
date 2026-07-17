import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import AuditLog from '../src/models/AuditLog.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Supplier from '../src/models/Supplier.js';
import Customer from '../src/models/Customer.js';
import Invoice from '../src/models/Invoice.js';
import PurchaseBill from '../src/models/PurchaseBill.js';
import Quotation from '../src/models/Quotation.js';
import Category from '../src/models/Category.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Clear old audit logs
    console.log('Clearing old audit logs...');
    const deleteRes = await AuditLog.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old audit logs.`);

    // Fetch existing models for mapping
    const users = await User.find();
    const products = await Product.find();
    const suppliers = await Supplier.find();
    const customers = await Customer.find();
    const invoices = await Invoice.find();
    const purchaseBills = await PurchaseBill.find();
    const quotations = await Quotation.find();
    const categories = await Category.find();

    if (users.length === 0) {
      console.error('Error: Seeding audit logs requires at least one User in the DB.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users, ${products.length} products, ${suppliers.length} suppliers, ${invoices.length} invoices, ${quotations.length} quotations.`);

    const actions = ['CREATE', 'UPDATE', 'DELETE'];
    const modules = ['Product', 'Supplier', 'Customer', 'Invoice', 'PurchaseBill', 'Quotation', 'Category'];

    console.log('Generating 30 unique audit log entries with spread dates and users...');
    for (let i = 1; i <= 30; i++) {
      const user = users[i % users.length];
      const action = actions[i % actions.length];
      const module = modules[i % modules.length];

      let documentId = new mongoose.Types.ObjectId();
      let readableId = `DOC-${1000 + i}`;
      let changes = {};

      // Map to real documents based on selected module
      if (module === 'Product' && products.length > 0) {
        const prod = products[i % products.length];
        documentId = prod._id;
        readableId = prod.name;
        changes = action === 'CREATE' 
          ? { sku: prod.sku, name: prod.name, purchasePrice: prod.purchasePrice }
          : action === 'UPDATE'
          ? { quantity: { before: prod.quantity + 20, after: prod.quantity } }
          : { deletedName: prod.name, customId: prod.sku };
      } else if (module === 'Supplier' && suppliers.length > 0) {
        const sup = suppliers[i % suppliers.length];
        documentId = sup._id;
        readableId = sup.name;
        changes = action === 'CREATE'
          ? { name: sup.name, phone: sup.phone }
          : action === 'UPDATE'
          ? { status: { before: 'Inactive', after: 'Active' } }
          : { deletedSupplier: sup.name };
      } else if (module === 'Customer' && customers.length > 0) {
        const cust = customers[i % customers.length];
        documentId = cust._id;
        readableId = cust.name;
        changes = action === 'CREATE'
          ? { name: cust.name, phone: cust.phone }
          : action === 'UPDATE'
          ? { email: { before: 'old@test.com', after: cust.email || 'new@test.com' } }
          : { deletedCustomer: cust.name };
      } else if (module === 'Invoice' && invoices.length > 0) {
        const inv = invoices[i % invoices.length];
        documentId = inv._id;
        readableId = inv.invoiceNumber;
        changes = action === 'CREATE'
          ? { invoiceNumber: inv.invoiceNumber, grandTotal: inv.grandTotal }
          : action === 'UPDATE'
          ? { amountPaid: { before: 0, after: inv.amountPaid } }
          : { deletedInvoice: inv.invoiceNumber };
      } else if (module === 'PurchaseBill' && purchaseBills.length > 0) {
        const pb = purchaseBills[i % purchaseBills.length];
        documentId = pb._id;
        readableId = pb.billNumber;
        changes = action === 'CREATE'
          ? { billNumber: pb.billNumber, grandTotal: pb.grandTotal }
          : action === 'UPDATE'
          ? { status: { before: 'Pending', after: 'Paid' } }
          : { deletedBill: pb.billNumber };
      } else if (module === 'Quotation' && quotations.length > 0) {
        const q = quotations[i % quotations.length];
        documentId = q._id;
        readableId = q.quotationNumber;
        changes = action === 'CREATE'
          ? { quotationNumber: q.quotationNumber, grandTotal: q.grandTotal }
          : action === 'UPDATE'
          ? { status: { before: 'Draft', after: 'Sent' } }
          : { deletedQuotation: q.quotationNumber };
      } else if (module === 'Category' && categories.length > 0) {
        const cat = categories[i % categories.length];
        documentId = cat._id;
        readableId = cat.name;
        changes = action === 'CREATE'
          ? { name: cat.name, description: cat.description }
          : action === 'UPDATE'
          ? { description: { before: 'Old desc', after: cat.description || 'New desc' } }
          : { deletedCategory: cat.name };
      }

      // Generate spread date
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - i); // i days ago

      const auditLog = new AuditLog({
        user: user._id,
        action,
        module,
        documentId,
        readableId,
        changes
      });

      // Override createdAt field using Mongoose document property or update
      await auditLog.save();
      
      // Update createdAt directly in DB to bypass standard automatic timestamp assignment
      await AuditLog.findByIdAndUpdate(auditLog._id, { createdAt });

      console.log(`Created Audit Log entry [${i}/30]: Action=${action}, Module=${module}, User=${user.name} (${user.role}), Date=${createdAt.toLocaleDateString()}`);
    }

    console.log('\nSeeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
