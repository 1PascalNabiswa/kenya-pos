import { describe, expect, it } from "vitest";
import { mergeBranchInventory, normalizeBranchInput } from "./db";

describe("branch insert mapping", () => {
  it("maps the form payload to the live branches columns", () => {
    expect(
      normalizeBranchInput({
        name: "  Rongai QA Branch  ",
        location: " Rongai, Nairobi ",
        phone: " +254 712 345 678 ",
      })
    ).toEqual({
      name: "Rongai QA Branch",
      location: "Rongai, Nairobi",
      phone: "+254 712 345 678",
      manager: null,
    });
  });

  it("rejects blank branch names before touching the database", () => {
    expect(() => normalizeBranchInput({ name: "   " })).toThrow(
      "Branch name is required"
    );
  });

  it("projects branch quantities without leaking the global product stock", () => {
    const products = [
      { id: 1, name: "Milk", stockQuantity: 80, lowStockThreshold: 10 },
      { id: 2, name: "Bread", stockQuantity: 40, lowStockThreshold: 8 },
    ];

    expect(
      mergeBranchInventory(products, [
        { productId: 1, stockQuantity: 3, lowStockThreshold: 5 },
      ])
    ).toEqual([
      { id: 1, name: "Milk", stockQuantity: 3, lowStockThreshold: 5 },
      { id: 2, name: "Bread", stockQuantity: 0, lowStockThreshold: 8 },
    ]);
  });
});
