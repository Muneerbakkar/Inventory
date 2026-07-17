import GstSlab from '../models/GstSlab.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getAllGstSlabs = catchAsync(async (req, res, next) => {
  const slabs = await GstSlab.find().sort('totalPercent');

  res.status(200).json({
    status: 'success',
    results: slabs.length,
    data: { slabs },
  });
});

export const getGstSlab = catchAsync(async (req, res, next) => {
  const slab = await GstSlab.findById(req.params.id);
  if (!slab) return next(new AppError('No GST slab found with that ID', 404));

  res.status(200).json({ status: 'success', data: { slab } });
});

export const createGstSlab = catchAsync(async (req, res, next) => {
  const newSlab = await GstSlab.create(req.body);
  res.status(201).json({ status: 'success', data: { slab: newSlab } });
});

export const updateGstSlab = catchAsync(async (req, res, next) => {
  const slab = await GstSlab.findById(req.params.id);
  
  if (!slab) return next(new AppError('No GST slab found with that ID', 404));
  
  Object.assign(slab, req.body);
  await slab.save(); // Using save() to trigger pre-validate hook for totalPercent

  res.status(200).json({ status: 'success', data: { slab } });
});

export const deleteGstSlab = catchAsync(async (req, res, next) => {
  const slab = await GstSlab.findByIdAndDelete(req.params.id);
  if (!slab) return next(new AppError('No GST slab found with that ID', 404));

  res.status(204).json({ status: 'success', data: null });
});
