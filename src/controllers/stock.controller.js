import StockAdjustment from '../models/StockAdjustment.js';
import Product from '../models/Product.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import mongoose from 'mongoose';

export const getAdjustmentHistory = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { productId } = req.query;

  const query = {};
  if (productId) query.product = productId;

  const adjustments = await StockAdjustment.find(query)
    .populate('product', 'name sku')
    .populate('user', 'name')
    .sort('-date')
    .skip(skip)
    .limit(limit);

  const total = await StockAdjustment.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: adjustments.length,
    data: { adjustments },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
});

export const createAdjustment = catchAsync(async (req, res, next) => {
  const { product, type, quantity, reason, remarks } = req.body;
  
  if (!product || !type || !quantity || !reason) {
    return next(new AppError('Please provide product, type, quantity, and reason', 400));
  }

  // Using a session transaction to ensure consistency between Product stock and Adjustment log
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const prod = await Product.findById(product).session(session);
    if (!prod) {
      throw new AppError('Product not found', 404);
    }

    // Calculate new quantity
    let newQuantity = prod.quantity;
    if (type === 'Add') {
      newQuantity += Number(quantity);
    } else if (type === 'Remove') {
      newQuantity -= Number(quantity);
      if (newQuantity < 0) {
        throw new AppError('Insufficient stock for this removal', 400);
      }
    } else {
      throw new AppError('Invalid adjustment type', 400);
    }

    // Update product
    prod.quantity = newQuantity;
    await prod.save({ session });

    // Create adjustment log
    const adjustment = await StockAdjustment.create([{
      product,
      type,
      quantity,
      reason,
      remarks,
      user: req.user._id // from auth protect middleware
    }], { session });

    await session.commitTransaction();
    
    // Return populated adjustment
    const populatedAdjustment = await StockAdjustment.findById(adjustment[0]._id)
      .populate('product', 'name sku quantity')
      .populate('user', 'name');

    res.status(201).json({ status: 'success', data: { adjustment: populatedAdjustment, newProductQuantity: newQuantity } });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
