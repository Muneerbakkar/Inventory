import express from 'express';
import {
  getAllGstSlabs,
  getGstSlab,
  createGstSlab,
  updateGstSlab,
  deleteGstSlab,
} from '../controllers/gst.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // Ensure user is logged in

router
  .route('/')
  .get(hasPermission('GST.read'), getAllGstSlabs)
  .post(hasPermission('GST.create'), createGstSlab);

router
  .route('/:id')
  .get(hasPermission('GST.read'), getGstSlab)
  .patch(hasPermission('GST.update'), updateGstSlab)
  .delete(hasPermission('GST.delete'), deleteGstSlab);

export default router;
