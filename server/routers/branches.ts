import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBranch,
  listBranches,
  setBranchActive,
  updateBranch,
  deleteBranch,
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
  userHasBranchAccess,
  isBranchActive,
} from "../db";

export const branchesRouter = router({
  // Branch Management
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, "Branch name is required"),
        location: z.string().trim().optional(),
        phone: z.string().trim().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin")
        throw new Error("Only admins can create branches");
      return createBranch(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().trim().min(1, "Branch name is required"),
        location: z.string().trim().optional(),
        phone: z.string().trim().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update branches",
        });
      }
      const { id, ...data } = input;
      return updateBranch(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete branches",
        });
      }
      return deleteBranch(input.id);
    }),

  setActive: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can change branch status",
        });
      }
      return setBranchActive(input.id, input.isActive);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can list all branches",
      });
    }
    return listBranches();
  }),

  listActive: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can list all active branches",
      });
    }
    return listBranches({ activeOnly: true });
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
    .input(
      z.object({
        userId: z.number(),
        branchId: z.number(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin")
        throw new Error("Only admins can assign users to branches");
      return assignUserToBranch(input.userId, input.branchId, input.isPrimary);
    }),

  removeUser: protectedProcedure
    .input(z.object({ userId: z.number(), branchId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin")
        throw new Error("Only admins can remove users from branches");
      return removeUserFromBranch(input.userId, input.branchId);
    }),

  // Stock Transfers
  initiateTransfer: protectedProcedure
    .input(
      z.object({
        fromBranchId: z.number(),
        toBranchId: z.number(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            productName: z.string(),
            quantity: z.number().min(1),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      if (
        !(await isBranchActive(input.fromBranchId)) ||
        !(await isBranchActive(input.toBranchId))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Transfers can only use active branches",
        });
      }
      if (
        ctx.user.role !== "admin" &&
        !(await userHasBranchAccess(ctx.user.id, input.fromBranchId))
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to the source branch",
        });
      }
      if (input.fromBranchId === input.toBranchId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Source and destination branches must be different",
        });
      }
      return createStockTransfer({
        ...input,
        initiatedBy: ctx.user.id,
      });
    }),

  getTransfers: protectedProcedure
    .input(
      z.object({
        fromBranchId: z.number().optional(),
        toBranchId: z.number().optional(),
        status: z
          .enum(["pending", "in_transit", "received", "cancelled"])
          .optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role === "admin") return getStockTransfers(input);
      const assignedBranches = await getUserBranches(ctx.user.id);
      if (assignedBranches.length === 0) return [];
      return getStockTransfers({
        ...input,
        branchIds: assignedBranches.map(branch => branch.branchId),
      });
    }),

  getTransferDetails: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .query(async ({ input, ctx }) => {
      const transfer = await getStockTransferDetails(input.transferId);
      if (!transfer) return null;
      if (ctx.user.role !== "admin") {
        const canAccessFrom = await userHasBranchAccess(
          ctx.user.id,
          transfer.fromBranchId
        );
        const canAccessTo = await userHasBranchAccess(
          ctx.user.id,
          transfer.toBranchId
        );
        if (!canAccessFrom && !canAccessTo) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to either transfer branch",
          });
        }
      }
      return transfer;
    }),

  approveTransfer: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      if (ctx.user.role !== "admin")
        throw new Error("Only admins can approve transfers");
      return approveStockTransfer(input.transferId, ctx.user.id);
    }),

  receiveTransfer: protectedProcedure
    .input(
      z.object({
        transferId: z.number(),
        items: z.array(
          z.object({
            itemId: z.number(),
            receivedQuantity: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const transfer = await getStockTransferDetails(input.transferId);
      if (!transfer)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stock transfer not found",
        });
      if (
        ctx.user.role !== "admin" &&
        !(await userHasBranchAccess(ctx.user.id, transfer.toBranchId))
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to the destination branch",
        });
      }
      return receiveStockTransfer(input.transferId, ctx.user.id, input.items);
    }),

  cancelTransfer: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin")
        throw new Error("Only admins can cancel transfers");
      return cancelStockTransfer(input.transferId);
    }),
});
