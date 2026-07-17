import express from 'express';
import { createPurchaseBill, getPurchaseBills, getPurchaseBillById, updatePurchasePaymentStatus, deletePurchaseBill, updatePurchaseBill } from '../controllers/purchaseController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPurchaseBills)
  .post(createPurchaseBill);

router
  .route('/:id')
  .get(getPurchaseBillById)
  .put(updatePurchaseBill)
  .delete(deletePurchaseBill);

router
  .route('/:id/payment')
  .patch(updatePurchasePaymentStatus);

export default router;
