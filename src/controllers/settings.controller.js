import CompanySettings from '../models/CompanySettings.js';
import catchAsync from '../utils/catchAsync.js';

export const getSettings = catchAsync(async (req, res, next) => {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    // Create default if not exists
    settings = await CompanySettings.create({ name: 'My Company' });
  }
  res.status(200).json({ status: 'success', data: { settings } });
});

export const updateSettings = catchAsync(async (req, res, next) => {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.status(200).json({ status: 'success', data: { settings } });
});
