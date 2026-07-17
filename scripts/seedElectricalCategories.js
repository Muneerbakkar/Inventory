import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';

const electricalCategories = [
  { name: 'LED Bulbs & Tubes', description: 'Standard LED bulbs, batten tube lights, and panel downlights' },
  { name: 'Ceiling Fans', description: 'Standard, high-speed, and decorative ceiling fans' },
  { name: 'Exhaust & Ventilation Fans', description: 'Wall exhaust fans, kitchen, and bathroom ventilation fans' },
  { name: 'Table & Pedestal Fans', description: 'Portable table-top and stand pedestal fans' },
  { name: 'Modular Switches & Sockets', description: 'Electrical switches, 3-pin socket units, regulators, and indicators' },
  { name: 'Switch Plates & Frames', description: 'Modular cover plates, surface plates, and spacer frames' },
  { name: 'Switch Boxes & Gang Boxes', description: 'Metal flush boxes and PVC surface mounting switch boxes' },
  { name: 'Conduit Pipes & Fittings', description: 'Rigid PVC wiring pipes, elbow bends, couplers, and tees' },
  { name: 'Casing & Capping', description: 'PVC wiring channel ducts, casing capping, and joint angles' },
  { name: 'Copper House Wires', description: '1.0 sq mm, 1.5 sq mm, and 2.5 sq mm multi-strand house wiring cables' },
  { name: 'Heavy Duty Power Cables', description: 'Armored cables, flexible copper round cables, and industrial wires' },
  { name: 'Coaxial & Communication Wires', description: 'Coaxial TV wires, telephone line cables, and CAT6 LAN wires' },
  { name: 'Insulation Tapes & Sleeves', description: 'PVC electrical insulation tapes, joint sleeves, and spiral wraps' },
  { name: 'Distribution Boards & DB Boxes', description: 'MCB distribution boxes, plastic DB frames, and busbar chambers' },
  { name: 'MCBs & Circuit Breakers', description: 'Single/double pole MCBs, isolator switches, and RCCBs' },
  { name: 'Junction Boxes & Connectors', description: 'PVC round junction boxes, gang boxes, and terminal connector blocks' },
  { name: 'Lamp Holders & Ceiling Roses', description: 'Batten holders, angle holders, ceiling roses, and plug tops' },
  { name: 'Extension Cords & Plugs', description: 'Spike guard strips, multi-plug adapters, and replacement plug pins' },
  { name: 'Earthing Materials', description: 'Earthing copper wires, copper earthing plates, and bent spikes' },
  { name: 'Smart Switch Modules', description: 'WiFi smart automation switch modules and touch panels' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old categories
    console.log('Clearing old categories data...');
    const deleteRes = await Category.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old categories.`);

    // 2. Insert new electrical categories
    console.log('Inserting 20 specific home electrical categories (Bulbs, Fans, Switch Boards, Wires, Pipes)...');
    const insertedCategories = [];
    for (const catData of electricalCategories) {
      const category = new Category(catData);
      await category.save();
      insertedCategories.push(category);
    }
    console.log(`Successfully added ${insertedCategories.length} new categories.`);

    // 3. Relink existing products to new categories to maintain integrity
    console.log('Relinking existing products to new categories...');
    const products = await Product.find();
    if (products.length > 0) {
      let relinkedCount = 0;
      for (let i = 0; i < products.length; i++) {
        const prod = products[i];
        const randomCategory = insertedCategories[i % insertedCategories.length];
        prod.category = randomCategory._id;
        
        // Regenerate SKU using new category code
        const categoryCode = randomCategory.name.substring(0, 3).toUpperCase();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        prod.sku = `${categoryCode}-${Date.now().toString().slice(-4)}${randomSuffix}`;
        
        await prod.save();
        relinkedCount++;
      }
      console.log(`Successfully relinked ${relinkedCount} products to new categories.`);
    } else {
      console.log('No products found to relink.');
    }

    console.log('\nSeeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
