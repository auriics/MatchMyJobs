import { prisma } from '../config/prisma.js';

export interface CreateAuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Record an administrative or security audit event asynchronously.
   * Fails silently so it never interrupts the core transaction.
   */
  static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || undefined,
          userEmail: params.userEmail || undefined,
          userRole: params.userRole || undefined,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId || undefined,
          details: params.details || undefined,
          ipAddress: params.ipAddress || undefined,
          userAgent: params.userAgent ? params.userAgent.substring(0, 255) : undefined,
        },
      });
    } catch (error) {
      console.error('[AuditService] Failed to record audit log:', error);
    }
  }

  /**
   * Query recent audit logs with optional filters
   */
  static async getLogs(options: {
    limit?: number;
    offset?: number;
    action?: string;
    resource?: string;
    userId?: string;
  }) {
    const { limit = 50, offset = 0, action, resource, userId } = options;

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
    };
  }
}
