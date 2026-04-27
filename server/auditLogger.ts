import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

export interface AuditLogEntry {
  userId: number;
  action: string;
  module: string;
  entityType?: string;
  entityId?: number;
  beforeValue?: any;
  afterValue?: any;
  deviceId?: string;
  ipAddress?: string;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      module: entry.module,
      entityType: entry.entityType,
      entityId: entry.entityId,
      beforeValue: entry.beforeValue ? JSON.stringify(entry.beforeValue) : null,
      afterValue: entry.afterValue ? JSON.stringify(entry.afterValue) : null,
      deviceId: entry.deviceId,
      ipAddress: entry.ipAddress,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break main operations
  }
}

/**
 * Log user role assignment
 */
export async function logRoleAssignment(
  userId: number,
  targetUserId: number,
  previousRole: string,
  newRole: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'ROLE_ASSIGNED',
    module: 'USER_MANAGEMENT',
    entityType: 'USER_ROLE',
    entityId: targetUserId,
    beforeValue: { role: previousRole },
    afterValue: { role: newRole },
    ipAddress,
  });
}

/**
 * Log user creation
 */
export async function logUserCreation(
  userId: number,
  newUserId: number,
  userData: any,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'USER_CREATED',
    module: 'USER_MANAGEMENT',
    entityType: 'USER',
    entityId: newUserId,
    beforeValue: null,
    afterValue: userData,
    ipAddress,
  });
}

/**
 * Log user deletion
 */
export async function logUserDeletion(
  userId: number,
  deletedUserId: number,
  userData: any,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'USER_DELETED',
    module: 'USER_MANAGEMENT',
    entityType: 'USER',
    entityId: deletedUserId,
    beforeValue: userData,
    afterValue: null,
    ipAddress,
  });
}

/**
 * Log role permission modification
 */
export async function logRolePermissionChange(
  userId: number,
  roleId: string,
  roleName: string,
  previousPermissions: any,
  newPermissions: any,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'ROLE_PERMISSIONS_MODIFIED',
    module: 'ROLE_MANAGEMENT',
    entityType: 'ROLE',
    entityId: parseInt(roleId) || 0,
    beforeValue: { role: roleName, permissions: previousPermissions },
    afterValue: { role: roleName, permissions: newPermissions },
    ipAddress,
  });
}

/**
 * Log custom role creation
 */
export async function logCustomRoleCreation(
  userId: number,
  roleName: string,
  permissions: any,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'CUSTOM_ROLE_CREATED',
    module: 'ROLE_MANAGEMENT',
    entityType: 'CUSTOM_ROLE',
    beforeValue: null,
    afterValue: { name: roleName, permissions },
    ipAddress,
  });
}

/**
 * Log custom role deletion
 */
export async function logCustomRoleDeletion(
  userId: number,
  roleName: string,
  permissions: any,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'CUSTOM_ROLE_DELETED',
    module: 'ROLE_MANAGEMENT',
    entityType: 'CUSTOM_ROLE',
    beforeValue: { name: roleName, permissions },
    afterValue: null,
    ipAddress,
  });
}

/**
 * Log access denied event
 */
export async function logAccessDenied(
  userId: number,
  attemptedAction: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'ACCESS_DENIED',
    module: 'SECURITY',
    entityType: 'ACCESS_ATTEMPT',
    beforeValue: { action: attemptedAction, reason },
    afterValue: null,
    ipAddress,
  });
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: number, limit: number = 100) {
  const db = await getDb();
  return db
    .select()
    .from(auditLogs)
    .where((logs) => logs.userId === userId)
    .orderBy((logs) => logs.timestamp)
    .limit(limit);
}

/**
 * Get audit logs for a specific entity (e.g., user role changes)
 */
export async function getEntityAuditLogs(entityType: string, entityId: number, limit: number = 100) {
  const db = await getDb();
  return db
    .select()
    .from(auditLogs)
    .where(
      (logs) =>
        logs.entityType === entityType && logs.entityId === entityId
    )
    .orderBy((logs) => logs.timestamp)
    .limit(limit);
}

/**
 * Get all role-related audit logs
 */
export async function getRoleAuditLogs(limit: number = 100) {
  const db = await getDb();
  return db
    .select()
    .from(auditLogs)
    .where(
      (logs) =>
        logs.module === 'USER_MANAGEMENT' || logs.module === 'ROLE_MANAGEMENT'
    )
    .orderBy((logs) => logs.timestamp)
    .limit(limit);
}
