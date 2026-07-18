import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app.js';
import { initCronJobs } from './jobs/cronJobs.js';

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('DB connection successful!');
    const { seedRoles } = await import('./config/seedRoles.js');
    await seedRoles();
    initCronJobs();
  });

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
