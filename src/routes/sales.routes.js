import express from 'express';
import { createInvoice, getInvoices, getInvoiceById, deleteInvoice, updateInvoice, updatePaymentStatus } from '../controllers/salesController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getInvoices)
  .post(createInvoice);

router
  .route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router
  .route('/:id/payment')
  .patch(updatePaymentStatus);

export default router;
