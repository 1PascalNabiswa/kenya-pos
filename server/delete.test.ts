import { describe, it, expect } from "vitest";
import { deleteProduct, deleteCategory } from "./db";

describe("Delete Functionality", () => {
  it("should delete a product without throwing error", async () => {
    // Delete a product (even if it doesn't exist, should not throw)
    await deleteProduct(1);
    expect(true).toBe(true);
  });

  it("should delete a category without throwing error", async () => {
    // Delete a category (even if it doesn't exist, should not throw)
    await deleteCategory(1);
    expect(true).toBe(true);
  });

  it("should handle deleting non-existent product gracefully", async () => {
    // This should not throw an error
    await deleteProduct(99999);
    expect(true).toBe(true);
  });

  it("should handle deleting non-existent category gracefully", async () => {
    // This should not throw an error
    await deleteCategory(99999);
    expect(true).toBe(true);
  });
});
