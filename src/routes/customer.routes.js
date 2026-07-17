import express from 'express';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerById } from '../controllers/customerController.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllCustomers)
  .post(createCustomer);

router
  .route('/:id')
  .get(getCustomerById)
  .patch(updateCustomer)
  .delete(deleteCustomer);

export default router;
