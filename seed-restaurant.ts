import { getDb } from "./server/db";
import { 
  categories, products, inventoryLogs, orderItems, orders,
  paymentMethods, transactionReconciliation, walletTransactions,
  creditTransactions
} from "./drizzle/schema";
import { eq } from "drizzle-orm";

const restaurantMenu = [
  { category: "Beverages - Hot", items: [
    { name: "BLACK TEA", price: 20 },
    { name: "BLACK COFFEE", price: 30 },
    { name: "TEA", price: 20 },
    { name: "S TEA", price: 35 },
    { name: "TEA T", price: 50 },
    { name: "TEA VOUCHER", price: 35 },
  ]},
  { category: "Beverages - Cold", items: [
    { name: "JUICE", price: 50 },
    { name: "MINUTE MAID 400ML", price: 85 },
    { name: "AFIA 500ML", price: 90 },
    { name: "300ML COCACOLA SODA", price: 50 },
    { name: "SODA 500ML", price: 60 },
    { name: "COKE PET 500ML", price: 80 },
    { name: "PEPSI 500ML PET", price: 70 },
    { name: "COKE 350ML", price: 60 },
    { name: "PEPSI 330ML PET", price: 50 },
    { name: "SODA 300ML", price: 45 },
    { name: "MINERAL WATER", price: 50 },
    { name: "STING ENERGY DRINK 330ML", price: 50 },
    { name: "ENEGY DRINK 400ML", price: 65 },
    { name: "ENEGY DRINK 300ML", price: 50 },
  ]},
  { category: "Dairy & Yogurt", items: [
    { name: "YOGHURT (GRACIES) 500ML", price: 120 },
    { name: "YOGHURT (GRACIES) 150ML", price: 50 },
    { name: "YOGHURT (GRACIES) 250ML", price: 65 },
    { name: "YOGHURT 500ML (DELIGHT)", price: 130 },
  ]},
  { category: "Fruits & Vegetables", items: [
    { name: "PASSION FRUIT", price: 20 },
    { name: "TREE TOMATO", price: 20 },
    { name: "PINEAPPLE PORTION", price: 20 },
    { name: "PINEAPPLE SWEET SALAD", price: 50 },
    { name: "SWEET SALAD", price: 50 },
    { name: "APPLE FRUIT", price: 50 },
    { name: "ORANGE FRUIT", price: 20 },
    { name: "BANANA", price: 10 },
    { name: "RIPE BANANA", price: 10 },
    { name: "WATERMELON PORTION", price: 20 },
    { name: "BROCCOLI", price: 50 },
    { name: "VEG SALAD", price: 30 },
    { name: "KACHUMBARI", price: 40 },
    { name: "COLESLAW", price: 40 },
    { name: "SUKUMAWIKI", price: 30 },
    { name: "CABBAGE", price: 25 },
    { name: "SPINACH", price: 60 },
    { name: "TOMATO SAUCE", price: 10 },
  ]},
  { category: "Grains & Staples", items: [
    { name: "BROWN UGALI", price: 60 },
    { name: "UGALI", price: 40 },
    { name: "RICE PORTION", price: 50 },
    { name: "SPAGHETTI", price: 80 },
    { name: "GITHERI", price: 70 },
    { name: "PILAU", price: 80 },
    { name: "MATOKE", price: 80 },
    { name: "CHIPS", price: 120 },
    { name: "POTATO WEDGES", price: 120 },
    { name: "MASHED POTATO", price: 80 },
    { name: "NDUMA", price: 30 },
    { name: "SWEET POTATO", price: 25 },
    { name: "MOKIMO", price: 100 },
    { name: "NDENGU", price: 50 },
    { name: "NJAHI\\BLACK BEANS", price: 100 },
    { name: "BEANS", price: 50 },
    { name: "MINJI", price: 100 },
  ]},
  { category: "Proteins & Meat", items: [
    { name: "CHICKEN LOLLIPOP", price: 50 },
    { name: "CHICKEN PIE", price: 120 },
    { name: "MEAT PIE", price: 80 },
    { name: "FISH IN BUTTER", price: 180 },
    { name: "GOAT STEW", price: 250 },
    { name: "MERYLAND CHICKEN", price: 150 },
    { name: "FISH FINGERS", price: 130 },
    { name: "FISH", price: 170 },
    { name: "CHICKEN PORTION", price: 120 },
    { name: "BEEF STEW", price: 120 },
    { name: "GOAT MEAT", price: 170 },
    { name: "MATUMBO", price: 150 },
    { name: "LIVER", price: 200 },
    { name: "MINCED MEAT", price: 120 },
    { name: "OMENA", price: 60 },
    { name: "BHAJIA", price: 200 },
    { name: "KIENYEJI", price: 60 },
    { name: "KAMANDE", price: 80 },
  ]},
  { category: "Prepared Dishes", items: [
    { name: "BIRIANI", price: 80 },
    { name: "PUICIN HERBED POTATOES", price: 150 },
    { name: "SAUSAGE ROLL", price: 70 },
    { name: "UJI", price: 50 },
    { name: "KEBAB", price: 70 },
    { name: "FRIED EGG", price: 50 },
    { name: "EGG CURRY", price: 30 },
    { name: "BOILED EGG", price: 25 },
    { name: "CHOMA SAUSAGE", price: 70 },
    { name: "BEEF SAUSAGE", price: 45 },
    { name: "BEEF SMOKIE", price: 40 },
  ]},
  { category: "Bread & Bakery", items: [
    { name: "NAAN(INDIAN) BREAD", price: 30 },
    { name: "TOAST BREAD", price: 30 },
    { name: "BREAD", price: 15 },
    { name: "CARROT CAKE", price: 100 },
    { name: "CUPCAKE", price: 50 },
    { name: "CAKE", price: 50 },
    { name: "CINNAMON ROLL", price: 60 },
    { name: "SMALL BUN", price: 30 },
    { name: "DOUGHNUT", price: 30 },
    { name: "MANDAZI", price: 15 },
    { name: "CHAPATI", price: 30 },
    { name: "TEA SCONE", price: 25 },
    { name: "PANCAKE", price: 30 },
  ]},
  { category: "Snacks & Sides", items: [
    { name: "SAMOSA", price: 40 },
    { name: "VEG SPRING ROLL", price: 30 },
    { name: "SPRING ROLL", price: 60 },
    { name: "CHIPS MASALA", price: 140 },
  ]},
  { category: "Services", items: [
    { name: "DISPOSAL", price: 100 },
    { name: "PHOTOCOPY", price: 5 },
    { name: "PRINTING", price: 10 },
    { name: "TAKE AWAY CUP", price: 20 },
    { name: "TAKE AWAY PLATE", price: 35 },
  ]},
  { category: "Test Items", items: [
    { name: "TEST 5", price: 5 },
    { name: "TEST 10", price: 10 },
  ]},
];

async function seedRestaurantMenu() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    console.log("Starting restaurant menu seed...");
    
    // Delete in complete dependency order
    console.log("Clearing dependent records...");
    await db.delete(creditTransactions);
    await db.delete(walletTransactions);
    await db.delete(transactionReconciliation);
    await db.delete(paymentMethods);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(inventoryLogs);
    await db.delete(products);
    await db.delete(categories);

    // Create categories and insert products
    let totalItems = 0;
    for (const categoryGroup of restaurantMenu) {
      // Insert category
      await db.insert(categories).values({
        name: categoryGroup.category,
        description: `${categoryGroup.category} - Rongai-Nazarene Branch`,
      });

      // Get the inserted category ID
      const getCat = await db.select().from(categories).where(eq(categories.name, categoryGroup.category)).limit(1);
      const categoryId = getCat[0]?.id;
      
      console.log(`Created category: ${categoryGroup.category} (ID: ${categoryId})`);

      // Insert products for this category
      if (categoryId) {
        for (const item of categoryGroup.items) {
          await db.insert(products).values({
            name: item.name,
            price: item.price,
            categoryId: categoryId,
            stock: 100,
            description: `${item.name} - ${item.price} KES`,
          });
          totalItems++;
        }
        console.log(`  Added ${categoryGroup.items.length} items`);
      }
    }

    console.log("\n✅ Restaurant menu seeded successfully!");
    console.log(`Total categories: ${restaurantMenu.length}`);
    console.log(`Total items: ${totalItems}`);
  } catch (error) {
    console.error("Error seeding restaurant menu:", error);
  }
}

seedRestaurantMenu().then(() => process.exit(0));
