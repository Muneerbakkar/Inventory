import express from 'express';
import {
  getAdjustmentHistory,
  createAdjustment,
} from '../controllers/stock.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Purchases.read'), getAdjustmentHistory)
  .post(hasPermission('Purchases.create'), createAdjustment);

export default router;
