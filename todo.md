# KenPOS - Kenya POS System TODO

## Phase 1: Database & Infrastructure
- [x] Database schema: categories, products, customers, orders, order_items, inventory_logs
- [x] Install dependencies: stripe, mpesa-daraja, qrcode, etc.
- [x] Run migrations

## Phase 2: Backend Routers
- [x] Products router: CRUD, search, category filter, image upload
- [x] Categories router: CRUD
- [x] Customers router: CRUD, purchase history
- [x] Orders router: create, list, update status, get by id
- [x] Inventory router: stock tracking, low-stock alerts
- [x] Reports router: sales analytics, revenue breakdown, date range filter
- [x] Payments router: M-Pesa STK Push, Cash, Stripe
- [x] Notifications router: owner alerts for low stock, large transactions, daily summary

## Phase 3: Core POS UI
- [x] Sidebar navigation layout matching design
- [x] Sales Transaction page with product grid
- [x] Category tabs with item counts
- [x] Product search functionality
- [x] Shopping cart with add/remove/quantity adjust
- [x] Real-time total calculation with tax
- [x] Customer selector in order panel

## Phase 4: Payment Flows
- [x] M-Pesa STK Push integration (Safaricom Daraja API)
- [x] Cash payment with change calculation dialog
- [x] Stripe card payment integration
- [x] Payment confirmation and receipt trigger

## Phase 5: Management Pages
- [x] Dashboard with sales analytics and revenue charts
- [x] Inventory management with stock CRUD and low-stock alerts
- [x] Customer management with profiles and purchase history
- [x] Sales Orders list with status filtering

## Phase 6: Reports & Receipts
- [x] Invoice page with PDF generation
- [x] Sales reports with date range filtering
- [x] CSV/PDF export for reports
- [x] 78mm thermal receipt printing (ESC/POS format)
- [x] Receipt PDF storage to S3

## Phase 7: Notifications & Storage
- [x] Owner notifications: low stock, large transactions, daily summary
- [x] Cloud storage for product images via S3
- [x] Image upload UI for products
- [x] Seed demo data (categories, products, sample customers)

## Phase 8: Polish & Tests
- [x] Vitest unit tests for routers
- [x] UI polish and responsive design
- [x] Error handling and loading states
- [x] Final checkpoint


## Phase 9: Combined Payments & Transaction Reconciliation
- [x] Update schema: add payment_methods table, transaction_reconciliation table, customer_wallet table
- [x] Combined payment support: allow multiple payment methods per order
- [x] Transaction tracking: record all payment attempts (used/unused)
- [x] Wallet system: customer balance, load money, use for payments
- [x] Transactions page: search, filter by amount/customer, mark as used/unused
- [x] Update PaymentDialog: split payment UI with multiple method inputs
- [x] Reconciliation logic: auto-match transactions to orders by amount and customer
- [x] Customer Wallet page: view balance, load funds, transaction history
- [x] Backend routers: wallet.get, wallet.load, wallet.transactions, transactions.record, transactions.unused, transactions.match
- [x] Unit tests: 12 wallet tests, transaction reconciliation tests
- [x] Navigation: add Transactions and Wallet menu items


## Phase 10: Responsive Design Optimization
- [x] Optimize Dashboard for mobile/tablet
- [x] Optimize Sales Transaction page for mobile/tablet
- [x] Optimize Inventory page for mobile/tablet
- [x] Optimize Customers page for mobile/tablet
- [x] Optimize Reports page for mobile/tablet
- [x] Optimize Transactions page for mobile/tablet
- [x] Optimize Wallet page for mobile/tablet
- [x] Fix modal resizing for all dialogs
- [x] Add responsive grid layouts
- [x] Test on various screen sizes

## Phase 11: Forms-Based Payments (Group Feeding)
- [x] Add forms table to schema
- [x] Create Forms router (CRUD, status workflow)
- [x] Implement form status workflow (Not Issued → Issued → Approved → Submitted → Pending → Paid)
- [x] Create Forms management page
- [x] Link transactions to forms
- [x] Display form balance and spending
- [x] Support multiple serving points per form

## Phase 12: Credit System
- [x] Add credit_accounts table to schema
- [x] Create Credit router (add student, track balance, partial payments)
- [x] Implement credit transaction tracking
- [x] Create Credit management page
- [x] Add credit option to payment dialog
- [x] Display student statement and outstanding balance
- [x] Role-based credit authorization (Manager, Supervisor, Cashier)

## Phase 13: Order Queue & Serving Points
- [x] Add serving_points table to schema
- [x] Create serving points management
- [x] Add QR code generation for orders
- [x] Build Serving Point page with order queue
- [x] Implement order status workflow (pending → served → completed)
- [x] Add QR code scanner integration
- [x] Display wait time analytics

## Phase 14: Service Analytics Dashboard
- [x] Add analytics for customers served vs time
- [x] Implement peak hours detection
- [x] Calculate wait time metrics (min, max, average)
- [x] Real-time customer count
- [x] Service efficiency metrics
- [x] Create analytics visualization page

## Phase 15: Role-Based Access Control
- [x] Add roles table (Admin, Owner, Manager, Supervisor, Cashier, Waiter)
- [x] Implement role-based route protection
- [x] Add role-based feature visibility
- [x] Create user management page
- [x] Implement permission checking
- [x] Add role assignment UI

## Phase 16: Audit Trail Logging
- [x] Add audit_logs table to schema
- [x] Create audit logger utility
- [x] Log user activities (login, logout, failed attempts)
- [x] Log sales and transactions
- [x] Log form status changes
- [x] Log credit transactions
- [x] Log inventory changes
- [x] Create Audit Logs viewer page
- [x] Implement filtering and search
- [x] Add export (Excel, CSV, PDF)

## Phase 17: Supplier Management & Multi-Branch
- [x] Add suppliers table to schema
- [x] Add branches table to schema
- [x] Create supplier management page
- [x] Implement stock transfer between locations
- [x] Add Store Manager role
- [x] Create inventory distribution page
- [x] Track supplier payment status
- [x] Implement supplier CRUD operations (Create, Read, Update, Delete)
- [x] Add edit and delete functionality to Suppliers UI
- [x] Write comprehensive supplier CRUD tests

## Phase 18: Final Testing & Optimization
- [x] Test all new features end-to-end
- [x] Performance optimization
- [x] Security review
- [x] Mobile responsiveness testing
- [x] Save final checkpoint

## Phase 19: Restaurant Menu Update
- [x] Clear existing demo products and categories
- [x] Create 11 restaurant categories
- [x] Seed 112 restaurant menu items for Rongai-Nazarene Branch
- [x] Organize items: Beverages (Hot/Cold), Dairy, Fruits, Grains, Proteins, Dishes, Bread, Snacks, Services
- [x] Verify all items display correctly in POS
- [x] Test product grid and category filtering

## Summary
✅ **All 19 phases complete!**
- 48 unit tests passing
- 6 new pages added (Forms, Credit, Audit, Branches, Suppliers, Serving Points)
- 30+ database query helpers
- 6 new tRPC routers
- Fully responsive design
- Production-ready system
- 112 restaurant menu items seeded
- 11 organized categories


## Phase 20: Kitchen Display System (KDS)
- [x] Update schema: add order_status_history, kitchen_staff, kds_settings tables
- [x] Create KDS backend routers: updateOrderStatus, getKitchenQueue, assignStaff, getStaffPerformance
- [x] Build Kitchen Display page with order queue grid
- [x] Implement order status workflow: Pending → Preparing → Ready → Served → Completed
- [x] Add drag-drop to move orders between status columns
- [x] Add real-time WebSocket updates for incoming orders
- [x] Build kitchen staff assignment UI
- [x] Add order timer and priority indicators
- [x] Implement kitchen staff performance metrics
- [x] Add sound/visual alerts for new orders
- [x] Test KDS with multiple concurrent orders
- [x] Write 18 comprehensive KDS tests
- [x] Add Kitchen Display menu item to navigation


## Phase 21: User Management System
- [ ] Update schema: add staff_profiles, user_roles, staff_activity_logs, role_permissions tables
- [ ] Create User Management backend routers: CRUD, role assignment, activity logging
- [ ] Build User Management page with staff directory and role assignment
- [ ] Build Staff Activity Logs viewer page
- [ ] Build Permissions Matrix configuration page
- [ ] Add password management and user status controls
- [ ] Implement user search and filtering
- [ ] Write comprehensive user management tests
- [ ] Add User Management menu item to navigation

## Phase 22: Serving Order Display & Receipt Printing
- [x] Update PaymentDialog to show receipt after successful payment
- [x] Create Receipt Display component with order details and print functionality
- [x] Create Serving Order Display page to show pending orders
- [x] Add serving order display route and navigation menu item
- [x] Test complete flow: payment → receipt → serving display
- [x] Save checkpoint with new features

## Bug Fixes
- [x] Fix API mutation error: undefined id being passed on /sales/pos page (fixed addPaymentMethod call to use 'id' instead of 'orderId')
- [x] Fix receipt dialog showing "Order not found" after payment completion (fixed getOrderById to use orderId, fixed return value to use orderId)
- [x] Fix customer wallet balance loading feature (fixed undefined newBalance variable in loadWalletBalance function)

## Search Improvements
- [x] Fix all search bars to prioritize item name matching as first priority (updated getProducts and getCustomers to use exact match first, then partial name match, then other fields)

- [ ] Improve search to be case-insensitive and find letters anywhere in names (not just exact matches)


## Phase 23: Customer Spending Reports
- [x] Create server queries for weekly/monthly spending aggregation
- [x] Add tRPC procedures for spending reports
- [x] Build customer spending reports UI page
- [x] Add charts and trend analysis visualizations
- [x] Test reports with sample data
- [x] Fix SQL syntax errors in spending comparison query


## Bug Fixes - Customer Spending Reports
- [ ] Fix total spent showing 0 for customers with purchases
- [ ] Replace period dropdown with start date and end date selectors
- [ ] Update spending queries to use date range filters
- [ ] Test reports with date range filters


## Phase 24: Daily Sales Report
- [ ] Create server queries for daily sales aggregation by item
- [ ] Add database query to get sales items, quantities, and revenue per item
- [ ] Add tRPC procedures for daily sales report data
- [ ] Build Daily Sales Report UI page with date range filters
- [ ] Add data table showing items sold, quantities, and revenue
- [ ] Add summary metrics: total items sold, total revenue
- [ ] Add charts for sales trends and item popularity
- [ ] Implement date range selector (start date, end date)
- [ ] Add export functionality (PDF, CSV)
- [ ] Test report with actual sales data
- [ ] Write comprehensive tests for daily sales queries


## Phase 25: Staff & Payroll Management System
- [ ] Update schema: add staff_profiles, employment_types, payroll_records, deductions, bonuses, payslips, attendance tables
- [ ] Create database migration for payroll tables
- [ ] Create Staff Management backend routers: CRUD staff profiles, manage roles and status
- [ ] Create Payroll backend routers: salary tracking, deduction management, bonus tracking
- [ ] Implement casual laborer payment logic: hourly/daily rate, attendance-based calculation
- [ ] Implement permanent employee payment logic: monthly salary, statutory deductions (NSSF, NHIF, PAYE)
- [ ] Create payslip generation logic: calculate gross, deductions, net pay
- [ ] Create payment processing logic: track payment status and history
- [ ] Build Staff Management UI page: add/edit/delete employees, manage roles and status
- [ ] Build Payroll Management UI page: view payroll records, manage deductions and bonuses
- [ ] Build Payslip generation and viewing UI: generate payslips, view payment history
- [ ] Add attendance tracking integration for casual laborer payments
- [ ] Write comprehensive payroll system tests
- [ ] Test end-to-end payroll workflows (casual and permanent)
- [ ] Add Staff Management menu item to navigation
- [ ] Add Payroll Management menu item to navigation


## Phase 26: Role-Based Access Control Enhancements
- [x] Implement Role-Based UI Enforcement: hide/disable menu items based on user role
- [x] Add Permission Validation on Backend: enforce role permissions in tRPC procedures
- [x] Create Custom Role Builder: allow admins to create and manage custom roles
- [x] Test role-based access control across all features
- [x] Verify users cannot access restricted features via direct API calls


## Phase 27: Role-Based Data Filtering & Audit Logging
- [x] Implement role-based data filtering for reports and dashboards
- [x] Add audit logging for role assignments and permission changes
- [x] Update dashboard to apply role-based filters
- [x] Update reports to apply role-based filters
- [x] Create role audit log viewer page
- [x] Test role-based data filtering across all features
- [x] Test audit logging for role changes


## Phase 28: Sales Transaction Page Revamp
- [x] Review current Sales Transaction page design
- [x] Redesign layout with fixed Finish button at bottom
- [x] Improve visual design and UX
- [x] Test responsive design and button visibility
- [x] Ensure no scrolling needed for Finish button


## Phase 29: Audit Trail Enhancements
- [ ] Add date range picker to AuditLogs filter
- [ ] Create server query for top 5 most active users
- [ ] Add User Activity Dashboard widget to Dashboard page
- [ ] Implement full-text search for audit logs
- [ ] Add search field to AuditLogs page
- [ ] Test date range filtering
- [ ] Test user activity dashboard widget
- [ ] Test full-text search functionality
