import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import PurchaseBill from '../models/PurchaseBill.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import AuditLog from '../models/AuditLog.js';
import catchAsync from '../utils/catchAsync.js';
import { getCachedData, setCachedData } from '../services/redis.service.js';

export const getDashboardAggregates = catchAsync(async (req, res, next) => {
  const { startDate, endDate, allTime } = req.query;
  const cacheKey = `dashboard:aggregates:${startDate || ''}:${endDate || ''}:${allTime || ''}`;
  let data = await getCachedData(cacheKey);

  if (!data) {
    const dateFilter = {};
    if (allTime === 'true') {
      // Empty condition, gets all dates
    } else if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    } else {
      // Default: This Month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter.date = { $gte: startOfMonth };
    }

    // Determine end date for the trend (rolling 6 months ending at endDate or today)
    const endTrendDate = endDate ? new Date(endDate) : new Date();
    const sixMonthsAgo = new Date(endTrendDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 1. Stock Value (current state, not filtered by date)
    const stockAggr = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } }
        }
      }
    ]);
    const stockValue = stockAggr[0]?.totalValue || 0;

    // 2. Sales in Period
    const salesAggr = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' }
        }
      }
    ]);
    const salesThisMonth = salesAggr[0]?.totalSales || 0;

    // 3. Purchases in Period
    const purchasesAggr = await PurchaseBill.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: '$grandTotal' }
        }
      }
    ]);
    const purchasesThisMonth = purchasesAggr[0]?.totalPurchases || 0;

    // 4. Outstanding Balances in Period
    const outstandingFilter = { balanceDue: { $gt: 0 } };
    if (dateFilter.date) {
      outstandingFilter.date = dateFilter.date;
    }
    const outstandingAggr = await Invoice.aggregate([
      { $match: outstandingFilter },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$balanceDue' }
        }
      }
    ]);
    const outstandingBalances = outstandingAggr[0]?.totalOutstanding || 0;

    // 5. Unpaid Commissions in Period
    const commissionFilter = {};
    if (dateFilter.date) {
      commissionFilter.date = dateFilter.date;
    }
    const commissionAggr = await Invoice.aggregate([
      { $match: commissionFilter },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commissionDetails' }
        }
      }
    ]);
    const unpaidCommissions = commissionAggr[0]?.totalCommission || 0;

    // 6. Counts (current active state)
    const totalCustomers = await Customer.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const totalProducts = await Product.countDocuments();

    // 7. Monthly Trends (Sales vs Purchases - 6 Months ending at endTrendDate)
    const salesTrendAggr = await Invoice.aggregate([
      { $match: { date: { $gte: sixMonthsAgo, $lte: endTrendDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalSales: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const purchaseTrendAggr = await PurchaseBill.aggregate([
      { $match: { date: { $gte: sixMonthsAgo, $lte: endTrendDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalPurchases: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format 6 months trend data based on endTrendDate
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(endTrendDate);
      d.setMonth(d.getMonth() - i);
      trendData.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthName: d.toLocaleString('en-US', { month: 'short' }),
        sales: 0,
        purchases: 0
      });
    }

    salesTrendAggr.forEach(item => {
      const match = trendData.find(t => t.year === item._id.year && t.month === item._id.month);
      if (match) match.sales = item.totalSales;
    });

    purchaseTrendAggr.forEach(item => {
      const match = trendData.find(t => t.year === item._id.year && t.month === item._id.month);
      if (match) match.purchases = item.totalPurchases;
    });

    // 8. Sales by Payment Mode in Period
    const paymentModeAggr = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMode',
          total: { $sum: '$grandTotal' }
        }
      }
    ]);
    const salesByPaymentMode = paymentModeAggr.map(item => ({
      name: item._id || 'Unknown',
      value: item.total
    }));

    // 9. Category Valuation Distribution (current state, not date filtered)
    const categoryStockAggr = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          totalQty: { $sum: '$quantity' },
          productCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }
    ]);
    const categoryValuation = categoryStockAggr.map(item => ({
      name: item.categoryInfo?.name || 'Uncategorized',
      value: item.totalValue,
      qty: item.totalQty,
      count: item.productCount
    }));

    // 10. Top 5 Best Selling Products in Period
    const topProductsAggr = await Invoice.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQty: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } }
    ]);
    const topProducts = topProductsAggr.map(item => ({
      name: item.productInfo?.name || 'Unknown Product',
      value: item.totalQty,
      sales: item.totalSales
    }));

    // 11. Low Stock Alerts (current state)
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    })
      .populate('category', 'name')
      .select('name sku quantity reorderLevel unit')
      .limit(5);

    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    // 12. Recent Activity in Period (Latest system audit logs)
    const auditFilter = {};
    if (dateFilter.date) {
      auditFilter.createdAt = dateFilter.date;
    }
    const recentActivity = await AuditLog.find(auditFilter)
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    data = {
      stockValue,
      salesThisMonth,
      purchasesThisMonth,
      outstandingBalances,
      unpaidCommissions,
      totalCustomers,
      totalSuppliers,
      totalProducts,
      trendData,
      salesByPaymentMode,
      categoryValuation,
      topProducts,
      lowStockProducts,
      lowStockCount,
      recentActivity
    };

    // Cache for 5 minutes
    await setCachedData(cacheKey, data, 300);
  }

  // Clone data to avoid mutating cache
  const responseData = { ...data };

  // Role-based visibility: Hide stock value (based on purchase price), purchases, suppliers, and category stock valuations for SalesStaff
  if (req.user && req.user.role === 'SalesStaff') {
    delete responseData.stockValue;
    delete responseData.purchasesThisMonth;
    delete responseData.totalSuppliers;
    delete responseData.categoryValuation;
    if (responseData.trendData) {
      responseData.trendData = responseData.trendData.map(item => {
        const { purchases, ...rest } = item;
        return rest;
      });
    }
  }

  res.status(200).json({
    status: 'success',
    data: responseData
  });
});
