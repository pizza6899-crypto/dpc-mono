import { Injectable } from '@nestjs/common';
import { UserSession, SessionType, SessionStatus } from '../domain';
import type { UserSession as PrismaUserSession, Prisma } from '@prisma/client';

/**
 * UserSession Mapper
 *
 * Prisma UserSession 모델과 Domain UserSession 엔티티 간 변환을 담당합니다.
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지합니다.
 */
@Injectable()
export class UserSessionMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: PrismaUserSession): UserSession {
    return UserSession.fromPersistence({
      id: prismaModel.id,
      userId: prismaModel.userId,
      sessionId: prismaModel.sessionId,
      parentSessionId: prismaModel.parentSessionId,
      type: prismaModel.type as SessionType,
      status: prismaModel.status as SessionStatus,
      isAdmin: prismaModel.isAdmin,
      ipAddress: prismaModel.ipAddress,
      userAgent: prismaModel.userAgent,
      deviceFingerprint: prismaModel.deviceFingerprint,
      isMobile: prismaModel.isMobile,
      deviceName: prismaModel.deviceName,
      os: prismaModel.os,
      browser: prismaModel.browser,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      lastActiveAt: prismaModel.lastActiveAt,
      expiresAt: prismaModel.expiresAt,
      revokedAt: prismaModel.revokedAt,
      revokedBy: prismaModel.revokedBy,
      metadata: (prismaModel.metadata as Record<string, unknown>) ?? {},
    });
  }

  /**
   * Domain 엔티티 → Prisma 데이터 변환
   *
   * create 시에는 id를 제외하고, update 시에는 id를 포함합니다.
   */
  toPrisma(domain: UserSession): {
    userId: bigint;
    sessionId: string;
    parentSessionId: string | null;
    type: SessionType;
    status: SessionStatus;
    isAdmin: boolean;
    ipAddress: string | null;
    userAgent: string | null;
    deviceFingerprint: string | null;
    isMobile: boolean | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
    revokedBy: bigint | null;
    metadata: Prisma.InputJsonValue;
  } {
    const deviceInfo = domain.deviceInfo.toPersistence();

    return {
      userId: domain.userId,
      sessionId: domain.sessionId,
      parentSessionId: domain.parentSessionId,
      type: domain.type,
      status: domain.status,
      isAdmin: domain.isAdmin,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceFingerprint: deviceInfo.deviceFingerprint,
      isMobile: deviceInfo.isMobile,
      deviceName: deviceInfo.deviceName,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      lastActiveAt: domain.lastActiveAt,
      expiresAt: domain.expiresAt,
      revokedAt: domain.revokedAt,
      revokedBy: domain.revokedBy,
      metadata: domain.metadata as Prisma.InputJsonValue,
    };
  }
}
