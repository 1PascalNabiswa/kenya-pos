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
