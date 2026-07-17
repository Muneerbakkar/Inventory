import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Quotation from './src/models/Quotation.js';
import Product from './src/models/Product.js';
import Customer from './src/models/Customer.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedQuotations = async () => {
  try {
    await connectDB();

    const useProducts = await Product.find();
    
    const customers = await Customer.find();

    if (!useProducts.length || !customers.length) {
      console.error("Please ensure Products and Customers exist in the DB.");
      process.exit(1);
    }

    const newQuotations = [];
    const statuses = ['Draft', 'Pending', 'Converted', 'Expired', 'Rejected'];

    for (let i = 0; i < 50; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 5) + 1; // 1 to 5 items per quote
      
      const items = [];
      let subTotal = 0;
      let totalGst = 0;
      
      const shuffledProducts = [...useProducts].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < numItems; j++) {
        const product = shuffledProducts[j];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const sellingPrice = product.sellingPrice;
        
        // Wait, gstPercent should come from product or GstSlab. We'll populate it if available, or assume 18.
        let gstPercent = 18;
        if (product.gstSlabId) {
            // we didn't populate it here, let's just assume 18 or look up. 
            // since we don't have GstSlab loaded here directly for the product, 
            // we will just use 18% as a dummy fallback, but actually let's calculate backward from priceAfterGst if it exists.
        }
        if (product.priceAfterGst && product.purchasePrice) {
            gstPercent = Math.round(((product.priceAfterGst / product.purchasePrice) - 1) * 100);
        }

        const lineTotal = quantity * sellingPrice;
        const itemGst = lineTotal * (gstPercent / 100);
        
        items.push({
          productId: product._id,
          quantity,
          sellingPrice,
          gstPercent,
          lineTotal
        });
        
        subTotal += lineTotal;
        totalGst += itemGst;
      }

      const rawGrandTotal = subTotal + totalGst;
      const grandTotal = Math.round(rawGrandTotal);
      const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));
      
      const timestamp = new Date().getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Past 30 days
      const date = new Date(timestamp);
      
      const validTillDate = new Date(timestamp + 15 * 24 * 60 * 60 * 1000); // 15 days validity
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      newQuotations.push({
        quotationNumber: `QT-SEED-${Math.floor(Math.random() * 1000000)}-${i}`,
        date,
        validTillDate,
        customerId: customer._id,
        items,
        subTotal: Number(subTotal.toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        roundOff,
        grandTotal,
        status
      });
    }

    await Quotation.insertMany(newQuotations);
    console.log(`Successfully seeded ${newQuotations.length} dummy quotations!`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedQuotations();
