import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(hasPermission('Categories.read'), getAllCategories)
  .post(hasPermission('Categories.create'), createCategory);

router
  .route('/:id')
  .get(hasPermission('Categories.read'), getCategory)
  .patch(hasPermission('Categories.update'), updateCategory)
  .delete(hasPermission('Categories.delete'), deleteCategory);

export default router;
