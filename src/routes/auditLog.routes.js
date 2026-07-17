import express from 'express';
import * as auditLogController from '../controllers/auditLog.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('SuperAdmin')); // Only SuperAdmin can view Audit Logs

router.get('/', auditLogController.getAuditLogs);

export default router;
