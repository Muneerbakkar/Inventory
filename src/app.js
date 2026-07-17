import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import AppError from './utils/appError.js';
import globalErrorHandler from './middlewares/error.middleware.js';

import authRouter from './routes/auth.routes.js';
import supplierRouter from './routes/supplier.routes.js';
import userRouter from './routes/user.routes.js';
import gstRouter from './routes/gst.routes.js';
import productRouter from './routes/product.routes.js';
import stockRouter from './routes/stock.routes.js';
import categoryRouter from './routes/category.routes.js';
import customerRouter from './routes/customer.routes.js';
import referralRouter from './routes/referral.routes.js';
import salesRouter from './routes/sales.routes.js';
import purchaseRouter from './routes/purchase.routes.js';
import purchaseReturnRouter from './routes/purchaseReturn.routes.js';
import debitNoteRouter from './routes/debitNote.routes.js';
import quotationRouter from './routes/quotation.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import reportRouter from './routes/report.routes.js';
import settingsRouter from './routes/settings.routes.js';
import notificationRouter from './routes/notification.routes.js';
import auditLogRouter from './routes/auditLog.routes.js';

const app = express();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 2) ROUTES
app.use('/api/auth', authRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/users', userRouter);
app.use('/api/gst', gstRouter);
app.use('/api/products', productRouter);
app.use('/api/stock-adjustments', stockRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/customers', customerRouter);
app.use('/api/referrals', referralRouter);
app.use('/api/sales', salesRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/purchase-returns', purchaseReturnRouter);
app.use('/api/debit-notes', debitNoteRouter);
app.use('/api/quotations', quotationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/audit-logs', auditLogRouter);

// Base route for health check / welcome message
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Inventory and Billing API!',
  });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
