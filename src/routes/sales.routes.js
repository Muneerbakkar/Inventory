import express from 'express';
import { createInvoice, getInvoices, getInvoiceById, deleteInvoice, updateInvoice, updatePaymentStatus } from '../controllers/salesController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Sales.read'), getInvoices)
  .post(hasPermission('Sales.create'), createInvoice);

router
  .route('/:id')
  .get(hasPermission('Sales.read'), getInvoiceById)
  .put(hasPermission('Sales.update'), updateInvoice)
  .delete(hasPermission('Sales.delete'), deleteInvoice);

router
  .route('/:id/payment')
  .patch(hasPermission('Sales.update'), updatePaymentStatus);

export default router;
