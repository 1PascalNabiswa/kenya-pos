import { getDb } from "./server/db";
import { categories, products, customers, settings } from "./drizzle/schema";

async function seed() {
  const db = await getDb();
  if (!db) { console.error("No DB connection"); process.exit(1); }

  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(products);
  await db.delete(categories);
  await db.delete(customers);
  await db.delete(settings);

  // Insert categories
  await db.insert(categories).values([
    { name: "Food", description: "Food items", color: "#3B82F6", icon: "🍽️", sortOrder: 1 },
    { name: "Beverages", description: "Drinks and beverages", color: "#10B981", icon: "🥤", sortOrder: 2 },
    { name: "Snacks", description: "Snacks and pastries", color: "#F59E0B", icon: "🍿", sortOrder: 3 },
    { name: "Electronics", description: "Electronics and accessories", color: "#8B5CF6", icon: "📱", sortOrder: 4 },
    { name: "Clothing", description: "Clothes and accessories", color: "#EC4899", icon: "👕", sortOrder: 5 },
    { name: "Household", description: "Household items", color: "#EF4444", icon: "🏠", sortOrder: 6 },
  ]);

  const cats = await db.select().from(categories);
  const catMap: Record<string, number> = {};
  cats.forEach((c) => { catMap[c.name] = c.id; });

  // Insert products
  await db.insert(products).values([
    // Food
    { name: "Ugali & Sukuma Wiki", sku: "FOOD-001", categoryId: catMap["Food"], price: "150", costPrice: "80", stockQuantity: 50, unit: "plate", isActive: true, description: "Traditional Kenyan ugali with sukuma wiki" },
    { name: "Nyama Choma (500g)", sku: "FOOD-002", categoryId: catMap["Food"], price: "600", costPrice: "350", stockQuantity: 30, unit: "portion", isActive: true, description: "Grilled goat meat, Kenyan style" },
    { name: "Pilau Rice", sku: "FOOD-003", categoryId: catMap["Food"], price: "250", costPrice: "120", stockQuantity: 40, unit: "plate", isActive: true, description: "Spiced rice with meat" },
    { name: "Githeri", sku: "FOOD-004", categoryId: catMap["Food"], price: "120", costPrice: "60", stockQuantity: 60, unit: "plate", isActive: true, description: "Boiled maize and beans" },
    { name: "Chapati (2 pcs)", sku: "FOOD-005", categoryId: catMap["Food"], price: "60", costPrice: "25", stockQuantity: 100, unit: "pcs", isActive: true, description: "Soft wheat flatbread" },
    { name: "Samosa (3 pcs)", sku: "FOOD-006", categoryId: catMap["Food"], price: "90", costPrice: "40", stockQuantity: 80, unit: "pcs", isActive: true, description: "Crispy fried pastry with filling" },
    { name: "Mandazi (4 pcs)", sku: "FOOD-007", categoryId: catMap["Food"], price: "50", costPrice: "20", stockQuantity: 120, unit: "pcs", isActive: true, description: "East African doughnuts" },
    { name: "Beef Stew & Rice", sku: "FOOD-008", categoryId: catMap["Food"], price: "280", costPrice: "150", stockQuantity: 35, unit: "plate", isActive: true, description: "Slow-cooked beef stew with rice" },
    // Beverages
    { name: "Chai (Kenyan Tea)", sku: "BEV-001", categoryId: catMap["Beverages"], price: "50", costPrice: "15", stockQuantity: 200, unit: "cup", isActive: true, description: "Spiced Kenyan milk tea" },
    { name: "Fresh Juice (500ml)", sku: "BEV-002", categoryId: catMap["Beverages"], price: "120", costPrice: "60", stockQuantity: 50, unit: "bottle", isActive: true, description: "Freshly squeezed fruit juice" },
    { name: "Soda (300ml)", sku: "BEV-003", categoryId: catMap["Beverages"], price: "60", costPrice: "35", stockQuantity: 150, unit: "bottle", isActive: true, description: "Assorted sodas" },
    { name: "Water (500ml)", sku: "BEV-004", categoryId: catMap["Beverages"], price: "40", costPrice: "20", stockQuantity: 200, unit: "bottle", isActive: true, description: "Bottled mineral water" },
    { name: "Coffee (Arabica)", sku: "BEV-005", categoryId: catMap["Beverages"], price: "150", costPrice: "60", stockQuantity: 100, unit: "cup", isActive: true, description: "Kenyan Arabica coffee" },
    { name: "Mango Juice (1L)", sku: "BEV-006", categoryId: catMap["Beverages"], price: "180", costPrice: "90", stockQuantity: 40, unit: "bottle", isActive: true, description: "Fresh mango juice" },
    // Snacks
    { name: "Crisps (100g)", sku: "SNK-001", categoryId: catMap["Snacks"], price: "80", costPrice: "45", stockQuantity: 100, unit: "pack", isActive: true, description: "Potato crisps" },
    { name: "Biscuits (200g)", sku: "SNK-002", categoryId: catMap["Snacks"], price: "120", costPrice: "70", stockQuantity: 80, unit: "pack", isActive: true, description: "Assorted biscuits" },
    { name: "Groundnuts (200g)", sku: "SNK-003", categoryId: catMap["Snacks"], price: "100", costPrice: "55", stockQuantity: 60, unit: "pack", isActive: true, description: "Roasted groundnuts" },
    { name: "Chocolate Bar", sku: "SNK-004", categoryId: catMap["Snacks"], price: "150", costPrice: "80", stockQuantity: 5, unit: "bar", isActive: true, description: "Milk chocolate bar", lowStockThreshold: 10 },
    // Electronics
    { name: "Phone Charger (Type-C)", sku: "ELEC-001", categoryId: catMap["Electronics"], price: "800", costPrice: "400", stockQuantity: 20, unit: "pcs", isActive: true, description: "Universal Type-C charger" },
    { name: "Earphones", sku: "ELEC-002", categoryId: catMap["Electronics"], price: "500", costPrice: "250", stockQuantity: 15, unit: "pcs", isActive: true, description: "Wired earphones" },
    { name: "Power Bank (10000mAh)", sku: "ELEC-003", categoryId: catMap["Electronics"], price: "2500", costPrice: "1500", stockQuantity: 8, unit: "pcs", isActive: true, description: "Portable power bank" },
    // Clothing
    { name: "T-Shirt (Plain)", sku: "CLO-001", categoryId: catMap["Clothing"], price: "500", costPrice: "250", stockQuantity: 30, unit: "pcs", isActive: true, description: "Plain cotton t-shirt" },
    { name: "Kikoi Wrap", sku: "CLO-002", categoryId: catMap["Clothing"], price: "800", costPrice: "400", stockQuantity: 20, unit: "pcs", isActive: true, description: "Traditional Kenyan kikoi" },
    // Household
    { name: "Washing Powder (1kg)", sku: "HH-001", categoryId: catMap["Household"], price: "350", costPrice: "200", stockQuantity: 40, unit: "pack", isActive: true, description: "Laundry detergent" },
    { name: "Cooking Oil (1L)", sku: "HH-002", categoryId: catMap["Household"], price: "280", costPrice: "180", stockQuantity: 25, unit: "bottle", isActive: true, description: "Refined cooking oil" },
  ]);

  // Insert customers
  await db.insert(customers).values([
    { name: "John Kamau", phone: "+254712345678", email: "john.kamau@gmail.com", address: "Westlands, Nairobi", totalSpent: "0", totalOrders: 0 },
    { name: "Mary Wanjiku", phone: "+254723456789", email: "mary.wanjiku@gmail.com", address: "Kilimani, Nairobi", totalSpent: "0", totalOrders: 0 },
    { name: "Peter Ochieng", phone: "+254734567890", email: "peter.ochieng@gmail.com", address: "Kisumu CBD", totalSpent: "0", totalOrders: 0 },
    { name: "Grace Muthoni", phone: "+254745678901", email: "grace.muthoni@gmail.com", address: "Thika Road, Nairobi", totalSpent: "0", totalOrders: 0 },
    { name: "David Kipchoge", phone: "+254756789012", email: "david.kipchoge@gmail.com", address: "Eldoret, Kenya", totalSpent: "0", totalOrders: 0 },
  ]);

  // Insert default settings
  await db.insert(settings).values([
    { key: "store_name", value: "KenPOS Store" },
    { key: "store_phone", value: "+254 700 000 000" },
    { key: "store_email", value: "info@kenpos.co.ke" },
    { key: "store_address", value: "Nairobi, Kenya" },
    { key: "store_kra_pin", value: "P051234567A" },
    { key: "tax_rate", value: "16" },
    { key: "receipt_header", value: "Asante kwa ununuzi wako! / Thank you for your purchase!" },
    { key: "receipt_footer", value: "Powered by KenPOS | www.kenpos.co.ke" },
    { key: "print_automatic", value: "false" },
    { key: "mpesa_env", value: "sandbox" },
    { key: "notify_low_stock", value: "true" },
    { key: "notify_daily_summary", value: "true" },
    { key: "notify_large_transaction", value: "true" },
    { key: "notify_large_threshold", value: "10000" },
    { key: "currency", value: "KES" },
    { key: "low_stock_threshold", value: "10" },
  ]);

  console.log("✅ Seed data inserted successfully!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
