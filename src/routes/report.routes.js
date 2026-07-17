import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/sales', restrictTo('SuperAdmin', 'Admin', 'SalesStaff', 'Accountant'), reportController.getSalesReport);
router.get('/purchase', restrictTo('SuperAdmin', 'Admin', 'Accountant'), reportController.getPurchaseReport);
router.get('/stock-valuation', restrictTo('SuperAdmin', 'Admin', 'SalesStaff', 'Accountant', 'WarehouseStaff'), reportController.getStockValuationReport);
router.get('/gst', restrictTo('SuperAdmin', 'Admin', 'Accountant'), reportController.getGstReport);
router.get('/commission', restrictTo('SuperAdmin', 'Admin', 'Accountant'), reportController.getCommissionReport);

export default router;
