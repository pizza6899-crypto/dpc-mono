import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { Prisma } from '@prisma/client';
import type {
  UserSessionRepositoryPort,
  FindSessionsParams,
  FindSessionsResult,
} from '../ports/out';
import { UserSession, SessionStatus, SessionType } from '../domain';
import { UserSessionMapper } from './user-session.mapper';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

@Injectable()
export class UserSessionRepository implements UserSessionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserSessionMapper,
    private readonly redisService: RedisService,
  ) { }

  async create(session: UserSession): Promise<UserSession> {
    const data = this.mapper.toPrisma(session);
    const result = await this.tx.userSession.create({ data });
    return this.mapper.toDomain(result);
  }

  async findBySessionId(sessionId: string): Promise<UserSession | null> {
    const result = await this.tx.userSession.findUnique({
      where: { sessionId },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findActiveByUserId(userId: bigint): Promise<UserSession[]> {
    const results = await this.tx.userSession.findMany({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });
    return results.map((result) => this.mapper.toDomain(result));
  }

  async findByUserId(userId: bigint): Promise<UserSession[]> {
    const results = await this.tx.userSession.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return results.map((result) => this.mapper.toDomain(result));
  }

  async findMany(params: FindSessionsParams): Promise<FindSessionsResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      status,
      type,
      activeOnly,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    // Where 조건 구성
    const where: Prisma.UserSessionWhereInput = {
      ...(userId && { userId }),
      ...(status && { status }),
      ...(type && { type }),
      ...(activeOnly && { status: SessionStatus.ACTIVE }),
      ...(startDate &&
        endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    // 정렬 조건 구성
    const orderBy: Prisma.UserSessionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // 데이터 조회 및 총 개수 조회
    const [sessions, total] = await Promise.all([
      this.tx.userSession.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.tx.userSession.count({ where }),
    ]);

    return {
      sessions: sessions.map((session) => this.mapper.toDomain(session)),
      total,
    };
  }

  async update(session: UserSession): Promise<UserSession> {
    if (!session.id) {
      throw new Error('Session ID is required for update');
    }

    const data = this.mapper.toPrisma(session);
    const result = await this.tx.userSession.update({
      where: { id: session.id },
      data,
    });
    return this.mapper.toDomain(result);
  }

  async delete(sessionId: string): Promise<void> {
    await this.tx.userSession.delete({
      where: { sessionId },
    });
  }

  async findExpiredSessions(limit: number): Promise<UserSession[]> {
    const now = new Date();
    const results = await this.tx.userSession.findMany({
      where: {
        status: SessionStatus.ACTIVE,
        expiresAt: {
          lt: now, // expiresAt < now
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
      take: limit,
    });
    return results.map((result) => this.mapper.toDomain(result));
  }

  async deleteExpiredSessions(beforeDate: Date): Promise<number> {
    const result = await this.tx.userSession.deleteMany({
      where: {
        status: {
          in: [SessionStatus.EXPIRED, SessionStatus.REVOKED],
        },
        updatedAt: {
          lt: beforeDate,
        },
      },
    });
    return result.count;
  }

  async updateRedisSessionData(
    sessionId: string,
    isAdmin: boolean,
    updateData: Partial<AuthenticatedUser>,
  ): Promise<void> {
    const prefix = isAdmin ? 'admin-sess:' : 'sess:';
    const key = `${prefix}${sessionId}`;

    const rawData = await this.redisService.getClient().get(key);
    if (!rawData) return;

    try {
      const sessionData = JSON.parse(rawData);

      if (sessionData.passport?.user) {
        // 기존 세션 유저 데이터와 병합
        sessionData.passport.user = {
          ...sessionData.passport.user,
          ...updateData,
        };

        // BigInt 필드 안전 처리를 포함하여 직렬화
        const serializedData = JSON.stringify(sessionData, (_, v) =>
          typeof v === 'bigint' ? v.toString() : v,
        );

        // 세션 데이터 저장 (기존 TTL 유지)
        const ttl = await this.redisService.getClient().ttl(key);
        if (ttl === -2) return; // 그 사이 키가 삭제되었다면 중단

        if (ttl > 0) {
          await this.redisService
            .getClient()
            .set(key, serializedData, 'EX', ttl);
        } else if (ttl === -1) {
          // TTL이 없는 경우 (무제한 세션)
          await this.redisService.getClient().set(key, serializedData);
        }
        // -2(없음)인 경우는 위에서 처리됨
      }
    } catch (error) {
      // JSON 파싱 에러 등 무시 또는 로깅
      console.error(`Failed to update Redis session: ${sessionId}`, error);
    }
  }
}
