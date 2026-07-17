import ReferralPerson from '../models/ReferralPerson.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getAllReferrals = catchAsync(async (req, res, next) => {
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

  const referrals = await ReferralPerson.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ReferralPerson.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: referrals.length, 
    data: { referrals },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getReferralById = catchAsync(async (req, res, next) => {
  const referral = await ReferralPerson.findById(req.params.id);
  if (!referral) return next(new AppError('No referral person found with that ID', 404));
  res.status(200).json({ status: 'success', data: { referral } });
});

export const createReferral = catchAsync(async (req, res, next) => {
  const newReferral = await ReferralPerson.create(req.body);
  res.status(201).json({ status: 'success', data: { referral: newReferral } });
});

export const updateReferral = catchAsync(async (req, res, next) => {
  const referral = await ReferralPerson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!referral) return next(new AppError('No referral person found with that ID', 404));
  res.status(200).json({ status: 'success', data: { referral } });
});

export const deleteReferral = catchAsync(async (req, res, next) => {
  const referral = await ReferralPerson.findByIdAndDelete(req.params.id);
  if (!referral) return next(new AppError('No referral person found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});

export const markAsPaid = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return next(new AppError('Please provide a valid amount to pay', 400));
  
  const referral = await ReferralPerson.findById(req.params.id);
  if (!referral) return next(new AppError('No referral person found with that ID', 404));
  
  if (referral.totalPaid + amount > referral.totalCommissionEarned) {
    return next(new AppError('Payment amount exceeds earned commission balance', 400));
  }
  
  referral.totalPaid += amount;
  await referral.save();
  
  res.status(200).json({ status: 'success', data: { referral } });
});
