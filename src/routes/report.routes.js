import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// All reports use VIEW_REPORTS permission

router.get('/sales', hasPermission('Reports.read'), reportController.getSalesReport);
router.get('/purchase', hasPermission('Reports.read'), reportController.getPurchaseReport);
router.get('/stock-valuation', hasPermission('Reports.read'), reportController.getStockValuationReport);
router.get('/gst', hasPermission('Reports.read'), reportController.getGstReport);
router.get('/commission', hasPermission('Reports.read'), reportController.getCommissionReport);

export default router;
