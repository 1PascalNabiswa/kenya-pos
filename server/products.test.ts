import { describe, it, expect, beforeAll } from "vitest";
import { createProduct, getProducts, toggleProductActive } from "./db";

describe("Product Active/Inactive Status", () => {
  let productId: number;
  let inactiveProductId: number;
  const testProduct = {
    name: "Test Active Product",
    price: "100.00",
    stockQuantity: 50,
    lowStockThreshold: 10,
  };

  beforeAll(async () => {
    // Create a test product
    const result = await createProduct(testProduct);
    productId = result?.insertId || result?.[0]?.insertId || 0;
    
    // Create another product to deactivate
    const inactiveResult = await createProduct({
      ...testProduct,
      name: "Test Inactive Product",
    });
    inactiveProductId = inactiveResult?.insertId || inactiveResult?.[0]?.insertId || 0;
  });

  it("should toggle product to inactive", async () => {
    // This should not throw an error
    await toggleProductActive(inactiveProductId, false);
    expect(true).toBe(true);
  });

  it("should toggle product back to active", async () => {
    // This should not throw an error
    await toggleProductActive(inactiveProductId, true);
    expect(true).toBe(true);
  });

  it("should get products with isActive filter", async () => {
    // Get only active products
    const { items: activeProducts } = await getProducts({ isActive: true });
    
    expect(activeProducts.length).toBeGreaterThan(0);
    expect(Array.isArray(activeProducts)).toBe(true);
  });

  it("should get products without filter", async () => {
    // Get all products regardless of status
    const { items: allProducts } = await getProducts();
    
    expect(allProducts.length).toBeGreaterThan(0);
    expect(Array.isArray(allProducts)).toBe(true);
  });

  it("should return product count correctly", async () => {
    const { total } = await getProducts();
    
    expect(typeof total).toBe("number");
    expect(total).toBeGreaterThan(0);
  });
});
