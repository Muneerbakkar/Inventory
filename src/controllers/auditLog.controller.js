import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

export const getAuditLogs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search, startDate, endDate } = req.query;
  const parsedLimit = parseInt(limit) || 20;
  const skip = (page - 1) * parsedLimit;

  const query = {};

  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    const userIds = users.map(u => u._id);

    query.$or = [
      { module: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { user: { $in: userIds } }
    ];
  }

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

  const logs = await AuditLog.find(query)
    .populate('user', 'name role email')
    .sort('-createdAt')
    .skip(skip)
    .limit(parsedLimit);

  const total = await AuditLog.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: { logs },
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parsedLimit) }
  });
});
