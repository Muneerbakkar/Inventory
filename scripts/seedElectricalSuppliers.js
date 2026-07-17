import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Supplier from '../src/models/Supplier.js';
import Product from '../src/models/Product.js';

const electricalSuppliers = [
  { name: 'ElectroVolt Enterprises', phone: '9876543101', address: { street: 'Industrial Estate Block A', city: 'Mumbai', state: 'Maharashtra', pincode: '400072' }, gstNumber: '27ABCDE4321F1Z1', gstType: 'Regular', notes: 'Voltmeters, industrial cables, and conductors' },
  { name: 'SparkCore Cables Ltd', phone: '9876543102', address: { street: 'Subway Industrial Ave', city: 'Pune', state: 'Maharashtra', pincode: '411026' }, gstNumber: '27FGHIJ8765K1Z2', gstType: 'Regular', notes: 'High tension cables and domestic wiring' },
  { name: 'TeslaTech Transformers', phone: '9876543103', address: { street: 'MG Road Phase 2', city: 'Bengaluru', state: 'Karnataka', pincode: '560025' }, gstNumber: '29LMNOP2109Q1Z3', gstType: 'Regular', notes: 'Distribution transformers and stabilizers' },
  { name: 'AmpereSwitch Controls', phone: '9876543104', address: { street: 'Electronic City Phase 1', city: 'Bengaluru', state: 'Karnataka', pincode: '560100' }, gstNumber: '29RSTUV6543W1Z4', gstType: 'Composition', notes: 'Switchgears, MCBs, and distribution boards' },
  { name: 'Lumina Lighting Solutions', phone: '9876543105', address: { street: 'GIDC Highway Road', city: 'Surat', state: 'Gujarat', pincode: '395003' }, gstNumber: '24WXYZA0987A1Z5', gstType: 'Regular', notes: 'Industrial LED lights and control panels' },
  { name: 'WattShield Surge Protectors', phone: '9876543106', address: { street: 'Sarkhej Highway', city: 'Ahmedabad', state: 'Gujarat', pincode: '380054' }, gstNumber: '24BCDEF5432G1Z6', gstType: 'Regular', notes: 'Surge protection and lightning arrestors' },
  { name: 'PowerGrid Switchgear Corp', phone: '9876543107', address: { street: 'MIDC Area', city: 'Nagpur', state: 'Maharashtra', pincode: '440016' }, gstNumber: '27HIJKL9876M1Z7', gstType: 'Regular', notes: 'Isolators and vacuum circuit breakers' },
  { name: 'Dynamo Generators & Co', phone: '9876543108', address: { street: 'Industrial Estate Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600032' }, gstNumber: '33NOPQR4321S1Z8', gstType: 'Regular', notes: 'Diesel generators and alternators' },
  { name: 'JouleFuse Electric', phone: '9876543109', address: { street: 'Mount Road Extension', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' }, gstNumber: '33TUVWX8765Y1Z9', gstType: 'Composition', notes: 'HRC fuses and terminal blocks' },
  { name: 'OhmLink Earthing Systems', phone: '9876543110', address: { street: 'Okhla Phase 3', city: 'New Delhi', state: 'Delhi', pincode: '110020' }, gstNumber: '07ZABCD2109E1ZA', gstType: 'Regular', notes: 'Copper earthing plates and chemical compounds' },
  { name: 'CircuitSafe Breakers', phone: '9876543111', address: { street: 'Connaught Place Sec B', city: 'New Delhi', state: 'Delhi', pincode: '110001' }, gstNumber: '07FGHIJ6543K1ZB', gstType: 'Regular', notes: 'Air circuit breakers and leakage relays' },
  { name: 'VoltMaster Stabilizers', phone: '9876543112', address: { street: 'Salt Lake Sec 5', city: 'Kolkata', state: 'West Bengal', pincode: '700091' }, gstNumber: '19LMNOP0987Q1ZC', gstType: 'Regular', notes: 'Servo voltage stabilizers and UPS units' },
  { name: 'ConduitPipe Plastics', phone: '9876543113', address: { street: 'Park Street Cross', city: 'Kolkata', state: 'West Bengal', pincode: '700016' }, gstNumber: '19RSTUV5432W1ZD', gstType: 'Composition', notes: 'PVC conduits and flexible steel pipes' },
  { name: 'Radiant Solar Panels', phone: '9876543114', address: { street: 'Somajiguda Main Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500082' }, gstNumber: '36WXYZA9876A1ZE', gstType: 'Regular', notes: 'Solar PV modules and controllers' },
  { name: 'SmartCap Capacitors', phone: '9876543115', address: { street: 'Hitech City Lane 3', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }, gstNumber: '36BCDEF2345G1ZF', gstType: 'Regular', notes: 'Power factor correction capacitor panels' },
  { name: 'Helix Winding Wires', phone: '9876543116', address: { street: 'InfoPark Phase 2', city: 'Kochi', state: 'Kerala', pincode: '682030' }, gstNumber: '32HIJKL6789M1ZG', gstType: 'Regular', notes: 'Copper winding wires and insulation films' },
  { name: 'ThermoRelay Switch Co', phone: '9876543117', address: { street: 'MG Road Junction', city: 'Ernakulam', state: 'Kerala', pincode: '682011' }, gstNumber: '32NOPQR1234S1ZH', gstType: 'Regular', notes: 'Thermal overload relays and contactors' },
  { name: 'FluxMeter Testers', phone: '9876543118', address: { street: 'Industrial Estate Sec 1', city: 'Indore', state: 'Madhya Pradesh', pincode: '452003' }, gstNumber: '23TUVWX5678Y1ZI', gstType: 'Composition', notes: 'Electrical insulation and multimeters' },
  { name: 'DeltaBusbar Systems', phone: '9876543119', address: { street: 'New Palasia Road', city: 'Indore', state: 'Madhya Pradesh', pincode: '452018' }, gstNumber: '23ZABCD9012E1ZJ', gstType: 'Regular', notes: 'Copper and aluminum busbar tracks' },
  { name: 'NeoGlow Neon Indicators', phone: '9876543120', address: { street: 'Tonk Road Crossing', city: 'Jaipur', state: 'Rajasthan', pincode: '302018' }, gstNumber: '08FGHIJ3456K1ZK', gstType: 'Regular', notes: 'Neon indicator lamps, buzzers, and warning sirens' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old suppliers
    console.log('Clearing old suppliers data...');
    const deleteRes = await Supplier.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old suppliers.`);

    // 2. Insert new electrical suppliers
    console.log('Inserting 20 unique electrical equipment suppliers...');
    const insertedSuppliers = await Supplier.insertMany(electricalSuppliers);
    console.log(`Successfully added ${insertedSuppliers.length} new electrical suppliers.`);

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
