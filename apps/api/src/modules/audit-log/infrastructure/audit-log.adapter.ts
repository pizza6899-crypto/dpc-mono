import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { AuditLogRepositoryPort } from '../ports/out/audit-log.repository.port';
import type {
  AuthLogPayload,
  ActivityLogPayload,
  SystemErrorLogPayload,
  IntegrationLogPayload,
} from '../domain';

/**
 * Audit Log Adapter
 * 포트를 구현하여 DB에 직접 저장하는 어댑터
 */
@Injectable()
export class AuditLogAdapter implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async saveAuthLog(id: string, payload: AuthLogPayload): Promise<void> {
    await this.prisma.authAuditLog.create({
      data: {
        id,
        createdAt: new Date(),
        userId: payload.userId ? BigInt(payload.userId) : null,
        action: payload.action,
        status: payload.status,
        ip: payload.ip || null,
        userAgent: payload.userAgent || null,
        deviceFingerprint: payload.deviceFingerprint || null,
        // Cloudflare 지리적 정보
        country: payload.country || null,
        city: payload.city || null,
        // Cloudflare 보안 정보
        bot: payload.bot ?? null,
        threat: payload.threat || null,
        // 디바이스 정보
        isMobile: payload.isMobile ?? null,
        // Cloudflare 추적 정보
        cfRay: payload.cfRay || null,
        metadata: payload.metadata || undefined,
      },
    });
  }

  async saveActivityLog(
    id: string,
    payload: ActivityLogPayload,
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        id,
        createdAt: new Date(),
        userId: payload.userId ? BigInt(payload.userId) : null,
        category: payload.category,
        action: payload.action,
        metadata: payload.metadata || undefined,
      },
    });
  }

  async saveSystemErrorLog(
    id: string,
    payload: SystemErrorLogPayload,
  ): Promise<void> {
    await this.prisma.systemErrorLog.create({
      data: {
        id,
        createdAt: new Date(),
        userId: payload.userId ? BigInt(payload.userId) : null,
        errorCode: payload.errorCode || null,
        errorMessage: payload.errorMessage,
        stackTrace: payload.stackTrace || null,
        path: payload.path || null,
        method: payload.method || null,
        statusCode: null,
        severity: payload.severity || null,
        resolved: false,
        resolvedAt: null,
        metadata: undefined,
      },
    });
  }

  async saveIntegrationLog(
    id: string,
    payload: IntegrationLogPayload,
  ): Promise<void> {
    await this.prisma.integrationLog.create({
      data: {
        id,
        createdAt: new Date(),
        userId: payload.userId ? BigInt(payload.userId) : null,
        provider: payload.provider,
        method: payload.method,
        endpoint: payload.endpoint,
        statusCode: payload.statusCode || null,
        requestBody: undefined,
        responseBody: undefined,
        duration: payload.duration,
        success: payload.success,
        errorMessage: null,
      },
    });
  }
}

