# Kenya POS - Project TODO

## Phase 1-23: Completed Features
- [x] User authentication and authorization
- [x] Dashboard with analytics
- [x] Inventory management
- [x] Sales transaction system
- [x] Customer management
- [x] Reports and analytics
- [x] Wallet system
- [x] Staff management
- [x] Payroll management
- [x] Audit logging
- [x] Kitchen display system
- [x] Serving display system
- [x] Settings management
- [x] Notification preferences
- [x] User roles and permissions
- [x] Soft delete functionality
- [x] Deactivation system
- [x] Session management
- [x] Create deactivation notification/event system
- [x] Implement session invalidation when user is deactivated
- [x] Create deactivation alert modal component
- [x] Add frontend logout handler for deactivated users

## Phase 24: Bug Fixes
- [x] Fix page refresh issue that prevents making sales - FIXED: Rewrote useDeactivationCheck hook with proper dependency management and useRef to prevent infinite re-renders
- [ ] Fix smooth scrolling issue
- [x] Fix page navigation issue between pages - FIXED: Refined pointer-events management on sidebar to allow navigation clicks while preventing click interception when sidebar is off-screen
- [ ] Fix cart items being reset immediately after adding to cart
- [ ] Investigate if deactivation check hook is causing conflicts - RESOLVED: Hook was the cause, now fixed

## Phase 25: Graceful Deactivation Messaging
- [x] Implement deactivation status check endpoint that returns user active status
- [x] Create DeactivationAlert component with friendly message
- [x] Implement useDeactivationCheck hook that polls for account status changes
- [x] Show soft message to deactivated users before logout
- [x] Test deactivation workflow with admin deactivating a user
- [x] Verify deactivated user receives graceful message

## Phase 26: Role-Based Landing Pages
- [x] Define page access permissions for each role (Admin, Manager, Cashier, Waiter, etc.)
- [x] Create role-based page access mapping in constants (rolePageAccess.ts)
- [x] Implement landing page redirect logic based on user role (useDefaultLandingPage hook)
- [x] Test redirects for Admin (redirects to /dashboard)
- [x] Test redirects for Cashier (redirects to /sales/pos)
- [x] Test redirects for Waiter (redirects to /sales/pos)
- [x] Test redirects for Manager (redirects to /dashboard)
- [x] Verify sensitive pages are hidden from unauthorized roles via canAccessPage function

## Phase 27: Remove Invoices Page
- [x] Remove Invoices page from Sales menu navigation
- [x] Remove /invoices route from App.tsx
- [x] Remove Invoices component import
- [x] Test navigation to verify Invoices is removed

## Phase 28: Fix Staff Activity Log Page
- [x] Fix Select component with empty string value error
- [x] Change empty value to "all" to comply with shadcn/ui Select requirements
- [x] Update filter logic to handle "all" value
- [x] Test Staff Activity Log page loads without errors

## Phase 29: Fix Credit System
- [ ] Fix credit.create procedure to create customer first if needed
- [ ] Ensure creditLimit is a number, not a string
- [ ] Test adding students to credit system
- [ ] Verify credit account appears in the table
