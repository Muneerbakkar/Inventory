import express from 'express';
import { getAllSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all supplier routes
router.use(protect);

router
  .route('/')
  .get(getAllSuppliers)
  .post(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), createSupplier);

router
  .route('/:id')
  .get(getSupplier)
  .put(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), updateSupplier)
  .delete(restrictTo('SuperAdmin', 'Admin'), deleteSupplier);

export default router;
