import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSupplier, listSuppliers, updateSupplier, deleteSupplier } from "./db";

describe("Suppliers Management", () => {
  let supplierId: number;

  it("should create a new supplier", async () => {
    const result = await createSupplier({
      name: "Test Supplier Co.",
      email: "john@testsupplier.com",
    });

    expect(result).toBeDefined();
    expect(result?.insertId || result?.[0]?.insertId).toBeGreaterThan(0);
    supplierId = result?.insertId || result?.[0]?.insertId || 0;
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
  });

  it("should have correct supplier data structure", async () => {
    const suppliers = await listSuppliers();
    
    if (suppliers.length > 0) {
      const supplier = suppliers[0];
      
      // Verify all expected fields exist
      expect(supplier).toHaveProperty("id");
      expect(supplier).toHaveProperty("name");
      expect(supplier).toHaveProperty("email");
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

  it("should update a supplier", async () => {
    if (supplierId > 0) {
      const result = await updateSupplier(supplierId, {
        name: "Updated Supplier Co.",
        email: "updated@testsupplier.com"
      });
      expect(result).toBeDefined();

      // Verify the update
      const suppliers = await listSuppliers();
      const updated = suppliers.find(s => s.id === supplierId);
      expect(updated?.name).toBe("Updated Supplier Co.");
      expect(updated?.email).toBe("updated@testsupplier.com");
    }
  });

  it("should delete a supplier", async () => {
    if (supplierId > 0) {
      const result = await deleteSupplier(supplierId);
      expect(result).toBeDefined();

      // Verify the deletion
      const suppliers = await listSuppliers();
      const deleted = suppliers.find(s => s.id === supplierId);
      expect(deleted).toBeUndefined();
    }
  });
});
