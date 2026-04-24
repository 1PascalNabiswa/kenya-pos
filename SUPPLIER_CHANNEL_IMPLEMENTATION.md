# Supplier Channel Management Implementation Guide

## Overview
This guide provides step-by-step instructions to complete the supplier channel management system for managing supplier deliveries, store inventory, and transfers between store and selling points.

## Database Schema
Four new tables have been added to the schema:

### 1. supplier_deliveries
Tracks deliveries from suppliers with status tracking.
- `id`: Primary key
- `supplierId`: Foreign key to suppliers table
- `deliveryDate`: When delivery was made
- `referenceNumber`: Supplier reference/invoice number
- `totalQuantity`: Total items in delivery
- `totalAmount`: Total cost of delivery
- `status`: pending, received, partial, cancelled
- `notes`: Additional notes

### 2. delivery_items
Individual items within each delivery.
- `id`: Primary key
- `deliveryId`: Foreign key to supplier_deliveries
- `productId`: Foreign key to products
- `quantityOrdered`: Quantity ordered
- `quantityReceived`: Quantity actually received
- `unitPrice`: Price per unit
- `totalPrice`: Total price for this item
- `expiryDate`: Product expiry date
- `batchNumber`: Batch/lot number
- `notes`: Item-specific notes

### 3. store_inventory
Separate inventory tracking for store vs selling points.
- `id`: Primary key
- `productId`: Foreign key to products (unique)
- `storeQuantity`: Quantity at main store
- `sellingPointQuantity`: Quantity at selling points
- `lastRestockDate`: Last time stock was updated

### 4. store_transfers
Audit trail of all inventory transfers.
- `id`: Primary key
- `productId`: Foreign key to products
- `quantity`: Number of units transferred
- `transferType`: store_to_selling_point, selling_point_to_store, adjustment
- `transferDate`: When transfer occurred
- `reason`: Why transfer was made
- `notes`: Additional details
- `createdBy`: User who created transfer

## Implementation Steps

### Step 1: Apply Database Migration
Execute the SQL migration to create the tables:
```bash
cd /home/ubuntu/kenya-pos
# The migration file is at: drizzle/migrations/add_supplier_channel_management.sql
```

### Step 2: Add Backend Database Helpers
Add these functions to `server/db.ts`:

```typescript
// Supplier Management
export async function createSupplier(data: {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  paymentTerms?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(suppliers).values(data);
}

export async function getSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(suppliers).where(eq(suppliers.isActive, true));
}

// Delivery Management
export async function createDelivery(data: {
  supplierId: number;
  deliveryDate: Date;
  referenceNumber?: string;
  totalQuantity: number;
  totalAmount?: number;
  status?: "pending" | "received" | "partial" | "cancelled";
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(supplierDeliveries).values(data);
}

export async function getDeliveries(supplierId?: number) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(supplierDeliveries);
  if (supplierId) {
    query = query.where(eq(supplierDeliveries.supplierId, supplierId));
  }
  return await query;
}

// Delivery Items
export async function addDeliveryItem(data: {
  deliveryId: number;
  productId: number;
  quantityOrdered: number;
  quantityReceived?: number;
  unitPrice: number;
  totalPrice: number;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(deliveryItems).values(data);
}

export async function getDeliveryItems(deliveryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, deliveryId));
}

// Store Inventory
export async function updateStoreInventory(productId: number, storeQty: number, sellingQty: number) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(storeInventory).where(eq(storeInventory.productId, productId));
  
  if (existing.length > 0) {
    return await db.update(storeInventory)
      .set({ storeQuantity: storeQty, sellingPointQuantity: sellingQty })
      .where(eq(storeInventory.productId, productId));
  } else {
    return await db.insert(storeInventory).values({ productId, storeQuantity: storeQty, sellingPointQuantity: sellingQty });
  }
}

export async function getStoreInventory(productId?: number) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(storeInventory);
  if (productId) {
    query = query.where(eq(storeInventory.productId, productId));
  }
  return await query;
}

// Store Transfers
export async function createTransfer(data: {
  productId: number;
  quantity: number;
  transferType: "store_to_selling_point" | "selling_point_to_store" | "adjustment";
  reason?: string;
  notes?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(storeTransfers).values(data);
}

export async function getTransfers(productId?: number) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(storeTransfers);
  if (productId) {
    query = query.where(eq(storeTransfers.productId, productId));
  }
  return await query;
}
```

### Step 3: Create tRPC Routers
Add a new supplier router in `server/routers.ts`:

```typescript
const supplierRouter = router({
  // Suppliers
  createSupplier: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createSupplier(input)),

  listSuppliers: publicProcedure.query(() => getSuppliers()),

  // Deliveries
  createDelivery: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      deliveryDate: z.date(),
      referenceNumber: z.string().optional(),
      totalQuantity: z.number(),
      totalAmount: z.number().optional(),
      status: z.enum(["pending", "received", "partial", "cancelled"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createDelivery(input)),

  listDeliveries: publicProcedure
    .input(z.object({ supplierId: z.number().optional() }).optional())
    .query(({ input }) => getDeliveries(input?.supplierId)),

  // Delivery Items
  addDeliveryItem: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      productId: z.number(),
      quantityOrdered: z.number(),
      quantityReceived: z.number().optional(),
      unitPrice: z.number(),
      totalPrice: z.number(),
      expiryDate: z.date().optional(),
      batchNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => addDeliveryItem(input)),

  getDeliveryItems: publicProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(({ input }) => getDeliveryItems(input.deliveryId)),

  // Store Inventory
  updateStoreInventory: protectedProcedure
    .input(z.object({
      productId: z.number(),
      storeQuantity: z.number(),
      sellingPointQuantity: z.number(),
    }))
    .mutation(({ input }) => updateStoreInventory(input.productId, input.storeQuantity, input.sellingPointQuantity)),

  getStoreInventory: publicProcedure
    .input(z.object({ productId: z.number().optional() }).optional())
    .query(({ input }) => getStoreInventory(input?.productId)),

  // Transfers
  createTransfer: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number(),
      transferType: z.enum(["store_to_selling_point", "selling_point_to_store", "adjustment"]),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return createTransfer({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  getTransfers: publicProcedure
    .input(z.object({ productId: z.number().optional() }).optional())
    .query(({ input }) => getTransfers(input?.productId)),
});

// Add to main router
export const appRouter = router({
  // ... existing routers
  supplier: supplierRouter,
});
```

### Step 4: Create UI Components

Create the following React components:

#### `client/src/pages/SupplierManagement.tsx`
- List of suppliers with add/edit/delete functionality
- Supplier form with validation
- Contact information display

#### `client/src/pages/DeliveryTracking.tsx`
- Create new deliveries
- Add items to deliveries
- Track delivery status
- View delivery history

#### `client/src/pages/StoreInventoryTransfer.tsx`
- View store vs selling point inventory
- Create transfers between store and selling points
- Track transfer history
- Adjustment log

#### `client/src/components/DeliveryForm.tsx`
- Form to create/edit deliveries
- Add multiple items to delivery
- Batch number and expiry date tracking

#### `client/src/components/TransferForm.tsx`
- Form to create inventory transfers
- Select transfer type
- Reason and notes

### Step 5: Update Navigation
Add menu items in `client/src/components/POSLayout.tsx`:

```typescript
{
  label: "Operations",
  children: [
    { label: "Supplier Management", href: "/suppliers" },
    { label: "Delivery Tracking", href: "/deliveries" },
    { label: "Store Inventory", href: "/store-inventory" },
  ]
}
```

### Step 6: Create Routes
Add routes in `client/src/App.tsx`:

```typescript
<Route path="/suppliers" component={() => (
  <POSLayout>
    <SupplierManagement />
  </POSLayout>
)} />
<Route path="/deliveries" component={() => (
  <POSLayout>
    <DeliveryTracking />
  </POSLayout>
)} />
<Route path="/store-inventory" component={() => (
  <POSLayout>
    <StoreInventoryTransfer />
  </POSLayout>
)} />
```

## Key Features to Implement

1. **Supplier Management**
   - CRUD operations for suppliers
   - Contact information tracking
   - Payment terms management

2. **Delivery Tracking**
   - Create deliveries with reference numbers
   - Add items with quantity, price, batch numbers
   - Track partial receipts
   - Update delivery status

3. **Store Inventory**
   - Separate tracking for store and selling points
   - Real-time quantity updates
   - Last restock date tracking

4. **Transfer Management**
   - Move inventory between store and selling points
   - Adjustment tracking
   - Transfer history and audit trail
   - User attribution

## Testing Checklist

- [ ] Create a supplier
- [ ] Create a delivery for the supplier
- [ ] Add items to the delivery
- [ ] Update delivery status to received
- [ ] Verify store inventory is updated
- [ ] Create a transfer from store to selling point
- [ ] Verify quantities are updated correctly
- [ ] Check transfer history
- [ ] Test adjustment transfers

## Next Steps

1. Apply the database migration
2. Add database helper functions to `server/db.ts`
3. Create tRPC routers in `server/routers.ts`
4. Build React components for each feature
5. Add routes to `App.tsx`
6. Test all functionality
7. Create checkpoint

## Notes

- All timestamps use UTC
- Quantities are integers (no decimal quantities)
- Prices use decimal(12,2) format
- All transfers are logged for audit purposes
- User attribution is tracked for all mutations
