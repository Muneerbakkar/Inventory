import PurchaseReturn from '../models/PurchaseReturn.js';
import DebitNote from '../models/DebitNote.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import CompanySettings from '../models/CompanySettings.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { clearCache } from '../services/redis.service.js';

export const generateReturnNumber = async () => {
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
  const counterId = `pr_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `PR/${fyString}/${seqStr}`;
};

export const generateDebitNoteNumber = async () => {
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
  const counterId = `dn_${fyString}`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(4, '0');
  return `DN/${fyString}/${seqStr}`;
};

export const createPurchaseReturn = catchAsync(async (req, res, next) => {
  const { items, supplierId, originalBillId, subTotal, totalGst, roundOff, grandTotal } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Purchase Return must contain at least one item', 400));
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId);
    if (!product) return next(new AppError(`Product not found: ${item.productId}`, 404));
    if (product.quantity < item.quantity) {
      return next(new AppError(`Insufficient stock for product ${product.name} to return. Available: ${product.quantity}, Returning: ${item.quantity}`, 400));
    }
  }

  const deductedItems = [];
  try {
    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      if (!updatedProduct) {
        throw new Error(`Insufficient stock during deduction for product ${item.productId}`);
      }
      deductedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    const returnNumber = await generateReturnNumber();
    const newReturn = await PurchaseReturn.create({
      returnNumber,
      supplierId,
      originalBillId,
      items,
      subTotal: subTotal || 0,
      totalGst: totalGst || 0,
      roundOff: roundOff || 0,
      grandTotal: grandTotal || 0,
    });

    // Auto-create Debit Note Draft
    const debitNoteNumber = await generateDebitNoteNumber();
    const newDebitNote = await DebitNote.create({
      noteNumber: debitNoteNumber,
      supplierId,
      relatedReturnId: newReturn._id,
      amount: newReturn.grandTotal,
      reason: `Auto-generated draft for Purchase Return ${returnNumber}`,
      status: 'Draft'
    });

    await clearCache('products*');
    res.status(201).json({ status: 'success', data: { purchaseReturn: newReturn, debitNote: newDebitNote } });

  } catch (error) {
    for (const item of deductedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity }
      });
    }
    return next(new AppError(error.message || 'Transaction failed. Stock rolled back.', 400));
  }
});

import Supplier from '../models/Supplier.js';

export const getPurchaseReturns = catchAsync(async (req, res, next) => {
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
      { returnNumber: { $regex: search, $options: 'i' } }
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

  const returns = await PurchaseReturn.find(query)
    .populate('supplierId', 'name phone')
    .populate('originalBillId', 'billNumber')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });

  const total = await PurchaseReturn.countDocuments(query);

  res.status(200).json({ 
    status: 'success', 
    results: returns.length, 
    data: { purchaseReturns: returns },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getPurchaseReturnById = catchAsync(async (req, res, next) => {
  const pr = await PurchaseReturn.findById(req.params.id)
    .populate('supplierId')
    .populate('originalBillId')
    .populate('items.productId');
  if (!pr) return next(new AppError('No purchase return found with that ID', 404));
  
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({ name: 'My Company' });
  }

  res.status(200).json({ status: 'success', data: { purchaseReturn: pr, settings } });
});

export const updatePurchaseReturn = catchAsync(async (req, res, next) => {
  const { items, supplierId, originalBillId, subTotal, totalGst, roundOff, grandTotal } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Purchase Return must contain at least one item', 400));
  }

  const pr = await PurchaseReturn.findById(req.params.id);
  if (!pr) return next(new AppError('No purchase return found with that ID', 404));

  // 1. Rollback old stock (add returned stock back to inventory)
  for (const item of pr.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: item.quantity }
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
    if (product.quantity < item.quantity) {
      validationError = `Insufficient stock for product ${product.name} to return. Available: ${product.quantity}, Returning: ${item.quantity}`;
      break;
    }
  }

  if (validationError) {
    // Restore old stock
    for (const item of pr.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    return next(new AppError(validationError, 400));
  }

  const deductedItems = [];
  try {
    // 2. Deduct new stock
    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      if (!updatedProduct) {
        throw new Error(`Insufficient stock during deduction for product ${item.productId}`);
      }
      deductedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    // 3. Update PR Document
    pr.supplierId = supplierId || pr.supplierId;
    pr.originalBillId = originalBillId || pr.originalBillId;
    pr.items = items;
    pr.subTotal = subTotal || 0;
    pr.totalGst = totalGst || 0;
    pr.roundOff = roundOff || 0;
    pr.grandTotal = grandTotal || 0;
    
    await pr.save();

    // 4. Update Debit Note Amount
    await DebitNote.findOneAndUpdate(
      { relatedReturnId: pr._id },
      { amount: pr.grandTotal }
    );

    await clearCache('products*');
    res.status(200).json({ status: 'success', data: { purchaseReturn: pr } });

  } catch (error) {
    // Rollback the newly deducted items (add them back)
    for (const item of deductedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity }
      });
    }
    // Restore the old PR state (deduct them again)
    for (const item of pr.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    return next(new AppError(error.message || 'Transaction failed. Original state restored.', 400));
  }
});

export const deletePurchaseReturn = catchAsync(async (req, res, next) => {
  const pr = await PurchaseReturn.findById(req.params.id);
  if (!pr) return next(new AppError('No purchase return found with that ID', 404));

  // 1. Rollback stock (add returned stock back to inventory)
  for (const item of pr.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { quantity: item.quantity }
    });
  }

  // 2. Delete corresponding Debit Note
  await DebitNote.findOneAndDelete({ relatedReturnId: pr._id });

  // 3. Delete PR
  await PurchaseReturn.findByIdAndDelete(req.params.id);
  
  await clearCache('products*');
  res.status(204).json({ status: 'success', data: null });
});
