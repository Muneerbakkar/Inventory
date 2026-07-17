import Product from '../models/Product.js';
import Category from '../models/Category.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getAllProducts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  
  const query = {};

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }
  
  if (search) {
    const matchingCategories = await Category.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    const categoryIds = matchingCategories.map(c => c._id);

    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];

    if (categoryIds.length > 0) {
      query.$or.push({ category: { $in: categoryIds } });
    }
  }
  
  if (req.query.category) query.category = req.query.category;
  if (req.query.brand) query.brand = req.query.brand;
  if (req.query.supplierId) query.supplierId = req.query.supplierId;

  // For low stock filtering
  if (req.query.stockStatus === 'low') {
    query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  } else if (req.query.stockStatus === 'out') {
    query.quantity = { $lte: 0 };
  }

  const products = await Product.find(query)
    .populate('supplierId', 'name')
    .populate('gstSlabId', 'label totalPercent')
    .populate('category', 'name')
    .skip(skip)
    .limit(limit)
    .sort('-createdAt');
    
  const total = await Product.countDocuments(query);

  let productsData = products;
  
  if (req.user && req.user.role === 'SalesStaff') {
    productsData = products.map(p => {
      const pObj = p.toObject ? p.toObject() : p;
      delete pObj.purchasePrice;
      delete pObj.priceAfterGst;
      return pObj;
    });
  }

  res.status(200).json({
    status: 'success',
    results: productsData.length,
    data: { products: productsData },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('supplierId', 'name')
    .populate('gstSlabId')
    .populate('category', 'name');
    
  if (!product) return next(new AppError('No product found with that ID', 404));

  let productData = product.toObject ? product.toObject() : product;
  
  if (req.user && req.user.role === 'SalesStaff') {
    delete productData.purchasePrice;
    delete productData.priceAfterGst;
  }

  res.status(200).json({ status: 'success', data: { product: productData } });
});

export const createProduct = catchAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body);
  const populatedProduct = await Product.findById(newProduct._id)
    .populate('supplierId', 'name')
    .populate('gstSlabId', 'label totalPercent')
    .populate('category', 'name');
    
  res.status(201).json({ status: 'success', data: { product: populatedProduct } });
});

export const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) return next(new AppError('No product found with that ID', 404));
  
  Object.assign(product, req.body);
  await product.save(); // Using save() instead of findByIdAndUpdate to trigger pre-save hooks (priceAfterGst)

  const updatedProduct = await Product.findById(product._id)
    .populate('supplierId', 'name')
    .populate('gstSlabId', 'label totalPercent')
    .populate('category', 'name');

  res.status(200).json({ status: 'success', data: { product: updatedProduct } });
});

export const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError('No product found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});

export const getUniqueBrands = catchAsync(async (req, res, next) => {
  const brands = await Product.distinct('brand');
  // Filter out falsy or 'Unknown' default if you want, but sorting is good
  const filteredBrands = brands.filter(b => b && b !== 'Unknown').sort();
  
  res.status(200).json({
    status: 'success',
    data: { brands: filteredBrands },
  });
});

