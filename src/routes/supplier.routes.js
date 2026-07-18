import express from 'express';
import { getAllSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all supplier routes
router.use(protect);

router
  .route('/')
  .get(hasPermission('Suppliers.read'), getAllSuppliers)
  .post(hasPermission('Suppliers.create'), createSupplier);

router
  .route('/:id')
  .get(hasPermission('Suppliers.read'), getSupplier)
  .put(hasPermission('Suppliers.update'), updateSupplier)
  .delete(hasPermission('Suppliers.delete'), deleteSupplier);

export default router;
