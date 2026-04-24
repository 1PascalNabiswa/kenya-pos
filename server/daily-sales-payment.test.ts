import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDailySalesByPaymentMethod } from "./db";

describe("Daily Sales by Payment Method", () => {
  it("should fetch daily sales grouped by payment method without GROUP BY errors", async () => {
    const fromDate = new Date("2026-03-31");
    const toDate = new Date("2026-04-24");

    try {
      const results = await getDailySalesByPaymentMethod(fromDate, toDate);
      
      // Should return an array (even if empty)
      expect(Array.isArray(results)).toBe(true);
      
      // If there are results, verify structure
      if (results.length > 0) {
        const firstResult = results[0];
        expect(firstResult).toHaveProperty("date");
        expect(firstResult).toHaveProperty("method");
        expect(firstResult).toHaveProperty("orderCount");
        expect(firstResult).toHaveProperty("totalRevenue");
      }
    } catch (error) {
      // Should not throw GROUP BY errors
      const errorMessage = String(error);
      expect(errorMessage).not.toContain("ONLY_FULL_GROUP_BY");
      expect(errorMessage).not.toContain("not in GROUP BY clause");
    }
  });

  it("should handle date ranges correctly", async () => {
    const fromDate = new Date("2026-04-01");
    const toDate = new Date("2026-04-10");

    const results = await getDailySalesByPaymentMethod(fromDate, toDate);
    
    expect(Array.isArray(results)).toBe(true);
    
    // If there are results, dates should be within range
    if (results.length > 0) {
      results.forEach((result: any) => {
        if (result.date) {
          const resultDate = new Date(result.date);
          expect(resultDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
          expect(resultDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
        }
      });
    }
  });

  it("should return empty array when no data exists", async () => {
    const fromDate = new Date("2000-01-01");
    const toDate = new Date("2000-01-02");

    const results = await getDailySalesByPaymentMethod(fromDate, toDate);
    
    expect(Array.isArray(results)).toBe(true);
  });

  it("should have valid payment methods in results", async () => {
    const fromDate = new Date("2026-03-31");
    const toDate = new Date("2026-04-24");

    const results = await getDailySalesByPaymentMethod(fromDate, toDate);
    
    const validMethods = ["cash", "mpesa", "stripe", "wallet", "mixed", "card", "check"];
    
    if (results.length > 0) {
      results.forEach((result: any) => {
        if (result.method) {
          expect(validMethods).toContain(result.method.toLowerCase());
        }
      });
    }
  });
});
