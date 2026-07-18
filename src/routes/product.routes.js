import express from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getUniqueBrands,
} from '../controllers/product.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Products.read'), getAllProducts)
  .post(hasPermission('Products.create'), createProduct);

router.get('/brands/unique', hasPermission('Products.read'), getUniqueBrands);

router
  .route('/:id')
  .get(hasPermission('Products.read'), getProduct)
  .patch(hasPermission('Products.update'), updateProduct)
  .delete(hasPermission('Products.delete'), deleteProduct);

export default router;
