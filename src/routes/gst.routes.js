import express from 'express';
import {
  getAllGstSlabs,
  getGstSlab,
  createGstSlab,
  updateGstSlab,
  deleteGstSlab,
} from '../controllers/gst.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in

router
  .route('/')
  .get(getAllGstSlabs)
  .post(restrictTo('SuperAdmin', 'Admin'), createGstSlab);

router
  .route('/:id')
  .get(getGstSlab)
  .patch(restrictTo('SuperAdmin', 'Admin'), updateGstSlab)
  .delete(restrictTo('SuperAdmin', 'Admin'), deleteGstSlab);

export default router;
