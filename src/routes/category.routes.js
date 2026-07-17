import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllCategories)
  .post(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .patch(restrictTo('SuperAdmin', 'Admin', 'WarehouseStaff'), updateCategory)
  .delete(restrictTo('SuperAdmin', 'Admin'), deleteCategory);

export default router;
