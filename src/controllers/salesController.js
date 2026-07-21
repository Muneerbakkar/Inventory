import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import ReferralPerson from '../models/ReferralPerson.js';
import CompanySettings from '../models/CompanySettings.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { clearCache } from '../services/redis.service.js';

export const generateInvoiceNumber = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let startYear, endYear;
  if (month >= 3) { // April or later
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyString = `${startYear}-${endYear.toString().slice(-2)}`;
  const counterId = `invoice_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `INV/${fyString}/${seqStr}`;
};

export const processInvoiceCreation = async (payload) => {
  const { items, customerId, referralId, paymentMode, amountPaid, subTotal, totalGst, roundOff, grandTotal, commissionDetails } = payload;

  if (!items || items.length === 0) {
    throw new AppError('Invoice must contain at least one item', 400);
  }

  // 1. Fail fast check
  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  let totalCommission = 0;

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId?.toString() || p._id.toString() === item.productId);
    if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
    if (product.quantity < item.quantity) {
      throw new AppError(`Insufficient stock for product ${product.name}. Required: ${item.quantity}, Available: ${product.quantity}`, 400);
    }
  }

  const deductedItems = [];
  try {
    // 2. Safe stock deduction (Simulated Transaction)
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId?.toString() || p._id.toString() === item.productId);
      
      // Use conditional $gte to ensure atomicity during deduction
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock during deduction for product ${product.name}`);
      }
      
      deductedItems.push({ productId: item.productId, quantity: item.quantity });
      
      if (referralId && product.commissionPerUnit) {
        totalCommission += product.commissionPerUnit * item.quantity;
      }
    }

    // 3. Generate Invoice Number
    const invoiceNumber = await generateInvoiceNumber();

    // 4. Create Invoice using client-provided totals or fallback defaults
    const finalSubTotal = subTotal || 0;
    const finalTotalGst = totalGst || 0;
    const finalRoundOff = roundOff || 0;
    const finalGrandTotal = grandTotal || 0;

    const newInvoice = await Invoice.create({
      invoiceNumber,
      customerId,
      referralId,
      items,
      commissionDetails: commissionDetails || totalCommission,
      subTotal: finalSubTotal,
      totalGst: finalTotalGst,
      roundOff: finalRoundOff,
      grandTotal: finalGrandTotal,
      paymentMode,
      amountPaid
    });

    // 5. Update Referral Person
    if (referralId && (commissionDetails > 0 || totalCommission > 0)) {
      await ReferralPerson.findByIdAndUpdate(referralId, {
        $inc: { totalCommissionEarned: commissionDetails || totalCommission }
      });
    }

    // 6. Invalidate Product Cache
    await clearCache('products*');
    await clearCache('dashboard*');

    return newInvoice;

  } catch (error) {
    // Rollback stock if anything failed after deduction
    for (const item of deductedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity }
      });
    }
    throw new AppError(error.message || 'Transaction failed. Stock rolled back.', 400);
  }
};

export const createInvoice = catchAsync(async (req, res, next) => {
  try {
    const newInvoice = await processInvoiceCreation(req.body);
    res.status(201).json({ status: 'success', data: { invoice: newInvoice } });
  } catch (error) {
    next(error);
  }
});

import Customer from '../models/Customer.js';

export const getInvoices = catchAsync(async (req, res, next) => {
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
      { invoiceNumber: { $regex: search, $options: 'i' } }
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

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name phone')
    .populate('referralId', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await Invoice.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: invoices.length, 
    data: { invoices },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getInvoiceById = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customerId')
    .populate('referralId')
    .populate('items.productId');
  if (!invoice) return next(new AppError('No invoice found with that ID', 404));
  
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({ name: 'My Company' });
  }

  res.status(200).json({ status: 'success', data: { invoice, settings } });
});

export const updateInvoice = catchAsync(async (req, res, next) => {
  const { items, customerId, referralId, paymentMode, amountPaid } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Invoice must contain at least one item', 400));
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('No invoice found with that ID', 404));

  // 1. Rollback old stock
  for (const item of invoice.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: item.quantity }
    });
  }

  // 2. Rollback old referral commission
  if (invoice.referralId && invoice.commissionDetails > 0) {
    await ReferralPerson.findByIdAndUpdate(invoice.referralId, {
      $inc: { totalCommissionEarned: -invoice.commissionDetails }
    });
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  let totalCommission = 0;
  let validationError = null;

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId);
    if (!product) {
      validationError = `Product not found: ${item.productId}`;
      break;
    }
    if (product.quantity < item.quantity) {
      validationError = `Insufficient stock for product ${product.name}. Required: ${item.quantity}, Available: ${product.quantity}`;
      break;
    }
  }

  // If validation fails, we must restore the old invoice state
  if (validationError) {
    for (const item of invoice.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    if (invoice.referralId && invoice.commissionDetails > 0) {
      await ReferralPerson.findByIdAndUpdate(invoice.referralId, {
        $inc: { totalCommissionEarned: invoice.commissionDetails }
      });
    }
    return next(new AppError(validationError, 400));
  }

  const deductedItems = [];
  try {
    // 3. Deduct new stock
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock during deduction for product ${product.name}`);
      }
      
      deductedItems.push({ productId: item.productId, quantity: item.quantity });
      
      if (referralId && product.commissionPerUnit) {
        totalCommission += product.commissionPerUnit * item.quantity;
      }
    }

    // 4. Update Invoice Document
    const finalSubTotal = req.body.subTotal || 0;
    const finalTotalGst = req.body.totalGst || 0;
    const finalRoundOff = req.body.roundOff || 0;
    const finalGrandTotal = req.body.grandTotal || 0;
    const finalCommissionDetails = req.body.commissionDetails || totalCommission;

    invoice.customerId = customerId || null;
    invoice.referralId = referralId || null;
    invoice.items = items;
    invoice.commissionDetails = finalCommissionDetails;
    invoice.subTotal = finalSubTotal;
    invoice.totalGst = finalTotalGst;
    invoice.roundOff = finalRoundOff;
    invoice.grandTotal = finalGrandTotal;
    invoice.paymentMode = paymentMode;
    invoice.amountPaid = amountPaid;
    
    await invoice.save();

    // 5. Apply new Referral Commission
    if (referralId && finalCommissionDetails > 0) {
      await ReferralPerson.findByIdAndUpdate(referralId, {
        $inc: { totalCommissionEarned: finalCommissionDetails }
      });
    }

    await clearCache('products*');
    await clearCache('dashboard*');
    res.status(200).json({ status: 'success', data: { invoice } });

  } catch (error) {
    // If deduction of new items failed, rollback the newly deducted items
    for (const item of deductedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity }
      });
    }
    // And restore the old invoice state since the edit failed
    for (const item of invoice.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    if (invoice.referralId && invoice.commissionDetails > 0) {
      await ReferralPerson.findByIdAndUpdate(invoice.referralId, {
        $inc: { totalCommissionEarned: invoice.commissionDetails }
      });
    }
    return next(new AppError(error.message || 'Transaction failed. Original state restored.', 400));
  }
});

export const deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('No invoice found with that ID', 404));

  // 1. Rollback Stock
  for (const item of invoice.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: item.quantity }
    });
  }

  // 2. Rollback Referral Commission
  if (invoice.referralId && invoice.commissionDetails > 0) {
    await ReferralPerson.findByIdAndUpdate(invoice.referralId, {
      $inc: { totalCommissionEarned: -invoice.commissionDetails }
    });
  }

  // 3. Clear Product Cache
  await clearCache('products*');
  await clearCache('dashboard*');

  // 4. Delete the invoice
  await Invoice.findByIdAndDelete(req.params.id);

  res.status(204).json({ status: 'success', data: null });
});

export const updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { status, amountPaid, paymentMode } = req.body;
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('No invoice found with that ID', 404));

  if (status === 'Paid') {
    invoice.amountPaid = invoice.grandTotal;
  } else if (status === 'Pending') {
    invoice.amountPaid = 0;
  } else if (status === 'Partial' && amountPaid !== undefined) {
    invoice.amountPaid = amountPaid;
  } else if (amountPaid !== undefined) {
    invoice.amountPaid = amountPaid;
  }

  if (paymentMode !== undefined) {
    invoice.paymentMode = paymentMode;
  }

  await invoice.save();
  await clearCache('dashboard*');
  res.status(200).json({ status: 'success', data: { invoice } });
});
