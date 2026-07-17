import Quotation from '../models/Quotation.js';
import Counter from '../models/Counter.js';
import CompanySettings from '../models/CompanySettings.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { processInvoiceCreation } from './salesController.js';

export const generateQuotationNumber = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let startYear, endYear;
  if (month >= 3) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyString = `${startYear}-${endYear.toString().slice(-2)}`;
  const counterId = `qt_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `QT/${fyString}/${seqStr}`;
};

export const createQuotation = catchAsync(async (req, res, next) => {
  const { items, customerId, validTillDate, subTotal, totalGst, roundOff, grandTotal } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Quotation must contain at least one item', 400));
  }

  const quotationNumber = await generateQuotationNumber();

  const newQuotation = await Quotation.create({
    quotationNumber,
    customerId,
    validTillDate,
    items,
    subTotal: subTotal || 0,
    totalGst: totalGst || 0,
    roundOff: roundOff || 0,
    grandTotal: grandTotal || 0,
  });

  res.status(201).json({ status: 'success', data: { quotation: newQuotation } });
});

import Customer from '../models/Customer.js';

export const getQuotations = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const query = {};

  if (search) {
    const matchingCustomers = await Customer.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    const customerIds = matchingCustomers.map(c => c._id);

    query.$or = [
      { quotationNumber: { $regex: search, $options: 'i' } }
    ];

    if (customerIds.length > 0) {
      query.$or.push({ customerId: { $in: customerIds } });
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

  const quotations = await Quotation.find(query)
    .populate('customerId', 'name phone')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await Quotation.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: quotations.length, 
    data: { quotations },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getQuotationById = catchAsync(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customerId')
    .populate('items.productId');
  if (!quotation) return next(new AppError('No quotation found with that ID', 404));
  
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({ name: 'My Company' });
  }

  res.status(200).json({ status: 'success', data: { quotation, settings } });
});

export const convertToInvoice = catchAsync(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) return next(new AppError('No quotation found with that ID', 404));
  if (quotation.status === 'Converted') {
    return next(new AppError('Quotation is already converted to an invoice', 400));
  }

  const payload = {
    items: quotation.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      gstPercent: item.gstPercent,
      lineTotal: item.lineTotal
    })),
    customerId: quotation.customerId,
    referralId: req.body.referralId || null,
    subTotal: quotation.subTotal,
    totalGst: quotation.totalGst,
    roundOff: quotation.roundOff,
    grandTotal: quotation.grandTotal,
    paymentMode: req.body.paymentMode || 'Cash',
    amountPaid: req.body.amountPaid || 0,
    commissionDetails: req.body.commissionDetails || 0
  };

  try {
    const invoice = await processInvoiceCreation(payload);
    
    // Update quotation status
    quotation.status = 'Converted';
    await quotation.save();

    res.status(200).json({ status: 'success', data: { invoice, quotation } });
  } catch (error) {
    return next(error);
  }
});

export const updateQuotation = catchAsync(async (req, res, next) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!quotation) {
    return next(new AppError('No quotation found with that ID', 404));
  }
  res.status(200).json({ status: 'success', data: { quotation } });
});

export const deleteQuotation = catchAsync(async (req, res, next) => {
  const quotation = await Quotation.findByIdAndDelete(req.params.id);
  if (!quotation) {
    return next(new AppError('No quotation found with that ID', 404));
  }
  res.status(204).json({ status: 'success', data: null });
});

export const updateQuotationStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!status) return next(new AppError('Please provide a status', 400));
  
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    return next(new AppError('No quotation found with that ID', 404));
  }
  
  if (status === 'Converted' && quotation.status !== 'Converted') {
    return next(new AppError('Cannot manually change status to Converted. Please use Convert to Invoice action.', 400));
  }

  quotation.status = status;
  await quotation.save();
  
  res.status(200).json({ status: 'success', data: { quotation } });
});
