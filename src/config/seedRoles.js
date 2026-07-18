import Role from '../models/Role.js';
import { ALL_PERMISSIONS } from './permissions.js';

const getModulePermissions = (moduleNames, actions = ['create', 'read', 'update', 'delete']) => {
  return ALL_PERMISSIONS.filter(p => {
    const [mod, action] = p.split('.');
    return moduleNames.includes(mod) && actions.includes(action);
  });
};

const defaultRoles = [
  {
    name: 'SuperAdmin',
    permissions: ALL_PERMISSIONS,
    isSystem: true,
    description: 'System Administrator with full access',
    color: 'bg-red-500/10 text-red-500'
  },
  {
    name: 'Admin',
    permissions: [
      ...getModulePermissions(['Dashboard', 'Reports']), // read only naturally
      ...getModulePermissions(['Products', 'Categories', 'Customers', 'Suppliers', 'Purchases', 'Sales', 'Quotations', 'GST'], ['create', 'read', 'update', 'delete']),
      ...getModulePermissions(['Users'], ['read']), // Read users, but cannot manage them or roles
    ],
    isSystem: true,
    description: 'Administrator with full operational access',
    color: 'bg-blue-500/10 text-blue-500'
  },
  {
    name: 'SalesStaff',
    permissions: [
      ...getModulePermissions(['Dashboard', 'Reports']), // read only naturally
      ...getModulePermissions(['Products', 'Categories', 'Customers'], ['read']),
      ...getModulePermissions(['Sales', 'Quotations'], ['create', 'read', 'update', 'delete']),
    ],
    isSystem: true,
    description: 'Sales staff for managing sales and quotations',
    color: 'bg-emerald-500/10 text-emerald-500'
  },
  {
    name: 'WarehouseStaff',
    permissions: [
      ...getModulePermissions(['Dashboard', 'Reports']), // read only naturally
      ...getModulePermissions(['Products', 'Categories', 'Suppliers', 'Purchases'], ['create', 'read', 'update', 'delete']),
    ],
    isSystem: true,
    description: 'Warehouse staff for managing inventory and purchases',
    color: 'bg-amber-500/10 text-amber-500'
  },
  {
    name: 'Accountant',
    permissions: [
      ...getModulePermissions(['Dashboard', 'Reports', 'Audit Logs']), // read only naturally
      ...getModulePermissions(['Products', 'Customers', 'Suppliers', 'Purchases', 'Sales'], ['read']),
    ],
    isSystem: true,
    description: 'Accountant with read-only access to financials and reports',
    color: 'bg-purple-500/10 text-purple-500'
  }
];

export const seedRoles = async () => {
  try {
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Seeded default role: ${roleData.name}`);
      } else if (existingRole.isSystem) {
        // Force update system role permissions
        existingRole.permissions = roleData.permissions;
        await existingRole.save();
      }
    }
    console.log('Role seeding completed.');
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};
