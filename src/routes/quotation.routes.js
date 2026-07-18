import express from 'express';
import { createQuotation, getQuotations, getQuotationById, convertToInvoice, updateQuotation, deleteQuotation, updateQuotationStatus } from '../controllers/quotationController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Quotations.read'), getQuotations)
  .post(hasPermission('Quotations.create'), createQuotation);

router
  .route('/:id')
  .get(hasPermission('Quotations.read'), getQuotationById)
  .put(hasPermission('Quotations.update'), updateQuotation)
  .delete(hasPermission('Quotations.delete'), deleteQuotation);

router.patch('/:id/status', hasPermission('Quotations.update'), updateQuotationStatus);

router.post('/:id/convert', hasPermission('Quotations.create'), convertToInvoice);

export default router;
