import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
  type FindSessionsParams,
} from '../ports/out';
import { UserSession, SessionStatus, SessionType } from '../domain';
import { PaginatedData } from 'src/common/http/types';

export interface ListSessionsServiceParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
  status?: SessionStatus;
  type?: SessionType;
  activeOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

interface ListSessionsServiceResult extends PaginatedData<UserSession> {}

/**
 * 세션 목록 조회 Use Case
 *
 * 관리자가 전체 세션 목록을 조회합니다.
 * 페이징, 필터링, 정렬 기능을 지원합니다.
 */
@Injectable()
export class ListSessionsService {
  private readonly logger = new Logger(ListSessionsService.name);

  constructor(
    @Inject(USER_SESSION_REPOSITORY)
    private readonly repository: UserSessionRepositoryPort,
  ) {}

  async execute(
    params: ListSessionsServiceParams,
  ): Promise<ListSessionsServiceResult> {
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

    try {
      // Repository 파라미터 구성
      const findParams: FindSessionsParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        userId: userId ? BigInt(userId) : undefined,
        status,
        type,
        activeOnly,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      // 세션 목록 조회
      const result = await this.repository.findMany(findParams);

      this.logger.log(
        `세션 목록 조회 완료: page=${page}, limit=${limit}, total=${result.total}`,
      );

      return {
        data: result.sessions,
        page,
        limit,
        total: result.total,
      };
    } catch (error) {
      this.logger.error(error, '세션 목록 조회 실패');
      throw error;
    }
  }
}

