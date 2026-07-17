import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Quotation from './src/models/Quotation.js';
import Invoice from './src/models/Invoice.js';
import PurchaseBill from './src/models/PurchaseBill.js';
import PurchaseReturn from './src/models/PurchaseReturn.js';
import DebitNote from './src/models/DebitNote.js';
import Notification from './src/models/Notification.js';
import Product from './src/models/Product.js';
import Customer from './src/models/Customer.js';
import Supplier from './src/models/Supplier.js';
import GstSlab from './src/models/GstSlab.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedAll = async () => {
  try {
    await connectDB();

    const products = await Product.find();
    const customers = await Customer.find();
    const suppliers = await Supplier.find();
    const gstSlabs = await GstSlab.find();

    if (!products.length || !customers.length || !suppliers.length) {
      console.error("Please ensure Products, Customers, and Suppliers exist in the DB.");
      process.exit(1);
    }

    console.log("Generating data...");

    // 1. Quotations
    const newQuotations = [];
    for (let i = 0; i < 20; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let subTotal = 0, totalGst = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const sellingPrice = product.sellingPrice;
        let gstPercent = 18;
        if (product.priceAfterGst && product.purchasePrice) {
            gstPercent = Math.round(((product.priceAfterGst / product.purchasePrice) - 1) * 100);
        }
        const lineTotal = quantity * sellingPrice;
        const itemGst = lineTotal * (gstPercent / 100);
        
        items.push({ productId: product._id, quantity, sellingPrice, gstPercent, lineTotal });
        subTotal += lineTotal;
        totalGst += itemGst;
      }
      
      const grandTotal = Math.round(subTotal + totalGst);
      const roundOff = Number((grandTotal - (subTotal + totalGst)).toFixed(2));
      const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      newQuotations.push({
        quotationNumber: `QT-S-${Date.now()}-${i}`,
        date,
        validTillDate: new Date(date.getTime() + 15 * 24 * 60 * 60 * 1000),
        customerId: customer._id,
        items,
        subTotal: Number(subTotal.toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        roundOff,
        grandTotal,
        status: ['Draft', 'Pending', 'Converted', 'Expired'][Math.floor(Math.random() * 4)]
      });
    }
    await Quotation.insertMany(newQuotations);

    // 2. Invoices (Sales)
    const newInvoices = [];
    for (let i = 0; i < 30; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let subTotal = 0, totalGst = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const sellingPrice = product.sellingPrice;
        let gstPercent = 18;
        if (product.priceAfterGst && product.purchasePrice) {
            gstPercent = Math.round(((product.priceAfterGst / product.purchasePrice) - 1) * 100);
        }
        const lineTotal = quantity * sellingPrice;
        const itemGst = lineTotal * (gstPercent / 100);
        
        items.push({ productId: product._id, quantity, sellingPrice, gstPercent, lineTotal });
        subTotal += lineTotal;
        totalGst += itemGst;
      }
      
      const grandTotal = Math.round(subTotal + totalGst);
      const roundOff = Number((grandTotal - (subTotal + totalGst)).toFixed(2));
      const amountPaid = Math.random() > 0.3 ? grandTotal : 0; // 70% paid
      const status = amountPaid === grandTotal ? 'Paid' : 'Pending';
      const balanceDue = grandTotal - amountPaid;

      newInvoices.push({
        invoiceNumber: `INV-S-${Date.now()}-${i}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        customerId: customer._id,
        items,
        subTotal: Number(subTotal.toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        roundOff,
        grandTotal,
        paymentMode: 'Cash',
        amountPaid,
        balanceDue,
        status
      });
    }
    await Invoice.insertMany(newInvoices);

    // 3. Purchase Bills
    const newPurchaseBills = [];
    for (let i = 0; i < 20; i++) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let subTotal = 0, totalGst = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 20) + 5;
        const purchasePrice = product.purchasePrice;
        let gstPercent = 18;
        if (product.priceAfterGst && product.purchasePrice) {
            gstPercent = Math.round(((product.priceAfterGst / product.purchasePrice) - 1) * 100);
        }
        const lineTotal = quantity * purchasePrice;
        const itemGst = lineTotal * (gstPercent / 100);
        
        items.push({ productId: product._id, quantity, purchasePrice, gstPercent, lineTotal });
        subTotal += lineTotal;
        totalGst += itemGst;
      }
      
      const grandTotal = Math.round(subTotal + totalGst);
      const roundOff = Number((grandTotal - (subTotal + totalGst)).toFixed(2));
      const amountPaid = Math.random() > 0.5 ? grandTotal : Math.floor(grandTotal / 2);
      const status = amountPaid === grandTotal ? 'Paid' : 'Partial';
      const balanceDue = grandTotal - amountPaid;

      newPurchaseBills.push({
        billNumber: `PB-S-${Date.now()}-${i}`,
        supplierId: supplier._id,
        supplierRefNumber: `REF-${Math.floor(Math.random()*1000)}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        items,
        subTotal: Number(subTotal.toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        roundOff,
        grandTotal,
        paymentMode: 'Bank Transfer',
        amountPaid,
        balanceDue,
        status
      });
    }
    const savedPBs = await PurchaseBill.insertMany(newPurchaseBills);

    // 4. Purchase Returns & 5. Debit Notes
    const newPurchaseReturns = [];
    const newDebitNotes = [];
    
    for (let i = 0; i < 10; i++) {
      const pb = savedPBs[i];
      const supplier = suppliers.find(s => s._id.toString() === pb.supplierId.toString());
      
      // Return 1 item from the purchase bill
      const itemToReturn = pb.items[0];
      const returnQty = Math.max(1, Math.floor(itemToReturn.quantity / 2));
      const lineTotal = returnQty * itemToReturn.purchasePrice;
      const itemGst = lineTotal * (itemToReturn.gstPercent / 100);
      
      const subTotal = lineTotal;
      const totalGst = itemGst;
      const grandTotal = Math.round(subTotal + totalGst);
      const roundOff = Number((grandTotal - (subTotal + totalGst)).toFixed(2));
      
      const prData = {
        returnNumber: `PR-S-${Date.now()}-${i}`,
        date: new Date(),
        originalBillId: pb._id,
        supplierId: pb.supplierId,
        items: [{
          productId: itemToReturn.productId,
          quantity: returnQty,
          purchasePrice: itemToReturn.purchasePrice,
          gstPercent: itemToReturn.gstPercent,
          lineTotal,
          reason: 'Defective Product'
        }],
        subTotal: Number(subTotal.toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        roundOff,
        grandTotal,
        status: 'Completed',
        refundStatus: 'Pending'
      };
      
      const savedPR = await PurchaseReturn.create(prData);
      
      // Create Debit Note for this return
      newDebitNotes.push({
        noteNumber: `DN-S-${Date.now()}-${i}`,
        date: new Date(),
        relatedReturnId: savedPR._id,
        supplierId: pb.supplierId,
        amount: grandTotal,
        reason: 'Goods returned due to defect',
        status: 'Finalized'
      });
    }
    await DebitNote.insertMany(newDebitNotes);

    // 6. Notifications
    const newNotifications = [
      { message: "Product A is running low on stock.", type: "LowStock", isRead: false, relatedEntityId: new mongoose.Types.ObjectId(), relatedEntityModel: 'Product' },
      { message: "Invoice INV-S-001 is overdue.", type: "OverduePayment", isRead: false, relatedEntityId: new mongoose.Types.ObjectId(), relatedEntityModel: 'Invoice' },
      { message: "System maintenance scheduled for tonight.", type: "System", isRead: false }
    ];
    await Notification.insertMany(newNotifications);

    console.log("Successfully seeded Quotations, Sales, Purchases, Returns, Debit Notes, and Notifications!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAll();
