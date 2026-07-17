import Customer from '../models/Customer.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getAllCustomers = catchAsync(async (req, res, next) => {
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
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
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

  const customers = await Customer.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  const total = await Customer.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: customers.length, 
    data: { customers },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getCustomerById = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(new AppError('No customer found with that ID', 404));
  res.status(200).json({ status: 'success', data: { customer } });
});

export const createCustomer = catchAsync(async (req, res, next) => {
  const newCustomer = await Customer.create(req.body);
  res.status(201).json({ status: 'success', data: { customer: newCustomer } });
});

export const updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) return next(new AppError('No customer found with that ID', 404));
  res.status(200).json({ status: 'success', data: { customer } });
});

export const deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return next(new AppError('No customer found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});
