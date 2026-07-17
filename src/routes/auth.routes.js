import express from 'express';
import { register, login, logout, refreshToken, getMe, updateMe, updatePassword } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

router.use(protect);
router.get('/me', getMe);
router.patch('/update-me', updateMe);
router.patch('/update-password', updatePassword);

export default router;
