import express from 'express';
import { createPurchaseBill, getPurchaseBills, getPurchaseBillById, updatePurchasePaymentStatus, deletePurchaseBill, updatePurchaseBill } from '../controllers/purchaseController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Purchases.read'), getPurchaseBills)
  .post(hasPermission('Purchases.create'), createPurchaseBill);

router
  .route('/:id')
  .get(hasPermission('Purchases.read'), getPurchaseBillById)
  .put(hasPermission('Purchases.update'), updatePurchaseBill)
  .delete(hasPermission('Purchases.delete'), deletePurchaseBill);

router
  .route('/:id/payment')
  .patch(hasPermission('Purchases.update'), updatePurchasePaymentStatus);

export default router;
