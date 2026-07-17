import Category from '../models/Category.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { getCachedData, setCachedData, clearCache } from '../services/redis.service.js';

export const getAllCategories = catchAsync(async (req, res, next) => {
  const isPaginated = req.query.pagination !== 'false';
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
      { description: { $regex: search, $options: 'i' } }
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

  const cacheKey = `categories:${page}:${limit}:${search}:${isPaginated}:${startDate || ''}:${endDate || ''}`;
  const cachedCategories = await getCachedData(cacheKey);

  if (cachedCategories) {
    return res.status(200).json(cachedCategories);
  }

  let dbQuery = Category.find(query).populate('parentCategory', 'name').sort('name');
  if (isPaginated) {
    dbQuery = dbQuery.skip(skip).limit(limit);
  }
  
  const categories = await dbQuery;
  const total = await Category.countDocuments(query);

  const responseData = {
    status: 'success',
    results: categories.length,
    data: { categories },
  };

  if (isPaginated) {
    responseData.pagination = {
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  await setCachedData(cacheKey, responseData, 300);

  res.status(200).json(responseData);
});

export const getCategory = catchAsync(async (req, res, next) => {
  const cacheKey = `category:${req.params.id}`;
  const cachedCategory = await getCachedData(cacheKey);

  if (cachedCategory) {
    return res.status(200).json(cachedCategory);
  }

  const category = await Category.findById(req.params.id).populate('parentCategory', 'name');

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  const responseData = {
    status: 'success',
    data: { category }
  };

  await setCachedData(cacheKey, responseData, 300);

  res.status(200).json(responseData);
});

export const createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);

  await clearCache('categories:*');

  res.status(201).json({
    status: 'success',
    data: { category: newCategory }
  });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  await clearCache('categories:*');
  await clearCache(`category:${req.params.id}`);

  res.status(200).json({
    status: 'success',
    data: { category }
  });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  await clearCache('categories:*');
  await clearCache(`category:${req.params.id}`);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
