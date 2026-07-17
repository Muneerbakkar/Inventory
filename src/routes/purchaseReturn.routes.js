import express from 'express';
import { createPurchaseReturn, getPurchaseReturns, getPurchaseReturnById, updatePurchaseReturn, deletePurchaseReturn } from '../controllers/purchaseReturnController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPurchaseReturns)
  .post(createPurchaseReturn);

router
  .route('/:id')
  .get(getPurchaseReturnById)
  .put(updatePurchaseReturn)
  .delete(deletePurchaseReturn);

export default router;
