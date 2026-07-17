import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Category from '../src/models/Category.js';

const mockCategories = [
  { name: 'Electronics', description: 'Consumer electronics and gadgets' },
  { name: 'Home Appliances', description: 'Household kitchen and living appliances' },
  { name: 'Clothing & Apparel', description: 'Men, women, and kids apparel' },
  { name: 'Footwear', description: 'Shoes, sandals, and sports footwear' },
  { name: 'Groceries & Staples', description: 'Daily kitchen essentials and food grains' },
  { name: 'Beverages', description: 'Soft drinks, juices, tea, and coffee' },
  { name: 'Cosmetics & Personal Care', description: 'Makeup, skin care, and hair care products' },
  { name: 'Pharmaceuticals & Health', description: 'OTC drugs, health monitors, and supplements' },
  { name: 'Furniture & Decor', description: 'Home furniture, lamps, and wall decor' },
  { name: 'Kitchenware & Dining', description: 'Utensils, cookware, and dining sets' },
  { name: 'Books & Stationery', description: 'Novels, notebooks, and office stationery' },
  { name: 'Toys & Games', description: 'Kids toys, board games, and puzzles' },
  { name: 'Sports & Fitness', description: 'Gym equipment, sportswear, and outdoor gear' },
  { name: 'Automotive Accessories', description: 'Car perfumes, cleaning kits, and seat covers' },
  { name: 'Tools & Hardware', description: 'Hand tools, power tools, and hardware kits' },
  { name: 'Electrical Supplies', description: 'LED bulbs, switches, wires, and extension boards' },
  { name: 'Gardening & Outdoors', description: 'Pots, plant seeds, and gardening tools' },
  { name: 'Pet Supplies', description: 'Pet food, toys, and grooming items' },
  { name: 'Office Supplies', description: 'Printers, ink cartridges, and filing folders' },
  { name: 'Music & Audio', description: 'Headphones, speakers, and musical instruments' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    let insertedCount = 0;
    for (const c of mockCategories) {
      const exists = await Category.findOne({ name: c.name });
      if (exists) {
        console.log(`Category ${c.name} already exists. Skipping.`);
        continue;
      }
      
      const category = new Category(c);
      await category.save();
      console.log(`Created category: ${c.name}`);
      insertedCount++;
    }

    console.log(`\nOperation finished. Successfully added ${insertedCount} new categories.`);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting mock categories:', err);
    process.exit(1);
  }
};

run();
