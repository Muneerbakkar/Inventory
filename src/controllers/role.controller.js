import Role from '../models/Role.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { ALL_PERMISSIONS, MODULES } from '../config/permissions.js';

export const getAllRoles = catchAsync(async (req, res, next) => {
  const roles = await Role.find();

  res.status(200).json({
    status: 'success',
    results: roles.length,
    data: {
      roles,
    },
  });
});

export const getRole = catchAsync(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new AppError('No role found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      role,
    },
  });
});

export const createRole = catchAsync(async (req, res, next) => {
  const { name, permissions, description, color } = req.body;
  
  // Validate permissions against ALL_PERMISSIONS
  const validPermissions = permissions ? permissions.filter(p => ALL_PERMISSIONS.includes(p)) : [];

  const newRole = await Role.create({
    name,
    permissions: validPermissions,
    description,
    color,
    isSystem: false, // Custom roles are never system roles
  });

  res.status(201).json({
    status: 'success',
    data: {
      role: newRole,
    },
  });
});

export const updateRole = catchAsync(async (req, res, next) => {
  const { permissions, description, color } = req.body;
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new AppError('No role found with that ID', 404));
  }

  if (role.name === 'SuperAdmin') {
    return next(new AppError('SuperAdmin role cannot be modified', 403));
  }
  
  // Custom roles can have their name changed, system roles cannot
  const name = !role.isSystem ? req.body.name : role.name;

  // Validate permissions against ALL_PERMISSIONS
  const validPermissions = permissions ? permissions.filter(p => ALL_PERMISSIONS.includes(p)) : role.permissions;

  const updatedRole = await Role.findByIdAndUpdate(
    req.params.id,
    { name, permissions: validPermissions, description, color },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      role: updatedRole,
    },
  });
});

export const deleteRole = catchAsync(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new AppError('No role found with that ID', 404));
  }

  if (role.isSystem) {
    return next(new AppError('System roles cannot be deleted', 403));
  }

  // Check if any user is currently using this role
  const usersWithRole = await User.countDocuments({ role: role.name });
  if (usersWithRole > 0) {
    return next(new AppError(`Cannot delete role. ${usersWithRole} users are currently assigned to it.`, 400));
  }

  await Role.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getPermissionsList = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      permissions: ALL_PERMISSIONS,
      modules: MODULES,
    },
  });
};
