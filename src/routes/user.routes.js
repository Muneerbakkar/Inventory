import express from 'express';
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  updateUserPassword,
} from '../controllers/user.controller.js';
import { protect, hasPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(hasPermission('Users.read'), getAllUsers).post(hasPermission('Users.create'), createUser);
router.route('/:id').get(hasPermission('Users.read'), getUser).patch(hasPermission('Users.update'), updateUser).delete(hasPermission('Users.delete'), deleteUser);
router.patch('/:id/toggle-status', hasPermission('Users.update'), toggleUserStatus);
router.patch('/:id/password', hasPermission('Users.update'), updateUserPassword);

export default router;
