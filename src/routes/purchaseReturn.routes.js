import express from 'express';
import { createPurchaseReturn, getPurchaseReturns, getPurchaseReturnById, updatePurchaseReturn, deletePurchaseReturn } from '../controllers/purchaseReturnController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Purchases.read'), getPurchaseReturns)
  .post(hasPermission('Purchases.create'), createPurchaseReturn);

router
  .route('/:id')
  .get(hasPermission('Purchases.read'), getPurchaseReturnById)
  .put(hasPermission('Purchases.update'), updatePurchaseReturn)
  .delete(hasPermission('Purchases.delete'), deletePurchaseReturn);

export default router;
