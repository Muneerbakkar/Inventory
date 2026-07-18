export const MODULES = [
  {
    name: 'Dashboard',
    actions: ['read']
  },
  {
    name: 'Products',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Categories',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Customers',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Suppliers',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Purchases',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Sales',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Quotations',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Users',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Roles',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'GST',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    name: 'Settings',
    actions: ['read', 'update']
  },
  {
    name: 'Reports',
    actions: ['read']
  },
  {
    name: 'Audit Logs',
    actions: ['read']
  }
];

// Flat list of all valid permission strings (e.g., 'Products.read', 'Users.create')
export const ALL_PERMISSIONS = MODULES.flatMap(mod => 
  mod.actions.map(action => `${mod.name}.${action}`)
);

// Backward compatibility helper if needed
export const PERMISSIONS = ALL_PERMISSIONS.reduce((acc, curr) => {
  acc[curr.replace('.', '_').toUpperCase()] = curr;
  return acc;
}, {});
