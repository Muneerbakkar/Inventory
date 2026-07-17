import express from 'express';
import { getDebitNotes, getDebitNoteById, createDebitNote, updateDebitNoteStatus, deleteDebitNote } from '../controllers/debitNoteController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDebitNotes)
  .post(createDebitNote);

router
  .route('/:id')
  .get(getDebitNoteById)
  .patch(updateDebitNoteStatus)
  .delete(deleteDebitNote);

export default router;
