import { UserRole } from "./permissions";

/**
 * Data filtering rules based on user role
 * Determines what data each role can access
 */

export interface DataFilterContext {
  userId: number;
  userRole: UserRole;
  userBranchId?: number;
}

/**
 * Filter transactions based on user role
 * - Admin: can see all transactions
 * - Manager: can see all transactions
 * - Supervisor: can see team transactions
 * - Cashier: can only see their own transactions
 * - Waiter: can only see their own transactions
 * - Others: no access to transaction data
 */
export function getTransactionFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
      return {}; // No filter, see all
    case 'supervisor':
      return { supervisorId: context.userId }; // See team transactions
    case 'cashier':
    case 'waiter':
      return { userId: context.userId }; // See own transactions
    default:
      return null; // No access
  }
}

/**
 * Filter orders based on user role
 * - Admin/Manager: see all orders
 * - Supervisor: see team orders
 * - Cashier/Waiter: see own orders
 * - Kitchen Staff: see all orders (for kitchen display)
 */
export function getOrderFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
    case 'kitchen_staff':
      return {}; // No filter
    case 'supervisor':
      return { supervisorId: context.userId };
    case 'cashier':
    case 'waiter':
      return { userId: context.userId };
    default:
      return null;
  }
}

/**
 * Filter customers based on user role
 * - Admin/Manager: see all customers
 * - Supervisor: see customers they manage
 * - Cashier/Waiter: see all customers (for POS)
 * - Others: limited access
 */
export function getCustomerFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
    case 'cashier':
    case 'waiter':
      return {}; // No filter
    case 'supervisor':
      return { managedBy: context.userId };
    default:
      return null;
  }
}

/**
 * Filter inventory based on user role
 * - Admin/Manager: see all inventory
 * - Inventory Manager: see all inventory
 * - Others: no access to inventory data
 */
export function getInventoryFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
    case 'inventory_manager':
      return {}; // No filter
    default:
      return null;
  }
}

/**
 * Filter staff data based on user role
 * - Admin: see all staff
 * - Manager: see all staff
 * - Supervisor: see team members
 * - Others: no access
 */
export function getStaffFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
      return {}; // No filter
    case 'supervisor':
      return { supervisorId: context.userId };
    default:
      return null;
  }
}

/**
 * Filter payroll data based on user role
 * - Admin: see all payroll
 * - Manager: see all payroll
 * - Supervisor: see team payroll
 * - Others: no access
 */
export function getPayrollFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
      return {}; // No filter
    case 'supervisor':
      return { supervisorId: context.userId };
    default:
      return null;
  }
}

/**
 * Filter reports based on user role
 * - Admin: all reports
 * - Manager: all reports
 * - Supervisor: team reports
 * - Inventory Manager: inventory reports only
 * - Others: limited reports
 */
export function getReportFilter(context: DataFilterContext) {
  switch (context.userRole) {
    case 'admin':
    case 'manager':
      return { type: 'all' };
    case 'supervisor':
      return { type: 'team', supervisorId: context.userId };
    case 'inventory_manager':
      return { type: 'inventory' };
    case 'cashier':
      return { type: 'sales', userId: context.userId };
    default:
      return null;
  }
}

/**
 * Check if user can view specific data
 */
export function canViewData(
  context: DataFilterContext,
  dataType: 'transaction' | 'order' | 'customer' | 'inventory' | 'staff' | 'payroll' | 'report',
  dataOwnerId?: number,
  dataSupervisorId?: number
): boolean {
  switch (dataType) {
    case 'transaction':
      return canAccessTransaction(context, dataOwnerId);
    case 'order':
      return canAccessOrder(context, dataOwnerId);
    case 'customer':
      return canAccessCustomer(context);
    case 'inventory':
      return canAccessInventory(context);
    case 'staff':
      return canAccessStaff(context, dataSupervisorId);
    case 'payroll':
      return canAccessPayroll(context, dataSupervisorId);
    case 'report':
      return canAccessReport(context);
    default:
      return false;
  }
}

function canAccessTransaction(context: DataFilterContext, ownerId?: number): boolean {
  if (context.userRole === 'admin' || context.userRole === 'manager') return true;
  if (context.userRole === 'supervisor') return true;
  if (context.userRole === 'cashier' || context.userRole === 'waiter') {
    return ownerId === context.userId;
  }
  return false;
}

function canAccessOrder(context: DataFilterContext, ownerId?: number): boolean {
  if (context.userRole === 'admin' || context.userRole === 'manager') return true;
  if (context.userRole === 'kitchen_staff') return true;
  if (context.userRole === 'supervisor') return true;
  if (context.userRole === 'cashier' || context.userRole === 'waiter') {
    return ownerId === context.userId;
  }
  return false;
}

function canAccessCustomer(context: DataFilterContext): boolean {
  return context.userRole !== 'kitchen_staff' && context.userRole !== 'inventory_manager';
}

function canAccessInventory(context: DataFilterContext): boolean {
  return (
    context.userRole === 'admin' ||
    context.userRole === 'manager' ||
    context.userRole === 'inventory_manager'
  );
}

function canAccessStaff(context: DataFilterContext, supervisorId?: number): boolean {
  if (context.userRole === 'admin' || context.userRole === 'manager') return true;
  if (context.userRole === 'supervisor') {
    return supervisorId === context.userId;
  }
  return false;
}

function canAccessPayroll(context: DataFilterContext, supervisorId?: number): boolean {
  if (context.userRole === 'admin' || context.userRole === 'manager') return true;
  if (context.userRole === 'supervisor') {
    return supervisorId === context.userId;
  }
  return false;
}

function canAccessReport(context: DataFilterContext): boolean {
  return (
    context.userRole === 'admin' ||
    context.userRole === 'manager' ||
    context.userRole === 'supervisor' ||
    context.userRole === 'inventory_manager' ||
    context.userRole === 'cashier'
  );
}
