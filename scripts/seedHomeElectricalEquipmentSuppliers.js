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
  { name: 'BrightLite Bulb & LED Co', phone: '9876543301', address: { street: 'Lamington Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400007' }, gstNumber: '27ABCDE1111A1Z1', gstType: 'Regular', notes: 'Supplier of LED bulbs, tube lights, night lamps, and spotlights' },
  { name: 'BreezeKing Ceiling Fans Ltd', phone: '9876543302', address: { street: 'Industrial Estate Phase 2', city: 'Pune', state: 'Maharashtra', pincode: '411018' }, gstNumber: '27FGHIJ2222B1Z2', gstType: 'Regular', notes: 'Supplier of ceiling fans, exhaust fans, and table fans' },
  { name: 'BoardMaster Modular Switches', phone: '9876543303', address: { street: 'Peenya Industrial Area', city: 'Bengaluru', state: 'Karnataka', pincode: '560058' }, gstNumber: '29LMNOP3333C1Z3', gstType: 'Regular', notes: 'Supplier of switch boards, modular panels, modular switches, and gang boxes' },
  { name: 'Finolex Wire Distributors', phone: '9876543304', address: { street: 'Whitefield Main Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' }, gstNumber: '29RSTUV4444D1Z4', gstType: 'Composition', notes: 'Supplier of multi-strand house wires, flexible cables, and copper wires' },
  { name: 'PipeMax PVC Conduits', phone: '9876543305', address: { street: 'GIDC Phase 1', city: 'Surat', state: 'Gujarat', pincode: '395006' }, gstNumber: '24WXYZA5555E1Z5', gstType: 'Regular', notes: 'Supplier of PVC wiring pipes, conduit pipes, casing-capping, and bends' },
  { name: 'EverGlow Lighting & Bulbs', phone: '9876543306', address: { street: 'Vatva Industrial Zone', city: 'Ahmedabad', state: 'Gujarat', pincode: '382440' }, gstNumber: '24BCDEF6666F1Z6', gstType: 'Regular', notes: 'Supplier of panel lights, strip lights, and CFLs' },
  { name: 'AirFlow Exhausts & Fans', phone: '9876543307', address: { street: 'MIDC Area', city: 'Nagpur', state: 'Maharashtra', pincode: '440008' }, gstNumber: '27HIJKL7777G1Z7', gstType: 'Regular', notes: 'Supplier of ventilation exhaust fans, table fans, and wall-mounted fans' },
  { name: 'Anchor Switch Board Solutions', phone: '9876543308', address: { street: 'Guindy Industrial Estate', city: 'Chennai', state: 'Tamil Nadu', pincode: '600032' }, gstNumber: '33NOPQR8888H1Z8', gstType: 'Regular', notes: 'Supplier of modular switch boards, metal boxes, and plate frames' },
  { name: 'Polycab Wires & Cables', phone: '9876543309', address: { street: 'Ambattur Main Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600053' }, gstNumber: '33TUVWX9999I1Z9', gstType: 'Composition', notes: 'Supplier of power cables, building wires, and insulation sleeves' },
  { name: 'DuraCon PVC Wiring Pipes', phone: '9876543310', address: { street: 'Okhla Phase 1', city: 'New Delhi', state: 'Delhi', pincode: '110020' }, gstNumber: '07ZABCD1111J1ZA', gstType: 'Regular', notes: 'Supplier of wiring pipes, conduit pipes, elbow joints, and couplers' },
  { name: 'Philips LED Bulb Center', phone: '9876543311', address: { street: 'Mayapuri Sec 2', city: 'New Delhi', state: 'Delhi', pincode: '110064' }, gstNumber: '07FGHIJ2222K1ZB', gstType: 'Regular', notes: 'Supplier of smart LED bulbs, downlights, and batten tube lights' },
  { name: 'Orient Fan & Motor Corp', phone: '9876543312', address: { street: 'Howrah Industrial Area', city: 'Kolkata', state: 'West Bengal', pincode: '711101' }, gstNumber: '19LMNOP3333L1ZC', gstType: 'Regular', notes: 'Supplier of high-speed ceiling fans, wall fans, and blowers' },
  { name: 'Goldmedal Switch Boards', phone: '9876543313', address: { street: 'Salt Lake Sector 5', city: 'Kolkata', state: 'West Bengal', pincode: '700091' }, gstNumber: '19RSTUV4444M1ZD', gstType: 'Composition', notes: 'Supplier of modular plates, switch boards, sockets, and indicator boards' },
  { name: 'RR Kabel House Wires', phone: '9876543314', address: { street: 'Madhapur Main Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }, gstNumber: '36WXYZA5555N1ZE', gstType: 'Regular', notes: 'Supplier of flexible wires, heat-resistant building wires, and house cables' },
  { name: 'Supreme Conduit Pipes', phone: '9876543315', address: { street: 'Jubilee Hills Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500033' }, gstNumber: '36BCDEF6666O1ZF', gstType: 'Regular', notes: 'Supplier of rigid PVC wiring pipes, flexible hose conduits, and GI saddles' },
  { name: 'Havells Bulb & Lighting', phone: '9876543316', address: { street: 'Kalamassery Industrial area', city: 'Kochi', state: 'Kerala', pincode: '683104' }, gstNumber: '32HIJKL7777P1ZG', gstType: 'Regular', notes: 'Supplier of LED spot lights, panel lights, and decorative bulbs' },
  { name: 'Usha Fans & Ventilation', phone: '9876543317', address: { street: 'MG Road Junction', city: 'Ernakulam', state: 'Kerala', pincode: '682016' }, gstNumber: '32NOPQR8888Q1ZH', gstType: 'Regular', notes: 'Supplier of ceiling fans, table fans, and wall fans' },
  { name: 'GM Modular Switch Boards', phone: '9876543318', address: { street: 'Sanwer Road Sec 1', city: 'Indore', state: 'Madhya Pradesh', pincode: '452015' }, gstNumber: '23TUVWX9999R1ZI', gstType: 'Composition', notes: 'Supplier of WiFi smart switch boards, modular frames, and switches' },
  { name: 'KEI Cables & Wires', phone: '9876543319', address: { street: 'Vijay Nagar Square', city: 'Indore', state: 'Madhya Pradesh', pincode: '452010' }, gstNumber: '23ZABCD1111S1ZJ', gstType: 'Regular', notes: 'Supplier of building wires, submersible cables, and coaxial TV wires' },
  { name: 'Astral Wiring Pipes & Fittings', phone: '9876543320', address: { street: 'Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302017' }, gstNumber: '08FGHIJ2222T1ZK', gstType: 'Regular', notes: 'Supplier of PVC wiring channels, bends, junction boxes, and installation fittings' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old suppliers
    console.log('Clearing old suppliers data...');
    const deleteRes = await Supplier.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old suppliers.`);

    // 2. Insert new electrical equipment suppliers
    console.log('Inserting 20 specific home electrical equipment suppliers (Bulb, Fan, Switch Board, Wires, Wiring Pipes)...');
    const insertedSuppliers = [];
    for (const supData of homeElectricalSuppliers) {
      const supplier = new Supplier(supData);
      await supplier.save();
      insertedSuppliers.push(supplier);
    }
    console.log(`Successfully added ${insertedSuppliers.length} new suppliers.`);

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
