import express from 'express';
import {
  getAdjustmentHistory,
  createAdjustment,
} from '../controllers/stock.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAdjustmentHistory)
  .post(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), createAdjustment);

export default router;
