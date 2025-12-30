// src/modules/affiliate/code/application/find-codes-admin.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { AffiliateCode } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindCodesAdminParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'code';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
  code?: string;
  isActive?: boolean;
  isDefault?: boolean;
  startDate?: string;
  endDate?: string;
  adminId?: bigint;
  requestInfo?: RequestClientInfo;
}

interface FindCodesAdminResult extends PaginatedData<AffiliateCode> {}

/**
 * 관리자용 어플리에이트 코드 목록 조회 Use Case
 *
 * 관리자가 모든 어플리에이트 코드를 조회합니다.
 * 페이징, 필터링, 정렬 기능을 지원합니다.
 */
@Injectable()
export class FindCodesAdminService {
  private readonly logger = new Logger(FindCodesAdminService.name);

  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute(
    params: FindCodesAdminParams,
  ): Promise<FindCodesAdminResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      code,
      isActive,
      isDefault,
      startDate,
      endDate,
      adminId,
      requestInfo,
    } = params;

    try {
      // Repository 파라미터 구성
      const result = await this.repository.findManyForAdmin({
        page,
        limit,
        sortBy,
        sortOrder,
        userId: userId ? BigInt(userId) : undefined,
        code,
        isActive,
        isDefault,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      // Audit Log 기록 (관리자가 코드 목록 조회)
      if (requestInfo && adminId) {
        const serializableFilters = {
          userId,
          code,
          isActive,
          isDefault,
          startDate,
          endDate,
        };
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: adminId.toString(),
              category: 'AFFILIATE',
              action: 'ADMIN_AFFILIATE_CODE_LIST_VIEW',
              metadata: {
                filters: serializableFilters,
                total: result.total,
                page,
                limit,
              },
            },
          },
          requestInfo,
        );
      }

      return {
        data: result.codes,
        page,
        limit,
        total: result.total,
      };
    } catch (error) {
      // 예상치 못한 시스템 에러는 로깅 후 재던지기
      this.logger.error(
        `관리자 어플리에이트 코드 목록 조회 실패 - page: ${page}, limit: ${limit}, filters: ${JSON.stringify({ userId, code, isActive, isDefault, startDate, endDate })}`,
        error,
      );
      throw error;
    }
  }
}

