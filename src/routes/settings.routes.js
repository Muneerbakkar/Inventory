import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', settingsController.getSettings);
router.put('/', restrictTo('SuperAdmin', 'Admin'), settingsController.updateSettings);

export default router;
