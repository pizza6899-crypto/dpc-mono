// src/platform/session/session.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  CreateSessionDto,
  SessionInfo,
  UserSessionWithInfo,
} from './session.types';
import { UserStatus } from '@repo/database';
import { RequestClientInfo } from '../http/types';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_CACHE_TTL = 300; // 5분
  private readonly SESSION_CACHE_PREFIX = 'session:valid:';
  private readonly LAST_ACTIVE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5분

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 새 세션 생성
   */
  async createSession(dto: CreateSessionDto): Promise<UserSessionWithInfo> {
    const { userId, sessionId, requestInfo, expiresAt } = dto;

    const deviceInfo = this.parseDeviceInfo(requestInfo);

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        sessionId,
        deviceInfo,
        userAgent: requestInfo.userAgent,
        ipAddress: requestInfo.ip,
        isMobile: requestInfo.isMobile,
        expiresAt,
        lastActiveAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Redis에 세션 유효성 캐싱
    await this.cacheSessionValidation(sessionId, true);

    this.logger.log(`Session created: ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * 세션 유효성 검증 (Redis 캐싱 활용)
   */
  async validateSession(sessionId: string): Promise<boolean> {
    // 1. Redis 캐시에서 먼저 확인
    const cached = await this.redisService.get<boolean>(
      `${this.SESSION_CACHE_PREFIX}${sessionId}`,
    );

    if (cached !== null) {
      return cached;
    }

    // 2. 캐시 미스 시 DB 조회
    const session = await this.prisma.userSession.findUnique({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    let isValid = false;

    if (session) {
      // 세션이 비활성화되었거나 만료되었는지 확인
      if (!session.isActive) {
        isValid = false;
      } else if (session.expiresAt < nowUtc()) {
        // 만료된 세션은 자동으로 비활성화
        await this.prisma.userSession.update({
          where: { id: session.id },
          data: { isActive: false },
        });
        isValid = false;
      } else if (session.user?.status !== UserStatus.ACTIVE) {
        // 유저가 비활성화되었으면 세션 무효화
        await this.revokeSession(sessionId);
        isValid = false;
      } else {
        isValid = true;
      }
    }

    // 3. 결과를 Redis에 캐싱
    await this.cacheSessionValidation(sessionId, isValid);

    return isValid;
  }

  /**
   * 세션 유효성 검증 결과를 Redis에 캐싱
   */
  private async cacheSessionValidation(
    sessionId: string,
    isValid: boolean,
  ): Promise<void> {
    const key = `${this.SESSION_CACHE_PREFIX}${sessionId}`;
    await this.redisService.set(key, isValid, this.SESSION_CACHE_TTL);
  }

  /**
   * 세션의 마지막 활동 시간 갱신 (최적화: 5분 간격으로만 업데이트)
   */
  async updateLastActive(sessionId: string): Promise<void> {
    const cacheKey = `session:lastactive:${sessionId}`;
    const lastUpdate = await this.redisService.get<number>(cacheKey);

    const now = nowUtc().getTime();

    // 마지막 업데이트가 5분 이내면 스킵
    if (lastUpdate && now - lastUpdate < this.LAST_ACTIVE_UPDATE_INTERVAL) {
      return;
    }

    // DB 업데이트
    await this.prisma.userSession.updateMany({
      where: {
        sessionId,
        isActive: true,
      },
      data: {
        lastActiveAt: nowUtc(),
      },
    });

    // Redis에 마지막 업데이트 시간 저장
    await this.redisService.set(cacheKey, now, 600); // 10분 TTL
  }

  /**
   * 개별 세션 무효화 (로그아웃)
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (session && session.isActive) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          isActive: false,
          revokedAt: nowUtc(),
        },
      });

      // Redis 캐시 무효화
      await this.invalidateSessionCache(sessionId);

      this.logger.log(`Session revoked: ${sessionId}`);
    }
  }

  /**
   * 유저의 모든 활성 세션 무효화
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    // 먼저 모든 활성 세션 조회
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        sessionId: true,
      },
    });

    // DB 업데이트
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: nowUtc(),
      },
    });

    // Redis 캐시 무효화
    for (const session of sessions) {
      await this.invalidateSessionCache(session.sessionId);
    }

    this.logger.log(`Revoked ${result.count} sessions for user ${userId}`);
    return result.count;
  }

  /**
   * Redis 캐시 무효화
   */
  private async invalidateSessionCache(sessionId: string): Promise<void> {
    const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionId}`;
    await this.redisService.del(cacheKey);

    const lastActiveKey = `session:lastactive:${sessionId}`;
    await this.redisService.del(lastActiveKey);
  }

  /**
   * 디바이스 정보 파싱
   */
  private parseDeviceInfo(requestInfo: RequestClientInfo): string {
    const parts: string[] = [];

    if (requestInfo.os) {
      parts.push(requestInfo.os);
    }

    if (requestInfo.browser) {
      parts.push(requestInfo.browser);
    }

    if (requestInfo.isMobile) {
      parts.push('Mobile');
    }

    return parts.length > 0 ? parts.join(' - ') : 'Unknown Device';
  }
}
