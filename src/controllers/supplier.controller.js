import Supplier from '../models/Supplier.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { getCachedData, setCachedData, clearCache } from '../services/redis.service.js';

export const getAllSuppliers = catchAsync(async (req, res, next) => {
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
      { 'address.city': { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
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

  const cacheKey = `suppliers:${page}:${limit}:${search}:${startDate || ''}:${endDate || ''}`;
  const cachedSuppliers = await getCachedData(cacheKey);

  if (cachedSuppliers) {
    return res.status(200).json(cachedSuppliers);
  }

  const suppliers = await Supplier.find(query).skip(skip).limit(limit).sort('-createdAt');
  const total = await Supplier.countDocuments(query);

  const responseData = {
    status: 'success',
    results: suppliers.length,
    data: { suppliers },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  };

  await setCachedData(cacheKey, responseData, 300); // Cache for 5 mins

  res.status(200).json(responseData);
});

export const getSupplier = catchAsync(async (req, res, next) => {
  const cacheKey = `supplier:${req.params.id}`;
  const cachedSupplier = await getCachedData(cacheKey);

  if (cachedSupplier) {
    return res.status(200).json(cachedSupplier);
  }

  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return next(new AppError('No supplier found with that ID', 404));
  }

  const responseData = {
    status: 'success',
    data: { supplier }
  };

  await setCachedData(cacheKey, responseData, 300);

  res.status(200).json(responseData);
});

export const createSupplier = catchAsync(async (req, res, next) => {
  const newSupplier = await Supplier.create(req.body);

  await clearCache('suppliers:*'); // Invalidate list cache

  res.status(201).json({
    status: 'success',
    data: { supplier: newSupplier }
  });
});

export const updateSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!supplier) {
    return next(new AppError('No supplier found with that ID', 404));
  }

  await clearCache('suppliers:*');
  await clearCache(`supplier:${req.params.id}`);

  res.status(200).json({
    status: 'success',
    data: { supplier }
  });
});

export const deleteSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);

  if (!supplier) {
    return next(new AppError('No supplier found with that ID', 404));
  }

  await clearCache('suppliers:*');
  await clearCache(`supplier:${req.params.id}`);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
