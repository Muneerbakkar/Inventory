import express from 'express';
import * as auditLogController from '../controllers/auditLog.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('Audit Logs.read'), auditLogController.getAuditLogs);

export default router;
