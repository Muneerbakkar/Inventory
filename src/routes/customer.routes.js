import express from 'express';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerById } from '../controllers/customerController.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Customers.read'), getAllCustomers)
  .post(hasPermission('Customers.create'), createCustomer);

router
  .route('/:id')
  .get(hasPermission('Customers.read'), getCustomerById)
  .patch(hasPermission('Customers.update'), updateCustomer)
  .delete(hasPermission('Customers.delete'), deleteCustomer);

export default router;
