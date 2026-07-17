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

const mockProducts = [
  // Bulbs & Lighting (12% GST typically)
  { name: 'Philips 9W LED Bulb (Cool Day Light)', brand: 'Philips', unit: 'pcs', purchasePrice: 75 },
  { name: 'Havells 12W LED Panel Downlight', brand: 'Havells', unit: 'pcs', purchasePrice: 220 },
  { name: 'Syska 15W LED Batten Tube Light', brand: 'Syska', unit: 'pcs', purchasePrice: 160 },
  { name: 'Wipro Smart 9W RGB LED Bulb', brand: 'Wipro', unit: 'pcs', purchasePrice: 380 },
  { name: 'Crompton 20W T-Bulb (Cool Daylight)', brand: 'Crompton', unit: 'pcs', purchasePrice: 180 },
  { name: 'Osram 5W LED Night Bulb (Warm White)', brand: 'Osram', unit: 'pcs', purchasePrice: 45 },

  // Fans & Ventilation (18% GST typically)
  { name: 'Havells Ambrose 1200mm Ceiling Fan', brand: 'Havells', unit: 'pcs', purchasePrice: 2100 },
  { name: 'Orient Electric Apex 1200mm Ceiling Fan', brand: 'Orient', unit: 'pcs', purchasePrice: 1650 },
  { name: 'Usha Swift 1200mm Ceiling Fan', brand: 'Usha', unit: 'pcs', purchasePrice: 1550 },
  { name: 'Luminous Vento 150mm Exhaust Fan', brand: 'Luminous', unit: 'pcs', purchasePrice: 850 },
  { name: 'Crompton Windflow 300mm Pedestal Fan', brand: 'Crompton', unit: 'pcs', purchasePrice: 2400 },
  { name: 'Bajaj Platini 400mm Table Fan', brand: 'Bajaj', unit: 'pcs', purchasePrice: 1900 },

  // Switch Boards & Modular Fittings (18% GST)
  { name: 'Anchor Roma 18 Module Switch Board Plate', brand: 'Anchor', unit: 'pcs', purchasePrice: 240 },
  { name: 'Legrand Myrius 6A Modular Switch (White)', brand: 'Legrand', unit: 'pcs', purchasePrice: 32 },
  { name: 'GM Modular 16A 3-Pin Socket unit', brand: 'GM', unit: 'pcs', purchasePrice: 85 },
  { name: 'Goldmedal Curve 18-Module Metal Flush Box', brand: 'Goldmedal', unit: 'pcs', purchasePrice: 140 },
  { name: 'Anchor Penta 6A Flush Mounting Socket', brand: 'Anchor', unit: 'pcs', purchasePrice: 45 },
  { name: 'GM Z-Fi Smart WiFi Modular Switch Module', brand: 'GM', unit: 'pcs', purchasePrice: 1150 },

  // Wires & Cables (18% GST)
  { name: 'Finolex 1.5 sq mm FR Copper House Wire (90m)', brand: 'Finolex', unit: 'coil', purchasePrice: 1250 },
  { name: 'Polycab 2.5 sq mm FRLS Copper Wire (90m)', brand: 'Polycab', unit: 'coil', purchasePrice: 1950 },
  { name: 'RR Kabel 1.0 sq mm Multi-strand Wire (90m)', brand: 'RR Kabel', unit: 'coil', purchasePrice: 850 },
  { name: 'Finolex RG6 Coaxial TV Cable (100m)', brand: 'Finolex', unit: 'coil', purchasePrice: 1100 },
  { name: 'KEI 4.0 sq mm Single Core FR Cable (90m)', brand: 'KEI', unit: 'coil', purchasePrice: 2900 },
  { name: 'D-Link CAT6 LAN Ethernet Cable (305m Drum)', brand: 'D-Link', unit: 'drum', purchasePrice: 7200 },

  // Wiring Pipes & Conduits (18% GST)
  { name: 'Supreme 20mm Heavy Rigid PVC Conduit Pipe (3m)', brand: 'Supreme', unit: 'length', purchasePrice: 48 },
  { name: 'Supreme 25mm Medium PVC Conduit Pipe (3m)', brand: 'Supreme', unit: 'length', purchasePrice: 62 },
  { name: 'Precision 20mm PVC Elbow Bend', brand: 'Precision', unit: 'pcs', purchasePrice: 6 },
  { name: 'Precision 25mm PVC Coupler Connector', brand: 'Precision', unit: 'pcs', purchasePrice: 8 },
  { name: 'Astral 25mm PVC Casing Capping Channel (3m)', brand: 'Astral', unit: 'length', purchasePrice: 75 },
  { name: 'Astral 20mm PVC Round Junction Box (4-Way)', brand: 'Astral', unit: 'pcs', purchasePrice: 22 }
];

const findCategory = (name, categories) => {
  const lower = name.toLowerCase();
  if (lower.includes('bulb') || lower.includes('downlight') || lower.includes('tube light')) {
    return categories.find(c => c.name.toLowerCase().includes('bulbs')) || categories[0];
  }
  if (lower.includes('ceiling fan')) {
    return categories.find(c => c.name.toLowerCase().includes('ceiling fans')) || categories[0];
  }
  if (lower.includes('exhaust') || lower.includes('ventilation')) {
    return categories.find(c => c.name.toLowerCase().includes('exhaust')) || categories[0];
  }
  if (lower.includes('pedestal') || lower.includes('table fan')) {
    return categories.find(c => c.name.toLowerCase().includes('table')) || categories[0];
  }
  if (lower.includes('switch board') || lower.includes('flush box')) {
    return categories.find(c => c.name.toLowerCase().includes('boxes')) || categories[0];
  }
  if (lower.includes('switch') || lower.includes('socket')) {
    return categories.find(c => c.name.toLowerCase().includes('switches')) || categories[0];
  }
  if (lower.includes('copper wire') || lower.includes('strand wire') || lower.includes('fr cable')) {
    return categories.find(c => c.name.toLowerCase().includes('house wires')) || categories[0];
  }
  if (lower.includes('coaxial') || lower.includes('lan') || lower.includes('ethernet')) {
    return categories.find(c => c.name.toLowerCase().includes('coaxial')) || categories[0];
  }
  if (lower.includes('conduit') || lower.includes('elbow') || lower.includes('coupler')) {
    return categories.find(c => c.name.toLowerCase().includes('conduit')) || categories[0];
  }
  if (lower.includes('casing')) {
    return categories.find(c => c.name.toLowerCase().includes('casing')) || categories[0];
  }
  if (lower.includes('junction box')) {
    return categories.find(c => c.name.toLowerCase().includes('junction')) || categories[0];
  }
  return categories[0];
};

const findSupplier = (name, suppliers) => {
  const lower = name.toLowerCase();
  if (lower.includes('philips')) {
    return suppliers.find(s => s.name.toLowerCase().includes('philips')) || suppliers[0];
  }
  if (lower.includes('havells')) {
    return suppliers.find(s => s.name.toLowerCase().includes('havells')) || suppliers[0];
  }
  if (lower.includes('anchor')) {
    return suppliers.find(s => s.name.toLowerCase().includes('anchor')) || suppliers[0];
  }
  if (lower.includes('finolex')) {
    return suppliers.find(s => s.name.toLowerCase().includes('finolex')) || suppliers[0];
  }
  if (lower.includes('polycab')) {
    return suppliers.find(s => s.name.toLowerCase().includes('polycab')) || suppliers[0];
  }
  if (lower.includes('orient')) {
    return suppliers.find(s => s.name.toLowerCase().includes('orient')) || suppliers[0];
  }
  if (lower.includes('usha')) {
    return suppliers.find(s => s.name.toLowerCase().includes('usha')) || suppliers[0];
  }
  if (lower.includes('gm modular') || lower.includes('goldmedal')) {
    return suppliers.find(s => s.name.toLowerCase().includes('goldmedal') || s.name.toLowerCase().includes('gm modular')) || suppliers[0];
  }
  if (lower.includes('supreme')) {
    return suppliers.find(s => s.name.toLowerCase().includes('supreme')) || suppliers[0];
  }
  if (lower.includes('astral')) {
    return suppliers.find(s => s.name.toLowerCase().includes('astral')) || suppliers[0];
  }
  return suppliers[Math.floor(Math.random() * suppliers.length)];
};

const findGstSlab = (name, slabs) => {
  const lower = name.toLowerCase();
  if (lower.includes('bulb') || lower.includes('led') || lower.includes('downlight') || lower.includes('tube light')) {
    return slabs.find(s => s.totalPercent === 12) || slabs[0];
  }
  return slabs.find(s => s.totalPercent === 18) || slabs[0];
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old products
    console.log('Clearing old products data...');
    const deleteRes = await Product.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old products.`);

    const categories = await Category.find({ isActive: true });
    const suppliers = await Supplier.find();
    const gstSlabs = await GstSlab.find({ isActive: true });

    if (categories.length === 0 || suppliers.length === 0 || gstSlabs.length === 0) {
      console.error('Error: Seeding products requires Categories, Suppliers, and GST Slabs in the DB.');
      process.exit(1);
    }

    // 2. Insert new electrical products
    console.log('Inserting 30 unique home electrical products...');
    let insertedCount = 0;
    for (const pData of mockProducts) {
      const category = findCategory(pData.name, categories);
      const supplier = findSupplier(pData.name, suppliers);
      const gstSlab = findGstSlab(pData.name, gstSlabs);

      const purchasePrice = pData.purchasePrice;
      const priceAfterGst = purchasePrice + (purchasePrice * gstSlab.totalPercent / 100);
      const sellingPrice = Math.round(priceAfterGst * 1.25); // 25% margin
      const maxSellingPrice = Math.round(sellingPrice * 1.15); // MRP is 15% higher

      const product = new Product({
        name: pData.name,
        brand: pData.brand,
        category: category._id,
        supplierId: supplier._id,
        gstSlabId: gstSlab._id,
        purchasePrice: purchasePrice,
        priceAfterGst: priceAfterGst,
        sellingPrice: sellingPrice,
        maxSellingPrice: maxSellingPrice,
        quantity: Math.floor(20 + Math.random() * 80), // 20 to 100 items in stock
        unit: pData.unit,
        reorderLevel: 10,
        commissionPerUnit: Math.round(purchasePrice * 0.03), // 3% sales agent commission
        hsnCode: `HSN${Math.floor(850000 + Math.random() * 140000)}`,
        isActive: true
      });

      await product.save();
      console.log(`Created product: ${product.name} (SKU: ${product.sku}, Category: ${category.name}, Supplier: ${supplier.name})`);
      insertedCount++;
    }

    console.log(`\nSeeding completed successfully. Added ${insertedCount} new electrical products.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
