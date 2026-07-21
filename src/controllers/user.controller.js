import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import bcrypt from 'bcrypt';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const users = await User.find(query).skip(skip).limit(limit).sort('-createdAt');
  const total = await User.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(200).json({ status: 'success', data: { user } });
});

export const createUser = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, role, isActive } = req.body;

  const user = await User.create({
    name,
    email,
    phone,
    password, // Pre-save hook will hash this automatically
    role: role || 'WarehouseStaff',
    isActive: isActive !== undefined ? isActive : true,
  });

  // Remove password from response
  user.password = undefined;

  res.status(201).json({ status: 'success', data: { user } });
});

export const updateUser = catchAsync(async (req, res, next) => {
  // Prevent password update through this route
  if (req.body.password) delete req.body.password;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(200).json({ status: 'success', data: { user } });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(204).json({ status: 'success', data: null });
});

export const toggleUserStatus = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));

  // 1. Prevent deactivating self
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot deactivate your own account', 400));
  }

  // 2. Prevent deactivating SuperAdmin
  if (user.role === 'SuperAdmin') {
    return next(new AppError('SuperAdmin status cannot be changed', 400));
  }

  // 3. Admin cannot deactivate another Admin
  if (req.user.role === 'Admin' && user.role === 'Admin') {
    return next(new AppError('Admins cannot deactivate other Admins', 403));
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', data: { user } });
});

export const updateUserPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    return next(new AppError('Please provide a new password', 400));
  }

  const user = await User.findById(req.params.id).select('+password');
  if (!user) return next(new AppError('No user found with that ID', 404));

  user.password = password;
  await user.save(); // triggers the pre('save') hook to hash the new password

  // Remove password from response
  user.password = undefined;

  res.status(200).json({ status: 'success', data: { user } });
});
