import express from 'express';
import { createQuotation, getQuotations, getQuotationById, convertToInvoice, updateQuotation, deleteQuotation, updateQuotationStatus } from '../controllers/quotationController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getQuotations)
  .post(createQuotation);

router
  .route('/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(deleteQuotation);

router.patch('/:id/status', updateQuotationStatus);

router.post('/:id/convert', convertToInvoice);

export default router;
