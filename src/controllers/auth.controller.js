import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { signToken, signRefreshToken } from '../utils/jwt.js';

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Use findByIdAndUpdate so we ONLY update refreshToken.
  // Using user.save() risks wiping the password field if it was unset in memory.
  await User.findByIdAndUpdate(user._id, { refreshToken }, { validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, {
    expires: new Date(Date.now() + process.env.JWT_REFRESH_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

export const register = catchAsync(async (req, res, next) => {
  // Only for initial setup or admin use, usually this is protected
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    role: req.body.role || 'WarehouseStaff',
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account is inactive. Please contact admin.', 403));
  }

  createSendToken(user, 200, res);
});

export const logout = catchAsync(async (req, res, next) => {
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  
  if (req.user) {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ status: 'success' });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError('No refresh token provided. Please log in again.', 401));
  }

  const user = await User.findOne({ refreshToken });
  
  if (!user) {
    return next(new AppError('Invalid refresh token. Please log in again.', 401));
  }

  // Verify token expiry
  import('jsonwebtoken').then(jwt => {
    jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return next(new AppError('Refresh token expired or invalid. Please log in again.', 401));
      }
      
      const token = signToken(user._id);
      res.status(200).json({
        status: 'success',
        token,
      });
    });
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  // Prevent password updates here
  if (req.body.password) {
    return next(new AppError('This route is not for password updates. Use /update-password.', 400));
  }

  const allowedFields = ['name', 'phone', 'email'];
  const filteredBody = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) filteredBody[field] = req.body[field];
  });

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res);
});
