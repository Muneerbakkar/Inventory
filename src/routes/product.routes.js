import express from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getUniqueBrands,
} from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllProducts)
  .post(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), createProduct);

router.get('/brands/unique', getUniqueBrands);

router
  .route('/:id')
  .get(getProduct)
  .patch(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), updateProduct)
  .delete(restrictTo('SuperAdmin', 'Admin'), deleteProduct);

export default router;
