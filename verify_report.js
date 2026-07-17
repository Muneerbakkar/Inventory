import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const verify = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const token = jwt.sign({ id: 'some-id' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  // Find a valid user to get real id
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ role: 'SuperAdmin' }) || await User.findOne();
  
  if (!user) {
    console.log("No user found.");
    process.exit(1);
  }

  const realToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  try {
    const res = await fetch('http://localhost:5000/api/reports/sales', {
      headers: { 'Authorization': `Bearer ${realToken}` }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
  
  process.exit(0);
};

verify().catch(console.error);
