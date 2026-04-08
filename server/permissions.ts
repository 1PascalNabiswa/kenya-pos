import { TRPCError } from "@trpc/server";

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'cashier' | 'waiter' | 'inventory_manager' | 'kitchen_staff';

export interface RolePermissions {
  canAccessDashboard: boolean;
  canAccessSales: boolean;
  canProcessPayments: boolean;
  canAccessInventory: boolean;
  canManageCustomers: boolean;
  canViewReports: boolean;
  canAccessWallet: boolean;
  canAccessForms: boolean;
  canAccessCredit: boolean;
  canAccessAuditLogs: boolean;
  canAccessBranches: boolean;
  canAccessSuppliers: boolean;
  canAccessUserManagement: boolean;
  canAccessStaffManagement: boolean;
  canAccessPayroll: boolean;
  canAccessKitchenDisplay: boolean;
  canAccessServingDisplay: boolean;
  canAccessSettings: boolean;
  canAccessRolePermissions: boolean;
}

export const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessDashboard: true,
    canAccessSales: true,
    canProcessPayments: true,
    canAccessInventory: true,
    canManageCustomers: true,
    canViewReports: true,
    canAccessWallet: true,
    canAccessForms: true,
    canAccessCredit: true,
    canAccessAuditLogs: true,
    canAccessBranches: true,
    canAccessSuppliers: true,
    canAccessUserManagement: true,
    canAccessStaffManagement: true,
    canAccessPayroll: true,
    canAccessKitchenDisplay: true,
    canAccessServingDisplay: true,
    canAccessSettings: true,
    canAccessRolePermissions: true,
  },
  manager: {
    canAccessDashboard: true,
    canAccessSales: true,
    canProcessPayments: true,
    canAccessInventory: true,
    canManageCustomers: true,
    canViewReports: true,
    canAccessWallet: true,
    canAccessForms: true,
    canAccessCredit: true,
    canAccessAuditLogs: true,
    canAccessBranches: true,
    canAccessSuppliers: true,
    canAccessUserManagement: false,
    canAccessStaffManagement: true,
    canAccessPayroll: true,
    canAccessKitchenDisplay: true,
    canAccessServingDisplay: true,
    canAccessSettings: false,
    canAccessRolePermissions: false,
  },
  supervisor: {
    canAccessDashboard: true,
    canAccessSales: true,
    canProcessPayments: true,
    canAccessInventory: true,
    canManageCustomers: true,
    canViewReports: true,
    canAccessWallet: false,
    canAccessForms: true,
    canAccessCredit: true,
    canAccessAuditLogs: false,
    canAccessBranches: false,
    canAccessSuppliers: false,
    canAccessUserManagement: false,
    canAccessStaffManagement: false,
    canAccessPayroll: false,
    canAccessKitchenDisplay: true,
    canAccessServingDisplay: true,
    canAccessSettings: false,
    canAccessRolePermissions: false,
  },
  cashier: {
    canAccessDashboard: false,
    canAccessSales: true,
    canProcessPayments: true,
    canAccessInventory: false,
    canManageCustomers: true,
    canViewReports: false,
    canAccessWallet: true,
    canAccessForms: true,
    canAccessCredit: true,
    canAccessAuditLogs: false,
    canAccessBranches: false,
    canAccessSuppliers: false,
    canAccessUserManagement: false,
    canAccessStaffManagement: false,
    canAccessPayroll: false,
    canAccessKitchenDisplay: false,
    canAccessServingDisplay: true,
    canAccessSettings: false,
    canAccessRolePermissions: false,
  },
  waiter: {
    canAccessDashboard: false,
    canAccessSales: true,
    canProcessPayments: false,
    canAccessInventory: false,
    canManageCustomers: true,
    canViewReports: false,
    canAccessWallet: false,
    canAccessForms: true,
    canAccessCredit: false,
    canAccessAuditLogs: false,
    canAccessBranches: false,
    canAccessSuppliers: false,
    canAccessUserManagement: false,
    canAccessStaffManagement: false,
    canAccessPayroll: false,
    canAccessKitchenDisplay: false,
    canAccessServingDisplay: true,
    canAccessSettings: false,
    canAccessRolePermissions: false,
  },
  inventory_manager: {
    canAccessDashboard: true,
    canAccessSales: false,
    canProcessPayments: false,
    canAccessInventory: true,
    canManageCustomers: false,
    canViewReports: true,
    canAccessWallet: false,
    canAccessForms: false,
    canAccessCredit: false,
    canAccessAuditLogs: false,
    canAccessBranches: true,
    canAccessSuppliers: true,
    canAccessUserManagement: false,
    canAccessStaffManagement: false,
    canAccessPayroll: false,
    canAccessKitchenDisplay: false,
    canAccessServingDisplay: false,
    canAccessSettings: false,
    canAccessRolePermissions: false,
  },
  kitchen_staff: {
    canAccessDashboard: false,
    canAccessSales: false,
    canProcessPayments: false,
    canAccessInventory: false,
    canManageCustomers: false,
    canViewReports: false,
    canAccessWallet: false,
    canAccessForms: false,
    canAccessCredit: false,
    canAccessAuditLogs: false,
    canAccessBranches: false,
    canAccessSuppliers: false,
    canAccessUserManagement: false,
    canAccessStaffManagement: false,
    canAccessPayroll: false,
    canAccessKitchenDisplay: true,
    canAccessServingDisplay: false,
    canAccessSettings: false,
    canAccessRolePermissions: false,
  },
};

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): RolePermissions {
  return rolePermissionsMap[role] || rolePermissionsMap.waiter;
}

/**
 * Check if a user with a specific role can access a feature
 */
export function canAccessFeature(role: UserRole, feature: keyof RolePermissions): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions[feature] ?? false;
}

/**
 * Create a permission check middleware for tRPC procedures
 */
export function requirePermission(permission: keyof RolePermissions) {
  return async ({ ctx, next }: { ctx: any; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const userRole = ctx.user.role as UserRole;
    if (!canAccessFeature(userRole, permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Your role (${userRole}) does not have permission to access this feature`,
      });
    }

    return next({ ctx });
  };
}
