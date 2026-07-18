import express from 'express';
import { getAllReferrals, createReferral, markAsPaid, updateReferral, deleteReferral, getReferralById } from '../controllers/referralController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Customers.read'), getAllReferrals)
  .post(hasPermission('Customers.create'), createReferral);

router.post('/:id/pay', hasPermission('Customers.create'), markAsPaid);
router
  .route('/:id')
  .get(hasPermission('Customers.read'), getReferralById)
  .patch(hasPermission('Customers.update'), updateReferral)
  .delete(hasPermission('Customers.delete'), deleteReferral);

export default router;
