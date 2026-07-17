import cron from 'node-cron';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';

export const initCronJobs = () => {
  // Run daily at midnight to check for low stock and overdue payments
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily scheduled jobs...');
    try {
      // 0. Deduplicate any existing duplicate notifications in the database
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

      // 1. Check Low Stock
      const lowStockProducts = await Product.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
      
      for (const product of lowStockProducts) {
        const existingNotif = await Notification.findOne({
          relatedEntityId: product._id,
          type: 'LowStock'
        });

        if (!existingNotif) {
          await Notification.create({
            type: 'LowStock',
            message: `Product "${product.name}" is low on stock (Quantity: ${product.quantity}, Reorder Level: ${product.reorderLevel})`,
            relatedEntityId: product._id,
            relatedEntityModel: 'Product'
          });
        }
      }

      // Clean up notifications for products that are no longer low stock
      const lowStockIds = lowStockProducts.map(p => p._id);
      await Notification.deleteMany({
        type: 'LowStock',
        relatedEntityId: { $nin: lowStockIds }
      });

      // 2. Check Overdue Payments (Invoices with balance > 0 and older than 30 days)
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
          await Notification.create({
            type: 'OverduePayment',
            message: `Invoice ${invoice.invoiceNumber} is overdue by 30+ days (Balance: ${invoice.balanceDue})`,
            relatedEntityId: invoice._id,
            relatedEntityModel: 'Invoice'
          });
        }
      }

      // Clean up notifications for invoices that are no longer overdue (paid or balance is 0)
      const overdueIds = overdueInvoices.map(i => i._id);
      await Notification.deleteMany({
        type: 'OverduePayment',
        relatedEntityId: { $nin: overdueIds }
      });

    } catch (err) {
      console.error('Error in cron jobs:', err);
    }
  });
};
