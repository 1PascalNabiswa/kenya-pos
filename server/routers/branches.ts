import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBranch,
  listBranches,
  assignUserToBranch,
  getUserBranches,
  getPrimaryBranch,
  removeUserFromBranch,
  createStockTransfer,
  getStockTransfers,
  getStockTransferDetails,
  approveStockTransfer,
  receiveStockTransfer,
  cancelStockTransfer,
} from "../db";

export const branchesRouter = router({
  // Branch Management
  create: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1, "Branch name is required"),
      location: z.string().trim().optional(),
      phone: z.string().trim().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can create branches");
      return createBranch(input);
    }),

  list: protectedProcedure.query(async () => {
    return listBranches();
  }),

  // User-Branch Assignment
  getMyBranches: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return getUserBranches(ctx.user.id);
  }),

  getPrimaryBranch: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return getPrimaryBranch(ctx.user.id);
  }),

  getUserBranches: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.id !== input.userId) {
        throw new Error("Not authorized");
      }
      return getUserBranches(input.userId);
    }),

  assignUser: protectedProcedure
    .input(z.object({ userId: z.number(), branchId: z.number(), isPrimary: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can assign users to branches");
      return assignUserToBranch(input.userId, input.branchId, input.isPrimary);
    }),

  removeUser: protectedProcedure
    .input(z.object({ userId: z.number(), branchId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can remove users from branches");
      return removeUserFromBranch(input.userId, input.branchId);
    }),

  // Stock Transfers
  initiateTransfer: protectedProcedure
    .input(z.object({
      fromBranchId: z.number(),
      toBranchId: z.number(),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        productName: z.string(),
        quantity: z.number().min(1),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return createStockTransfer({
        ...input,
        initiatedBy: ctx.user.id,
      });
    }),

  getTransfers: protectedProcedure
    .input(z.object({
      fromBranchId: z.number().optional(),
      toBranchId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      return getStockTransfers(input);
    }),

  getTransferDetails: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .query(async ({ input }) => {
      return getStockTransferDetails(input.transferId);
    }),

  approveTransfer: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      if (ctx.user.role !== "admin") throw new Error("Only admins can approve transfers");
      return approveStockTransfer(input.transferId, ctx.user.id);
    }),

  receiveTransfer: protectedProcedure
    .input(z.object({
      transferId: z.number(),
      items: z.array(z.object({
        itemId: z.number(),
        receivedQuantity: z.number().min(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return receiveStockTransfer(input.transferId, ctx.user.id, input.items);
    }),

  cancelTransfer: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can cancel transfers");
      return cancelStockTransfer(input.transferId);
    }),
});
