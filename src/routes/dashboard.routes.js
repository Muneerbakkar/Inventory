import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/aggregates', hasPermission('Dashboard.read'), dashboardController.getDashboardAggregates);

export default router;
