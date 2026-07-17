import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Supplier from '../src/models/Supplier.js';
import GstSlab from '../src/models/GstSlab.js';

const mockProductsData = [
  { name: 'Wireless Bluetooth Earbuds', brand: 'Sony', unit: 'pcs', purchasePrice: 2400 },
  { name: 'Smart Fitness Watch', brand: 'Noise', unit: 'pcs', purchasePrice: 1800 },
  { name: 'Portable Power Bank 10000mAh', brand: 'Mi', unit: 'pcs', purchasePrice: 850 },
  { name: 'HD LED Monitor 24-inch', brand: 'LG', unit: 'pcs', purchasePrice: 6500 },
  { name: 'Ergonomic Office Chair', brand: 'Featherlite', unit: 'pcs', purchasePrice: 4200 },
  { name: 'Stainless Steel Water Bottle', brand: 'Milton', unit: 'pcs', purchasePrice: 380 },
  { name: 'Organic Whole Wheat Flour', brand: 'Aashirvaad', unit: 'kg', purchasePrice: 120 },
  { name: 'Herbal Aloe Vera Shampoo', brand: 'Himalaya', unit: 'bottle', purchasePrice: 190 },
  { name: 'Multi-purpose Hand Tool Kit', brand: 'Bosch', unit: 'box', purchasePrice: 1100 },
  { name: 'Smart LED Bulb 9W', brand: 'Philips', unit: 'pcs', purchasePrice: 220 },
  { name: 'Hardcover Ruled Notebook', brand: 'Classmate', unit: 'pcs', purchasePrice: 80 },
  { name: 'Ceramic Coffee Mug', brand: 'Claycraft', unit: 'pcs', purchasePrice: 150 },
  { name: 'Premium Gym Duffle Bag', brand: 'Nike', unit: 'pcs', purchasePrice: 1250 },
  { name: 'Non-stick Cookware Set', brand: 'Prestige', unit: 'set', purchasePrice: 2100 },
  { name: 'USB-C Fast Charger', brand: 'Anker', unit: 'pcs', purchasePrice: 480 },
  { name: 'Synthetic Running Shoes', brand: 'Adidas', unit: 'pair', purchasePrice: 2600 },
  { name: 'Men Cotton Polo T-Shirt', brand: 'Puma', unit: 'pcs', purchasePrice: 550 },
  { name: 'Natural Dog Food 3kg', brand: 'Pedigree', unit: 'packet', purchasePrice: 620 },
  { name: 'Wireless Optical Mouse', brand: 'Logitech', unit: 'pcs', purchasePrice: 450 },
  { name: 'Premium Wall Clock', brand: 'Ajanta', unit: 'pcs', purchasePrice: 320 }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    const categories = await Category.find({ isActive: true });
    const suppliers = await Supplier.find();
    const gstSlabs = await GstSlab.find({ isActive: true });

    if (categories.length === 0 || suppliers.length === 0 || gstSlabs.length === 0) {
      console.error('Error: Seeding products requires active Categories, Suppliers, and GST Slabs in the DB.');
      console.log(`Categories: ${categories.length}, Suppliers: ${suppliers.length}, GST Slabs: ${gstSlabs.length}`);
      process.exit(1);
    }

    let insertedCount = 0;
    for (let i = 0; i < mockProductsData.length; i++) {
      const pData = mockProductsData[i];
      
      const exists = await Product.findOne({ name: pData.name });
      if (exists) {
        console.log(`Product ${pData.name} already exists. Skipping.`);
        continue;
      }

      // Assign a random category, supplier, and GST slab
      const randomCategory = categories[i % categories.length];
      const randomSupplier = suppliers[i % suppliers.length];
      const randomGstSlab = gstSlabs[i % gstSlabs.length];

      // Calculate selling prices logically
      const purchasePrice = pData.purchasePrice;
      const gstPercent = randomGstSlab.totalPercent;
      const priceAfterGst = purchasePrice + (purchasePrice * gstPercent / 100);
      const sellingPrice = Math.round(priceAfterGst * 1.2); // 20% margin on top of GST price
      const maxSellingPrice = Math.round(sellingPrice * 1.1); // MRP is 10% higher than selling price

      const product = new Product({
        name: pData.name,
        brand: pData.brand,
        category: randomCategory._id,
        supplierId: randomSupplier._id,
        gstSlabId: randomGstSlab._id,
        purchasePrice: purchasePrice,
        priceAfterGst: priceAfterGst,
        sellingPrice: sellingPrice,
        maxSellingPrice: maxSellingPrice,
        quantity: Math.floor(15 + Math.random() * 50), // 15 to 65 items
        unit: pData.unit,
        reorderLevel: 8,
        commissionPerUnit: Math.round(purchasePrice * 0.02), // 2% commission
        hsnCode: `HSN${Math.floor(100000 + Math.random() * 900000)}`,
        isActive: true
      });

      await product.save();
      console.log(`Created product: ${product.name} (SKU: ${product.sku})`);
      insertedCount++;
    }

    console.log(`\nOperation finished. Successfully added ${insertedCount} new products.`);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting mock products:', err);
    process.exit(1);
  }
};

run();
