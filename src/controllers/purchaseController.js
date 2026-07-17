import PurchaseBill from '../models/PurchaseBill.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import CompanySettings from '../models/CompanySettings.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { clearCache } from '../services/redis.service.js';

const generatePurchaseBillNumber = async () => {
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
  const counterId = `pb_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `PB/${fyString}/${seqStr}`;
};

export const createPurchaseBill = catchAsync(async (req, res, next) => {
  const { items, supplierId, supplierRefNumber, paymentMode, amountPaid } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Purchase Bill must contain at least one item', 400));
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId);
    if (!product) return next(new AppError(`Product not found: ${item.productId}`, 404));
  }

  const addedItems = [];
  try {
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: item.quantity } },
        { new: true }
      );
      if (!updatedProduct) {
        throw new Error(`Failed to increase stock for product ${item.productId}`);
      }
      addedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    const billNumber = await generatePurchaseBillNumber();
    const finalSubTotal = req.body.subTotal || 0;
    const finalTotalGst = req.body.totalGst || 0;
    const finalRoundOff = req.body.roundOff || 0;
    const finalGrandTotal = req.body.grandTotal || 0;

    const newBill = await PurchaseBill.create({
      billNumber,
      supplierId,
      supplierRefNumber,
      items,
      subTotal: finalSubTotal,
      totalGst: finalTotalGst,
      roundOff: finalRoundOff,
      grandTotal: finalGrandTotal,
      paymentMode,
      amountPaid: amountPaid || 0
    });

    await clearCache('products*');
    res.status(201).json({ status: 'success', data: { purchaseBill: newBill } });

  } catch (error) {
    for (const item of addedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    return next(new AppError(error.message || 'Transaction failed. Stock rolled back.', 400));
  }
});

import Supplier from '../models/Supplier.js';

export const getPurchaseBills = catchAsync(async (req, res, next) => {
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
      { billNumber: { $regex: search, $options: 'i' } }
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

  const bills = await PurchaseBill.find(query)
    .populate('supplierId', 'name phone')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await PurchaseBill.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: bills.length, 
    data: { purchaseBills: bills },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getPurchaseBillById = catchAsync(async (req, res, next) => {
  const bill = await PurchaseBill.findById(req.params.id)
    .populate('supplierId')
    .populate('items.productId');
  if (!bill) return next(new AppError('No purchase bill found with that ID', 404));
  
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({ name: 'My Company' });
  }

  res.status(200).json({ status: 'success', data: { purchaseBill: bill, settings } });
});

export const updatePurchasePaymentStatus = catchAsync(async (req, res, next) => {
  const { status, amountPaid, paymentMode } = req.body;
  const bill = await PurchaseBill.findById(req.params.id);
  if (!bill) return next(new AppError('No purchase bill found with that ID', 404));

  if (status === 'Paid') {
    bill.amountPaid = bill.grandTotal;
  } else if (status === 'Pending') {
    bill.amountPaid = 0;
  } else if (status === 'Partial' && amountPaid !== undefined) {
    bill.amountPaid = amountPaid;
  } else if (amountPaid !== undefined) {
    bill.amountPaid = amountPaid;
  }

  if (paymentMode !== undefined) {
    bill.paymentMode = paymentMode;
  }

  await bill.save();
  res.status(200).json({ status: 'success', data: { purchaseBill: bill } });
});

export const deletePurchaseBill = catchAsync(async (req, res, next) => {
  const bill = await PurchaseBill.findById(req.params.id);
  if (!bill) return next(new AppError('No purchase bill found with that ID', 404));

  // Rollback stock
  for (const item of bill.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: -item.quantity }
    });
  }

  await clearCache('products*');
  await PurchaseBill.findByIdAndDelete(req.params.id);

  res.status(204).json({ status: 'success', data: null });
});

export const updatePurchaseBill = catchAsync(async (req, res, next) => {
  const { items, supplierId, supplierRefNumber, paymentMode, amountPaid } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Purchase Bill must contain at least one item', 400));
  }

  const bill = await PurchaseBill.findById(req.params.id);
  if (!bill) return next(new AppError('No purchase bill found with that ID', 404));

  // 1. Rollback old stock (reduce stock that was previously added)
  for (const item of bill.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: -item.quantity }
    });
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  let validationError = null;
  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId);
    if (!product) {
      validationError = `Product not found: ${item.productId}`;
      break;
    }
  }

  if (validationError) {
    // Restore old stock
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity }
      });
    }
    return next(new AppError(validationError, 400));
  }

  const addedItems = [];
  try {
    // 2. Apply new stock
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`Failed to increase stock for product ${item.productId}`);
      }
      addedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    // 3. Update Bill Document
    const finalSubTotal = req.body.subTotal || 0;
    const finalTotalGst = req.body.totalGst || 0;
    const finalRoundOff = req.body.roundOff || 0;
    const finalGrandTotal = req.body.grandTotal || 0;

    bill.supplierId = supplierId || bill.supplierId;
    bill.supplierRefNumber = supplierRefNumber;
    bill.items = items;
    bill.subTotal = finalSubTotal;
    bill.totalGst = finalTotalGst;
    bill.roundOff = finalRoundOff;
    bill.grandTotal = finalGrandTotal;
    bill.paymentMode = paymentMode;
    bill.amountPaid = amountPaid !== undefined ? amountPaid : bill.amountPaid;
    
    await bill.save();

    await clearCache('products*');
    res.status(200).json({ status: 'success', data: { purchaseBill: bill } });

  } catch (error) {
    // Rollback the newly added items
    for (const item of addedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    // Restore the old bill state
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity }
      });
    }
    return next(new AppError(error.message || 'Transaction failed. Original state restored.', 400));
  }
});
