import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
  type FindSessionsParams,
} from '../ports/out';
import { UserSession, SessionStatus, SessionType } from '../domain';
import { PaginatedData } from 'src/common/http/types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

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
  /**
   * 요청자 정보 (옵셔널, audit 로그용)
   */
  requestInfo?: RequestClientInfo;
  /**
   * 요청한 사용자 ID (관리자 ID, audit 로그용)
   */
  adminUserId?: bigint;
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
    private readonly dispatchLogService: DispatchLogService,
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
      requestInfo,
      adminUserId,
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

      // Audit 로그 기록 (활동 로그)
      if (adminUserId) {
        try {
          await this.dispatchLogService.dispatch(
            {
              type: LogType.ACTIVITY,
              data: {
                userId: adminUserId.toString(),
                category: 'AUTH',
                action: 'ADMIN_LIST_SESSIONS',
                metadata: {
                  page,
                  limit,
                  total: result.total,
                  filters: {
                    userId,
                    status,
                    type,
                    activeOnly,
                    startDate,
                    endDate,
                  },
                },
              },
            },
            requestInfo,
          );
        } catch (error) {
          // Audit 로그 실패는 조회 성공에 영향을 주지 않도록 처리
          this.logger.error(
            error,
            `Audit log 기록 실패 (세션 목록 조회는 성공) - adminUserId: ${adminUserId}`,
          );
        }
      }

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
