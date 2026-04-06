import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createStaffProfile,
  getStaffProfile,
  getStaffProfileByUserId,
  listStaffProfiles,
  updateStaffProfile,
  deleteStaffProfile,
  recordStaffActivity,
  getStaffActivityLogs,
} from "./db";

describe("Staff Management", () => {
  let staffId: number;
  const testUserId = 1;

  describe("Staff Profiles", () => {
    it("should create a staff profile", async () => {
      const result = await createStaffProfile({
        userId: testUserId,
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+254712345678",
        employeeId: "EMP001",
        department: "Kitchen",
        position: "Chef",
        status: "active",
      });

      expect(result).toBeDefined();
      staffId = (result as any).insertId;
      expect(staffId).toBeGreaterThan(0);
    });

    it("should retrieve a staff profile by ID", async () => {
      const profile = await getStaffProfile(staffId);
      expect(profile).toBeDefined();
      expect(profile?.firstName).toBe("John");
      expect(profile?.lastName).toBe("Doe");
      expect(profile?.employeeId).toBe("EMP001");
    });

    it("should retrieve a staff profile by user ID", async () => {
      const profile = await getStaffProfileByUserId(testUserId);
      expect(profile).toBeDefined();
      expect(profile?.userId).toBe(testUserId);
      expect(profile?.firstName).toBe("John");
    });

    it("should list staff profiles", async () => {
      const profiles = await listStaffProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles.some((p: any) => p.id === staffId)).toBe(true);
    });

    it("should list staff profiles with status filter", async () => {
      const profiles = await listStaffProfiles({ status: "active" });
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.every((p: any) => p.status === "active")).toBe(true);
    });

    it("should list staff profiles with search filter", async () => {
      const profiles = await listStaffProfiles({ search: "John" });
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.some((p: any) => p.firstName.includes("John"))).toBe(true);
    });

    it("should update a staff profile", async () => {
      await updateStaffProfile(staffId, {
        position: "Head Chef",
        department: "Operations",
      } as any);

      const updated = await getStaffProfile(staffId);
      expect(updated?.position).toBe("Head Chef");
      expect(updated?.department).toBe("Operations");
    });

    it("should delete a staff profile", async () => {
      await deleteStaffProfile(staffId);
      const deleted = await getStaffProfile(staffId);
      expect(deleted).toBeNull();
    });
  });

  describe("Staff Activity Logs", () => {
    it("should record staff activity", async () => {
      const result = await recordStaffActivity({
        userId: testUserId,
        activityType: "login",
        description: "User logged in",
        status: "success",
      });

      expect(result).toBeDefined();
    });

    it("should record activity with entity reference", async () => {
      const result = await recordStaffActivity({
        userId: testUserId,
        activityType: "create_order",
        description: "Created order #123",
        entityType: "Order",
        entityId: 123,
        status: "success",
      });

      expect(result).toBeDefined();
    });

    it("should record failed activity", async () => {
      const result = await recordStaffActivity({
        userId: testUserId,
        activityType: "process_payment",
        description: "Payment processing failed",
        status: "failure",
      });

      expect(result).toBeDefined();
    });

    it("should retrieve staff activity logs", async () => {
      const logs = await getStaffActivityLogs({ userId: testUserId });
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every((log: any) => log.userId === testUserId)).toBe(true);
    });

    it("should retrieve activity logs by activity type", async () => {
      const logs = await getStaffActivityLogs({ activityType: "login" });
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.every((log: any) => log.activityType === "login")).toBe(true);
    });

    it("should retrieve activity logs with limit", async () => {
      const logs = await getStaffActivityLogs({ limit: 5 });
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeLessThanOrEqual(5);
    });

    it("should retrieve activity logs with date range", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const logs = await getStaffActivityLogs({
        startDate,
        endDate,
      });

      expect(Array.isArray(logs)).toBe(true);
      logs.forEach((log: any) => {
        const logDate = new Date(log.createdAt);
        expect(logDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(logDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe("Staff Activity Summary", () => {
    it("should handle multiple activity types", async () => {
      const activities = [
        { type: "login", description: "User logged in" },
        { type: "create_order", description: "Created order" },
        { type: "process_payment", description: "Processed payment" },
        { type: "logout", description: "User logged out" },
      ];

      for (const activity of activities) {
        await recordStaffActivity({
          userId: testUserId,
          activityType: activity.type as any,
          description: activity.description,
          status: "success",
        });
      }

      const logs = await getStaffActivityLogs({ userId: testUserId });
      expect(logs.length).toBeGreaterThanOrEqual(activities.length);

      const types = logs.map((log: any) => log.activityType);
      activities.forEach((activity) => {
        expect(types).toContain(activity.type);
      });
    });
  });
});
