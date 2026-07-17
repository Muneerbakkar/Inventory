import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Customer from '../src/models/Customer.js';
import Invoice from '../src/models/Invoice.js';

const mockCustomers = [
  { name: 'Rajan Electrical Contractors', phone: '9876543401', email: 'rajan.electric@example.com', address: '42, Industrial Area Phase 1, Mumbai, Maharashtra' },
  { name: 'Verma Electricians & Wiremen', phone: '9876543402', email: 'verma.wires@example.com', address: 'B-12, Sector 15, Noida, Uttar Pradesh' },
  { name: 'BuildSafe Builders & Developers', phone: '9876543403', email: 'procurement@buildsafe.com', address: 'BuildSafe Tower, MG Road, Bengaluru, Karnataka' },
  { name: 'Royal Lights & Electricals', phone: '9876543404', email: 'royal.lights@example.com', address: '105, Avenue Road, Bengaluru, Karnataka' },
  { name: 'Sharma Home Wiring Services', phone: '9876543405', email: 'sharma.wiring@example.com', address: 'Shop 4, GIDC Market, Surat, Gujarat' },
  { name: 'Modern Interiors & Decor', phone: '9876543406', email: 'design@moderninteriors.com', address: 'Sarkhej Gandhinagar Hwy, Ahmedabad, Gujarat' },
  { name: 'Elite Cable Laying Services', phone: '9876543407', email: 'elite.cables@example.com', address: 'Block D, Ring Road, Nagpur, Maharashtra' },
  { name: 'Apex Electrical Retailers', phone: '9876543408', email: 'apex.retail@example.com', address: 'Shop 22, Electrical Market, Chennai, Tamil Nadu' },
  { name: 'K.P. Electrical Services', phone: '9876543409', email: 'kp.electric@example.com', address: '12, Anna Salai, Chennai, Tamil Nadu' },
  { name: 'Metro Conduit Installers', phone: '9876543410', email: 'metro.conduits@example.com', address: 'A-9, Okhla Industrial Area, New Delhi, Delhi' },
  { name: 'Gupta Electric Store', phone: '9876543411', email: 'gupta.electric@example.com', address: 'Shop 104, Connaught Place, New Delhi, Delhi' },
  { name: 'Pioneer Smart Home Automation', phone: '9876543412', email: 'pioneer.smart@example.com', address: 'Sector 5, Salt Lake, Kolkata, West Bengal' },
  { name: 'BlueSky Electrical Works', phone: '9876543413', email: 'bluesky.works@example.com', address: '14, Park Street, Kolkata, West Bengal' },
  { name: 'Vinay Electricals & Hardware', phone: '9876543414', email: 'vinay.hardware@example.com', address: 'Shop 9, Somajiguda, Hyderabad, Telangana' },
  { name: 'Kumar Wiremen & Partners', phone: '9876543415', email: 'kumar.wiremen@example.com', address: 'Hitech City Road, Hyderabad, Telangana' },
  { name: 'CityLine Infrastructure Ltd', phone: '9876543416', email: 'purchase@citylineinfra.com', address: 'CityLine Plaza, InfoPark, Kochi, Kerala' },
  { name: 'GlowZone Light House', phone: '9876543417', email: 'glowzone@example.com', address: 'Shop 11, MG Road, Ernakulam, Kerala' },
  { name: 'Perfect Piping Contractors', phone: '9876543418', email: 'perfect.piping@example.com', address: 'Industrial Estate, Indore, Madhya Pradesh' },
  { name: 'Dynamic Switchboard Installers', phone: '9876543419', email: 'dynamic.boards@example.com', address: 'Vijay Nagar Main Road, Indore, Madhya Pradesh' },
  { name: 'Sai Electrical Fittings', phone: '9876543420', email: 'sai.fittings@example.com', address: 'Shop 3, Tonk Road, Jaipur, Rajasthan' },
  { name: 'Unique Wiremen Enterprises', phone: '9876543421', email: 'unique.wires@example.com', address: 'Malviya Nagar Layout, Jaipur, Rajasthan' },
  { name: 'Swift Fan & Vent Services', phone: '9876543422', email: 'swift.fans@example.com', address: '48, GIDC Industrial Estate, Vadodara, Gujarat' },
  { name: 'Balaji Builders & Promoters', phone: '9876543423', email: 'info@balajibuilders.com', address: 'Balaji House, Somajiguda, Hyderabad, Telangana' },
  { name: 'National Electrical Agency', phone: '9876543424', email: 'national.electric@example.com', address: 'Wholesale Market, Lamington Road, Mumbai, Maharashtra' },
  { name: 'Reliable Earthing Contractors', phone: '9876543425', email: 'reliable.earth@example.com', address: 'Block B, Sector 4, Salt Lake, Kolkata, West Bengal' },
  { name: 'SmartWire Contractors', phone: '9876543426', email: 'smartwire@example.com', address: 'Hitech City Phase 2, Hyderabad, Telangana' },
  { name: 'Galaxy Electricals & Co', phone: '9876543427', email: 'galaxy.electric@example.com', address: 'A-15, Okhla Phase 3, New Delhi, Delhi' },
  { name: 'Shiva Electric Works', phone: '9876543428', email: 'shiva.works@example.com', address: 'Shop 7, Main Market, Pune, Maharashtra' },
  { name: 'Matrix Electrical Projects', phone: '9876543429', email: 'projects@matrixelectric.com', address: 'Matrix House, MG Road, Bengaluru, Karnataka' },
  { name: 'BrightHome Wiring Solutions', phone: '9876543430', email: 'brighthome@example.com', address: 'Plot 104, Industrial Layout, Surat, Gujarat' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to DB');

    // 1. Remove all old customers
    console.log('Clearing old customers data...');
    const deleteRes = await Customer.deleteMany({});
    console.log(`Deleted ${deleteRes.deletedCount} old customers.`);

    // 2. Insert new electrical equipment customers
    console.log('Inserting 30 unique home electrical wiring/contractor customers...');
    const insertedCustomers = [];
    for (const custData of mockCustomers) {
      const customer = new Customer(custData);
      await customer.save();
      insertedCustomers.push(customer);
    }
    console.log(`Successfully added ${insertedCustomers.length} new customers.`);

    // 3. Relink existing invoices to new customers to maintain integrity
    console.log('Relinking existing invoices to new customers...');
    const invoices = await Invoice.find();
    if (invoices.length > 0) {
      let relinkedCount = 0;
      for (let i = 0; i < invoices.length; i++) {
        const inv = invoices[i];
        const randomCustomer = insertedCustomers[i % insertedCustomers.length];
        inv.customerId = randomCustomer._id;
        await inv.save();
        relinkedCount++;
      }
      console.log(`Successfully relinked ${relinkedCount} invoices to new customers.`);
    } else {
      console.log('No invoices found to relink.');
    }

    console.log('\nSeeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
