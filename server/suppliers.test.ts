import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSupplier, listSuppliers } from "./db";

describe("Suppliers Management", () => {
  let supplierId: number;

  it("should create a new supplier", async () => {
    const result = await createSupplier({
      name: "Test Supplier Co.",
      contactPerson: "John Doe",
      phoneNumber: "+254712345678",
      email: "john@testsupplier.com",
      address: "123 Main St",
      city: "Nairobi",
      paymentTerms: "Net 30",
    });

    expect(result).toBeDefined();
    expect(result?.insertId).toBeGreaterThan(0);
    supplierId = result?.insertId || 0;
  });

  it("should list all suppliers", async () => {
    const suppliers = await listSuppliers();
    
    expect(Array.isArray(suppliers)).toBe(true);
    expect(suppliers.length).toBeGreaterThan(0);
    
    // Check that supplier has expected fields
    const supplier = suppliers[0];
    expect(supplier).toHaveProperty("id");
    expect(supplier).toHaveProperty("name");
    expect(supplier).toHaveProperty("email");
    expect(supplier).toHaveProperty("phoneNumber");
  });

  it("should have correct supplier data structure", async () => {
    const suppliers = await listSuppliers();
    
    if (suppliers.length > 0) {
      const supplier = suppliers[0];
      
      // Verify all expected fields exist
      expect(supplier).toHaveProperty("id");
      expect(supplier).toHaveProperty("name");
      expect(supplier).toHaveProperty("contactPerson");
      expect(supplier).toHaveProperty("phoneNumber");
      expect(supplier).toHaveProperty("email");
      expect(supplier).toHaveProperty("address");
      expect(supplier).toHaveProperty("city");
      expect(supplier).toHaveProperty("paymentTerms");
      expect(supplier).toHaveProperty("createdAt");
      expect(supplier).toHaveProperty("updatedAt");
    }
  });

  it("should return suppliers ordered by creation date (newest first)", async () => {
    const suppliers = await listSuppliers();
    
    if (suppliers.length > 1) {
      // Check that suppliers are ordered by createdAt descending
      for (let i = 0; i < suppliers.length - 1; i++) {
        const current = new Date(suppliers[i].createdAt).getTime();
        const next = new Date(suppliers[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });
});
