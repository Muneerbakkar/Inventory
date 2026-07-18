import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('Settings.read'), settingsController.getSettings);
router.put('/', hasPermission('Settings.update'), settingsController.updateSettings);

export default router;
