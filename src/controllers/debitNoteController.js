import DebitNote from '../models/DebitNote.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { generateDebitNoteNumber } from './purchaseReturnController.js'; // Reuse the generator

import Supplier from '../models/Supplier.js';

export const getDebitNotes = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const query = {};

  if (search) {
    const matchingSuppliers = await Supplier.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    const supplierIds = matchingSuppliers.map(s => s._id);

    query.$or = [
      { noteNumber: { $regex: search, $options: 'i' } }
    ];

    if (supplierIds.length > 0) {
      query.$or.push({ supplierId: { $in: supplierIds } });
    }
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const notes = await DebitNote.find(query)
    .populate('supplierId', 'name phone')
    .populate('relatedReturnId', 'returnNumber')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await DebitNote.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: notes.length, 
    data: { debitNotes: notes },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getDebitNoteById = catchAsync(async (req, res, next) => {
  const note = await DebitNote.findById(req.params.id)
    .populate('supplierId')
    .populate('relatedReturnId');
  if (!note) return next(new AppError('No debit note found with that ID', 404));
  res.status(200).json({ status: 'success', data: { debitNote: note } });
});

export const createDebitNote = catchAsync(async (req, res, next) => {
  const noteNumber = await generateDebitNoteNumber();
  const note = await DebitNote.create({
    ...req.body,
    noteNumber,
  });
  res.status(201).json({ status: 'success', data: { debitNote: note } });
});

export const updateDebitNoteStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!['Draft', 'Finalized', 'Settled'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const note = await DebitNote.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!note) return next(new AppError('No debit note found with that ID', 404));

  res.status(200).json({ status: 'success', data: { debitNote: note } });
});

export const deleteDebitNote = catchAsync(async (req, res, next) => {
  const note = await DebitNote.findByIdAndDelete(req.params.id);
  if (!note) return next(new AppError('No debit note found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});
