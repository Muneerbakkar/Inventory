import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getNotifications = catchAsync(async (req, res, next) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  try {
    // 0. Deduplicate any existing duplicate notifications in the database (keeping only the first one)
    const duplicates = await Notification.aggregate([
      {
        $group: {
          _id: { type: "$type", relatedEntityId: "$relatedEntityId" },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    for (const dup of duplicates) {
      if (dup._id.type && dup._id.relatedEntityId) {
        const idsToDelete = dup.ids.slice(1);
        await Notification.deleteMany({ _id: { $in: idsToDelete } });
      }
    }

    // 1. Run dynamic low stock check
    const lowStockProducts = await Product.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
    for (const product of lowStockProducts) {
      const existingNotif = await Notification.findOne({
        relatedEntityId: product._id,
        type: 'LowStock'
      });
      if (!existingNotif) {
        try {
          await Notification.create({
            type: 'LowStock',
            message: `Product "${product.name}" is low on stock (Quantity: ${product.quantity}, Reorder Level: ${product.reorderLevel})`,
            relatedEntityId: product._id,
            relatedEntityModel: 'Product'
          });
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
    }

    // Clean up notifications for products that are no longer low stock
    const lowStockIds = lowStockProducts.map(p => p._id);
    await Notification.deleteMany({
      type: 'LowStock',
      relatedEntityId: { $nin: lowStockIds }
    });

    // 2. Run dynamic overdue payment check (Invoices with balance > 0 and older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const overdueInvoices = await Invoice.find({
      balanceDue: { $gt: 0 },
      date: { $lt: thirtyDaysAgo }
    });
    for (const invoice of overdueInvoices) {
      const existingNotif = await Notification.findOne({
        relatedEntityId: invoice._id,
        type: 'OverduePayment'
      });
      if (!existingNotif) {
        try {
          await Notification.create({
            type: 'OverduePayment',
            message: `Invoice ${invoice.invoiceNumber} is overdue by 30+ days (Balance: ${invoice.balanceDue})`,
            relatedEntityId: invoice._id,
            relatedEntityModel: 'Invoice'
          });
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
    }

    // Clean up notifications for invoices that are no longer overdue (paid or balance is 0)
    const overdueIds = overdueInvoices.map(i => i._id);
    await Notification.deleteMany({
      type: 'OverduePayment',
      relatedEntityId: { $nin: overdueIds }
    });
  } catch (err) {
    console.error('Error running dynamic checks inside getNotifications:', err);
  }

  // Construct query with date filters
  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: { notifications },
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});

export const deleteNotification = catchAsync(async (req, res, next) => {
  await Notification.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

export const deleteMultipleNotifications = catchAsync(async (req, res, next) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids)) {
    return next(new AppError('Please provide an array of notification IDs to delete', 400));
  }

  await Notification.deleteMany({ _id: { $in: ids } });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
