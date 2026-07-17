import express from 'express';
import { getAllReferrals, createReferral, markAsPaid, updateReferral, deleteReferral, getReferralById } from '../controllers/referralController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllReferrals)
  .post(createReferral);

router.post('/:id/pay', markAsPaid);
router
  .route('/:id')
  .get(getReferralById)
  .patch(updateReferral)
  .delete(deleteReferral);

export default router;
