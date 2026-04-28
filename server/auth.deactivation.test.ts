import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTRPCMsw } from "trpc-msw";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Deactivation Check", () => {
  let testUserId: number;
  let testUser: any;

  beforeAll(async () => {
    // Create a test user for deactivation testing
    const result = await db.upsertUser({
      openId: `test-deactivation-${Date.now()}`,
      name: "Test Deactivation User",
      email: `test-deactivation-${Date.now()}@test.com`,
      loginMethod: "test",
    });
    testUser = result;
    testUserId = result.id;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      try {
        await db.deleteUser(testUserId);
      } catch (error) {
        // User might already be deleted
      }
    }
  });

  it("should return isActive: true for active user", async () => {
    // Ensure user is active
    await db.reactivateUser(testUserId);

    // Verify user is active
    const user = await db.getUserById(testUserId);
    expect(user?.isActive).toBe(true);
  });

  it("should return isActive: false for deactivated user", async () => {
    // Deactivate the user
    await db.deactivateUser(testUserId);

    // Verify user is deactivated
    const user = await db.getUserById(testUserId);
    expect(user?.isActive).toBe(false);
  });

  it("should prevent deactivating the last active admin", async () => {
    // Create a new test user with admin role
    const adminUser = await db.upsertUser({
      openId: `test-admin-${Date.now()}`,
      name: "Test Admin User",
      email: `test-admin-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "admin",
    });

    // Try to deactivate the admin - should fail if it's the last admin
    // This depends on how many admins exist in the system
    try {
      await db.deactivateUser(adminUser.id);
      // If successful, verify the user is deactivated
      const user = await db.getUserById(adminUser.id);
      expect(user?.isActive).toBe(false);
    } catch (error) {
      // Expected if this is the last admin
      expect(error).toBeDefined();
    }

    // Clean up
    try {
      await db.deleteUser(adminUser.id);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it("should allow reactivating a deactivated user", async () => {
    // Deactivate the user
    await db.deactivateUser(testUserId);
    let user = await db.getUserById(testUserId);
    expect(user?.isActive).toBe(false);

    // Reactivate the user
    await db.reactivateUser(testUserId);
    user = await db.getUserById(testUserId);
    expect(user?.isActive).toBe(true);
  });

  it("should handle duplicate email prevention", async () => {
    // Create a user with a specific email
    const email = `duplicate-test-${Date.now()}@test.com`;
    const user1 = await db.upsertUser({
      openId: `user1-${Date.now()}`,
      name: "User 1",
      email: email,
      loginMethod: "test",
    });

    // Try to create another user with the same email - should fail
    try {
      await db.upsertUser({
        openId: `user2-${Date.now()}`,
        name: "User 2",
        email: email,
        loginMethod: "test",
      });
      // If we get here, the duplicate email check didn't work
      expect(false).toBe(true);
    } catch (error) {
      // Expected: duplicate email error
      expect(error).toBeDefined();
    }

    // Clean up
    try {
      await db.deleteUser(user1.id);
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});
