import express from 'express';
import * as roleController from '../controllers/role.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Allow users to get permissions list, but protect role CRUD
router.get('/permissions', hasPermission('Roles.read'), roleController.getPermissionsList);

// Check manage_roles permission for all role CRUD

router
  .route('/')
  .get(hasPermission('Roles.read'), roleController.getAllRoles)
  .post(hasPermission('Roles.create'), roleController.createRole);

router
  .route('/:id')
  .get(hasPermission('Roles.read'), roleController.getRole)
  .patch(hasPermission('Roles.update'), roleController.updateRole)
  .delete(hasPermission('Roles.delete'), roleController.deleteRole);

export default router;
