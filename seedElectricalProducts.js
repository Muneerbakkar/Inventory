import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import Supplier from './src/models/Supplier.js';
import GstSlab from './src/models/GstSlab.js';

const electricalItems = [
  "LED Bulb 9W", "LED Bulb 12W", "Ceiling Fan 48 inch", "Wall Fan 16 inch", "Exhaust Fan 8 inch",
  "Copper Wire 1.5 sq mm", "Copper Wire 2.5 sq mm", "Copper Wire 4.0 sq mm", "Modular Switch 10A", "Modular Switch 20A",
  "Modular Socket 3 Pin 10A", "Modular Socket 3 Pin 20A", "MCB 10A Single Pole", "MCB 32A Double Pole", "RCCB 40A",
  "Distribution Board 8 Way", "Distribution Board 12 Way", "PVC Conduit Pipe 1 inch", "PVC Conduit Pipe 0.75 inch", "Insulation Tape Black",
  "Insulation Tape Red", "Modular Blank Plate", "Modular Fan Regulator", "Surface Mounting Box 2 Module", "Surface Mounting Box 4 Module",
  "Surface Mounting Box 8 Module", "Concealed Box 2 Module", "Concealed Box 4 Module", "Concealed Box 8 Module", "Batten Holder",
  "Angle Holder", "Ceiling Rose", "Door Bell", "Video Door Phone", "Smart Switch 4 Gang",
  "Smart Plug 16A", "Motion Sensor Light", "Step Marker Light", "Strip Light 5m 12V", "SMPS 12V 5A",
  "Modular TV Socket", "Modular RJ45 Socket", "Modular Telephone Socket", "Main Switch 32A", "Changeover Switch 63A",
  "Submersible Pump Cable", "AC Box with MCB", "Water Heater 15L", "Immersion Rod 1000W", "Extension Board 4 Socket"
];

const brands = [
  "Havells", "Anchor", "Polycab", "Finolex", "Legrand", "Schneider", "V-Guard", "Syska", "Crompton", "Philips",
  "Orient", "Usha", "Bajaj", "Luminous", "Goldmedal", "GM Modular", "RR Kabel", "Kei", "Wipro", "Panasonic",
  "Simon", "Crabtree", "GreatWhite", "HPL", "Cona", "Norisys", "Orpat", "Eveready", "Halonix", "Surya",
  "Jaquar", "Atomberg", "Orien", "Almonard", "Khaitan", "Microtek", "Exide", "Amara Raja", "Su-Kam", "Zebronics",
  "TP-Link", "D-Link", "Honeywell", "Godrej", "Secure", "L&T", "Siemens", "ABB", "Eaton", "Mitsubishi"
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedElectricalProducts = async () => {
  try {
    await connectDB();

    const categories = await Category.find();
    const suppliers = await Supplier.find();
    const gstSlabs = await GstSlab.find();

    if (!categories.length || !suppliers.length || !gstSlabs.length) {
      console.error("Please ensure Categories, Suppliers, and GstSlabs exist in the DB.");
      process.exit(1);
    }

    // Shuffle arrays for randomness
    const shuffledItems = [...electricalItems].sort(() => 0.5 - Math.random());
    const shuffledBrands = [...brands].sort(() => 0.5 - Math.random());

    const newProducts = [];
    
    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const gstSlab = gstSlabs[Math.floor(Math.random() * gstSlabs.length)];
      
      const purchasePrice = Math.floor(Math.random() * 2000) + 100; // 100 to 2100
      const gstPercent = gstSlab.totalPercent || 0;
      const priceAfterGst = purchasePrice * (1 + gstPercent / 100);
      const sellingPrice = priceAfterGst + Math.floor(Math.random() * 500) + 50; // Add margin
      const maxSellingPrice = sellingPrice + Math.floor(Math.random() * 300) + 50;
      
      // Ensure SKU and brand are unique by pairing them 1:1 with the loop index
      // The prompt requested customId (sku) and brand name to be unique.
      const uniqueSku = `ELEC-${1000 + i}-${Math.floor(Math.random() * 10000)}`;
      const uniqueBrand = shuffledBrands[i]; 

      newProducts.push({
        name: shuffledItems[i],
        brand: uniqueBrand,
        category: category._id,
        sku: uniqueSku,
        supplierId: supplier._id,
        purchasePrice,
        gstSlabId: gstSlab._id,
        priceAfterGst,
        sellingPrice,
        maxSellingPrice,
        quantity: Math.floor(Math.random() * 100) + 10,
        unit: 'pcs',
        reorderLevel: 10,
        hsnCode: `8536${Math.floor(Math.random() * 9000) + 1000}`
      });
    }

    await Product.insertMany(newProducts);
    console.log(`Successfully seeded ${newProducts.length} unique electrical products!`);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedElectricalProducts();
