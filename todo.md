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

## Phase 28b: Display User Names in Staff Activity Logs
- [x] Update getStaffActivityLogs to join with users table and include user name
- [x] Update StaffActivityLogs component to display user name instead of user ID
- [x] Update search functionality to search by user name
- [x] Update CSV export to include user name column
- [x] Test Staff Activity Log displays user names correctly

## Phase 28c: Implement Real-Time Activity Logging
- [x] Add activity logging to orders.create procedure
- [x] Implement auto-refresh polling (every 5 seconds) in StaffActivityLogs component
- [x] Add manual refresh button with loading state
- [x] Update page description to show auto-refresh status
- [x] Test real-time activity logging works

## Phase 29: Fix Credit System
- [x] Update Drizzle schema to match actual database structure
- [x] Fix credit.create procedure to return correct ID
- [x] Test adding students to credit system
- [x] Verify credit account appears in the table

## Phase 30: Credit Account Management
- [ ] Add database functions to update credit balance and status
- [ ] Add tRPC procedures for updating credit account
- [ ] Create credit account detail modal/dialog
- [ ] Implement balance update functionality (add/deduct credit)
- [ ] Implement status change functionality (active/settled/suspended)
- [ ] Add transaction history display
- [ ] Test credit management features

## Phase 31: Credit Transaction Log Feature
- [x] Create credit_transactions table schema (already existed)
- [x] Add database functions for transaction logging (already existed)
- [x] Create tRPC procedures for transaction operations (already existed)
- [x] Build CreditTransactionLog UI component with search, filter, and export
- [x] Integrate transaction log into CreditAccountModal with tabs
- [x] Test transaction log features - working perfectly

## Phase 32: Fix Cart Component Width Issue
- [x] Identify cart width flexing issue covering items on window resize
- [x] Add lg:flex-shrink-0 to cart container to prevent expansion
- [x] Add lg:max-w-96 to enforce maximum width constraint
- [x] Test cart maintains fixed width on large screens
- [x] Verify products remain visible and accessible

## Phase 33: Fix Customer Spending Reports Page
- [x] Refactor CustomerSpendingReports to use topCustomers data as source of truth
- [x] Create customer dropdown from topCustomers instead of customers.list
- [x] Use topCustomers data to populate spending details when customer is selected
- [x] Remove redundant spending queries (customerSpendingTrends, customerSpendingMonthly, etc.)
- [x] Test customer selection shows real spending data

## Phase 34: Add Payment Method Breakdown to Customer Spending Reports
- [x] Update getTopCustomersBySpending to separate wallet vs other payment modes
- [x] Add walletSpent and otherSpent fields to customer spending data
- [x] Update CustomerSpendingReports page to display payment method breakdown
- [x] Show wallet spending and other payment methods separately in metrics
- [x] Display payment method percentages in the breakdown section
- [x] Test wallet spending matches Customer Wallet page balance

## Phase 35: Add Custom Date Range Filtering to Customer Spending Reports
- [x] Update getTopCustomersBySpending to accept startDate and endDate parameters
- [x] Update topCustomers tRPC endpoint to accept date range parameters
- [x] Add date range picker UI to CustomerSpendingReports page
- [x] Connect date picker to data fetching
- [x] Test filtering with various date ranges
