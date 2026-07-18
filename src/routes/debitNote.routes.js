import express from 'express';
import { getDebitNotes, getDebitNoteById, createDebitNote, updateDebitNoteStatus, deleteDebitNote } from '../controllers/debitNoteController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Purchases.read'), getDebitNotes)
  .post(hasPermission('Purchases.create'), createDebitNote);

router
  .route('/:id')
  .get(hasPermission('Purchases.read'), getDebitNoteById)
  .patch(hasPermission('Purchases.update'), updateDebitNoteStatus)
  .delete(hasPermission('Purchases.delete'), deleteDebitNote);

export default router;
