import Invoice from '../models/Invoice.js';
import PurchaseBill from '../models/PurchaseBill.js';
import Product from '../models/Product.js';
import catchAsync from '../utils/catchAsync.js';

export const getSalesReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name')
    .skip(skip)
    .limit(limit)
    .sort('-date');
    
  const total = await Invoice.countDocuments(query);

  const aggregation = await Invoice.aggregate([
    { $match: query },
    { $group: { _id: null, totalAmount: { $sum: "$grandTotal" }, totalBalanceDue: { $sum: "$balanceDue" } } }
  ]);
  const summary = aggregation.length > 0 ? aggregation[0] : { totalAmount: 0, totalBalanceDue: 0 };

  res.status(200).json({
    status: 'success',
    data: { invoices, summary },
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

export const getPurchaseReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const purchaseBills = await PurchaseBill.find(query)
    .populate('supplierId', 'name')
    .skip(skip)
    .limit(limit)
    .sort('-date');

  const total = await PurchaseBill.countDocuments(query);

  const aggregation = await PurchaseBill.aggregate([
    { $match: query },
    { $group: { _id: null, totalAmount: { $sum: "$grandTotal" }, totalBalanceDue: { $sum: "$balanceDue" } } }
  ]);
  const summary = aggregation.length > 0 ? aggregation[0] : { totalAmount: 0, totalBalanceDue: 0 };

  res.status(200).json({
    status: 'success',
    data: { purchaseBills, summary },
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

export const getStockValuationReport = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Stock valuation is usually current stock, so date range might not apply unless we track history.
  // Assuming current stock valuation.
  let products = await Product.find()
    .populate('category', 'name')
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments();

  const aggregation = await Product.aggregate([
    { $group: { 
        _id: null, 
        totalValue: { $sum: { $multiply: ["$quantity", "$purchasePrice"] } },
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" }
      } 
    }
  ]);
  const summary = aggregation.length > 0 ? aggregation[0] : { totalValue: 0, totalItems: 0, totalQuantity: 0 };

  if (req.user && req.user.role === 'SalesStaff') {
    products = products.map(p => {
      const pObj = p.toObject ? p.toObject() : p;
      delete pObj.purchasePrice;
      delete pObj.priceAfterGst;
      return pObj;
    });
    delete summary.totalValue;
  }

  res.status(200).json({
    status: 'success',
    data: { products, summary },
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

export const getGstReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name')
    .skip(skip)
    .limit(limit)
    .sort('-date')
    .select('invoiceNumber date customerId subTotal totalGst grandTotal');
  const invoicesTotal = await Invoice.countDocuments(query);

  const purchaseBills = await PurchaseBill.find(query)
    .populate('supplierId', 'name')
    .skip(skip)
    .limit(limit)
    .sort('-date')
    .select('billNumber date supplierId subTotal totalGst grandTotal');
  const purchaseBillsTotal = await PurchaseBill.countDocuments(query);

  const salesAgg = await Invoice.aggregate([
    { $match: query },
    { $group: { _id: null, totalGstCollected: { $sum: "$totalGst" }, totalSalesAmount: { $sum: "$grandTotal" } } }
  ]);
  const purchaseAgg = await PurchaseBill.aggregate([
    { $match: query },
    { $group: { _id: null, totalGstPaid: { $sum: "$totalGst" }, totalPurchaseAmount: { $sum: "$grandTotal" } } }
  ]);

  const summary = {
    totalGstCollected: salesAgg.length > 0 ? salesAgg[0].totalGstCollected : 0,
    totalSalesAmount: salesAgg.length > 0 ? salesAgg[0].totalSalesAmount : 0,
    totalGstPaid: purchaseAgg.length > 0 ? purchaseAgg[0].totalGstPaid : 0,
    totalPurchaseAmount: purchaseAgg.length > 0 ? purchaseAgg[0].totalPurchaseAmount : 0,
  };
  summary.netGstPayable = summary.totalGstCollected - summary.totalGstPaid;

  res.status(200).json({
    status: 'success',
    data: {
      salesGst: invoices,
      purchaseGst: purchaseBills,
      summary
    },
    pagination: {
      salesTotal: invoicesTotal,
      purchaseTotal: purchaseBillsTotal,
      page: parseInt(page),
      pages: Math.max(Math.ceil(invoicesTotal / limit), Math.ceil(purchaseBillsTotal / limit))
    }
  });
});

export const getCommissionReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = { commissionDetails: { $gt: 0 } };
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name')
    .populate('referralId', 'name')
    .skip(skip)
    .limit(limit)
    .sort('-date')
    .select('invoiceNumber date customerId referralId grandTotal commissionDetails');

  const total = await Invoice.countDocuments(query);

  const aggregation = await Invoice.aggregate([
    { $match: query },
    { $group: { _id: null, totalCommissionPaid: { $sum: "$commissionDetails" }, totalSalesWithCommission: { $sum: "$grandTotal" } } }
  ]);
  const summary = aggregation.length > 0 ? aggregation[0] : { totalCommissionPaid: 0, totalSalesWithCommission: 0 };

  res.status(200).json({
    status: 'success',
    data: { invoices, summary },
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});
