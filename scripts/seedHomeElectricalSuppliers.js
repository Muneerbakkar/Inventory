import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Supplier from '../src/models/Supplier.js';
import Product from '../src/models/Product.js';

const homeElectricalSuppliers = [
  { name: 'SmartSwitch Fitting Co', phone: '9876543201', address: { street: 'Lamington Road Block C', city: 'Mumbai', state: 'Maharashtra', pincode: '400007' }, gstNumber: '27ABCDE9876F1Z1', gstType: 'Regular', notes: 'Modular switches, sockets, smart glass plates, and mounting frames' },
  { name: 'SafeGuard MCB Industries', phone: '9876543202', address: { street: 'MIDC Phase 1', city: 'Pune', state: 'Maharashtra', pincode: '411018' }, gstNumber: '27FGHIJ4321K1Z2', gstType: 'Regular', notes: 'Miniature circuit breakers (MCBs), RCCBs, and distribution boards' },
  { name: 'FlexiCon PVC Conduits', phone: '9876543203', address: { street: 'Peenya Industrial Area', city: 'Bengaluru', state: 'Karnataka', pincode: '560058' }, gstNumber: '29LMNOP8765Q1Z3', gstType: 'Regular', notes: 'PVC conduit pipes, casing-capping channels, and bend fittings' },
  { name: 'Finolex-style Copper Wires', phone: '9876543204', address: { street: 'Whitefield Main Rd', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' }, gstNumber: '29RSTUV0987W1Z4', gstType: 'Composition', notes: 'Flame retardant (FR) multi-strand copper house wiring cables' },
  { name: 'SecureTape Insulations', phone: '9876543205', address: { street: 'GIDC Phase 2', city: 'Surat', state: 'Gujarat', pincode: '395006' }, gstNumber: '24WXYZA8765A1Z5', gstType: 'Regular', notes: 'PVC insulation tapes, joint sleeves, and heat shrink tubes' },
  { name: 'AnchorLink Modulars', phone: '9876543206', address: { street: 'Vatva Industrial Zone', city: 'Ahmedabad', state: 'Gujarat', pincode: '382440' }, gstNumber: '24BCDEF8765G1Z6', gstType: 'Regular', notes: 'Modular metal wall boxes, surface boxes, and cover plates' },
  { name: 'CopperFlex Earthings', phone: '9876543207', address: { street: 'Wathoda Layout', city: 'Nagpur', state: 'Maharashtra', pincode: '440008' }, gstNumber: '27HIJKL4321M1Z7', gstType: 'Regular', notes: 'Residential chemical earthing rods, copper strips, and salt-charcoal kits' },
  { name: 'NeoPlugs & Extensions', phone: '9876543208', address: { street: 'Guindy Industrial Estate', city: 'Chennai', state: 'Tamil Nadu', pincode: '600032' }, gstNumber: '33NOPQR9876S1Z8', gstType: 'Regular', notes: 'Multi-plug adapters, extension spike busters, and replacement top pins' },
  { name: 'GlowRose Ceiling Accessories', phone: '9876543209', address: { street: 'Ambattur Main Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600053' }, gstNumber: '33TUVWX4321Y1Z9', gstType: 'Composition', notes: 'Ceiling roses, batten lamp holders, and pendant bulb holders' },
  { name: 'WireRun Junctions', phone: '9876543210', address: { street: 'Okhla Phase 1', city: 'New Delhi', state: 'Delhi', pincode: '110020' }, gstNumber: '07ZABCD8765E1ZA', gstType: 'Regular', notes: 'PVC round junction boxes, gang boxes, and terminal connector strips' },
  { name: 'SafeTouch Electricals', phone: '9876543211', address: { street: 'Mayapuri Industrial Area', city: 'New Delhi', state: 'Delhi', pincode: '110064' }, gstNumber: '07FGHIJ0987K1ZB', gstType: 'Regular', notes: 'Busbars, modular indicator lamps, fuse links, and indicator lights' },
  { name: 'MaxShield Fuse Gear', phone: '9876543212', address: { street: 'Howrah Industrial Complex', city: 'Kolkata', state: 'West Bengal', pincode: '711101' }, gstNumber: '19LMNOP4321Q1ZC', gstType: 'Regular', notes: 'Porcelain kit-kat fuses, main switch fuse units, and changeovers' },
  { name: 'DuraGrip Cable Ties', phone: '9876543213', address: { street: 'Salt Lake Sec 3', city: 'Kolkata', state: 'West Bengal', pincode: '700097' }, gstNumber: '19RSTUV9876W1ZD', gstType: 'Composition', notes: 'Nylon cable ties, wall wiring clips, and compression cable glands' },
  { name: 'SmartHome Automation Hubs', phone: '9876543214', address: { street: 'Madhapur Main Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }, gstNumber: '36WXYZA4321A1ZE', gstType: 'Regular', notes: 'WiFi-enabled smart touch switch modules and wireless wall panels' },
  { name: 'EcoVolt Chokes & Starters', phone: '9876543215', address: { street: 'Jubilee Hills Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500033' }, gstNumber: '36BCDEF4321G1ZF', gstType: 'Regular', notes: 'Electronic ballasts, LED drivers, and starter modules' },
  { name: 'RoyalBatten Mounting Plates', phone: '9876543216', address: { street: 'Kalamassery Industrial Rd', city: 'Kochi', state: 'Kerala', pincode: '683104' }, gstNumber: '32HIJKL9876M1ZG', gstType: 'Regular', notes: 'Wooden mounting blocks, plastic backing sheets, and switch spacers' },
  { name: 'CoreLink Connectors', phone: '9876543217', address: { street: 'MG Road Fort', city: 'Ernakulam', state: 'Kerala', pincode: '682016' }, gstNumber: '32NOPQR4321S1ZH', gstType: 'Regular', notes: 'Screw terminal blocks, crimp insulated lugs, and plastic connector strips' },
  { name: 'HydraPipe Steel Conduits', phone: '9876543218', address: { street: 'Sanwer Road Area', city: 'Indore', state: 'Madhya Pradesh', pincode: '452015' }, gstNumber: '23TUVWX9876Y1ZI', gstType: 'Composition', notes: 'Galvanized iron (GI) conduits, metal flexible pipes, and GI saddle clamps' },
  { name: 'VoltCheck Bell Indicators', phone: '9876543219', address: { street: 'Vijay Nagar Main St', city: 'Indore', state: 'Madhya Pradesh', pincode: '452010' }, gstNumber: '23ZABCD4321E1ZJ', gstType: 'Regular', notes: ' Ding-dong doorbells, musical chimes, and voltage indicator units' },
  { name: 'ShieldWire Coaxial Cables', phone: '9876543220', address: { street: 'Malviya Nagar Layout', city: 'Jaipur', state: 'Rajasthan', pincode: '302017' }, gstNumber: '08FGHIJ8765K1ZK', gstType: 'Regular', notes: 'Coaxial RG6 TV cables, telephone line wires, and CAT6 LAN wires' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old suppliers
    console.log('Clearing old suppliers data...');
    const deleteRes = await Supplier.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old suppliers.`);

    // 2. Insert new home electrical equipment suppliers
    console.log('Inserting 20 unique home electrical equipment (non-appliance) suppliers...');
    const insertedSuppliers = await Supplier.insertMany(homeElectricalSuppliers);
    console.log(`Successfully added ${insertedSuppliers.length} new home electrical suppliers.`);

    // 3. Relink existing products to new suppliers to maintain integrity
    console.log('Relinking existing products to new suppliers...');
    const products = await Product.find();
    if (products.length > 0) {
      let relinkedCount = 0;
      for (let i = 0; i < products.length; i++) {
        const prod = products[i];
        const randomSupplier = insertedSuppliers[i % insertedSuppliers.length];
        prod.supplierId = randomSupplier._id;
        await prod.save();
        relinkedCount++;
      }
      console.log(`Successfully relinked ${relinkedCount} products to new suppliers.`);
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
