/**
 * Role-based page access mapping
 * Defines which pages each role can access
 * Pages are listed in order of priority for landing page redirect
 */

export const ROLE_PAGE_ACCESS: Record<string, string[]> = {
  admin: [
    "/dashboard",
    "/sales/pos",
    "/sales/orders",
    "/inventory/products",
    "/customers",
    "/reports/sales",
    "/users",
    "/staff-management",
    "/payroll",
    "/settings",
  ],
  manager: [
    "/dashboard",
    "/sales/pos",
    "/sales/orders",
    "/inventory/products",
    "/customers",
    "/reports/sales",
    "/staff-management",
    "/settings",
  ],
  cashier: [
    "/sales/pos",
    "/sales/orders",
    "/customers",
    "/inventory/products",
  ],
  waiter: [
    "/sales/pos",
    "/customers",
  ],
  kitchen_staff: [
    "/kitchen",
  ],
  serving_staff: [
    "/serving",
  ],
  user: [
    "/sales/pos",
    "/customers",
  ],
};

/**
 * Get the first accessible page for a user based on their role
 * Falls back to /sales/pos if role is not found
 */
export function getDefaultLandingPage(role?: string): string {
  if (!role) return "/sales/pos";
  
  const pages = ROLE_PAGE_ACCESS[role.toLowerCase()];
  if (!pages || pages.length === 0) return "/sales/pos";
  
  return pages[0];
}

/**
 * Check if a user with a given role can access a page
 */
export function canAccessPage(role: string, page: string): boolean {
  const pages = ROLE_PAGE_ACCESS[role.toLowerCase()];
  if (!pages) return false;
  
  // Check exact match or prefix match for nested routes
  return pages.some(p => page === p || page.startsWith(p + "/"));
}
