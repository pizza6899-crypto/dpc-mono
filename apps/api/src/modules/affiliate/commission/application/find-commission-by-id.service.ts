// src/modules/affiliate/commission/application/find-commission-by-id.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AffiliateCommission, InvalidParameterException } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindCommissionByIdParams {
  uid?: string; // 비즈니스용 (CUID)
  id?: bigint; // 어드민용 (BigInt)
  affiliateId?: bigint; // 사용자 액션인 경우 본인 확인용
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindCommissionByIdService {
  private readonly logger = new Logger(FindCommissionByIdService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    uid,
    id,
    affiliateId,
    requestInfo,
  }: FindCommissionByIdParams): Promise<AffiliateCommission | null> {
    try {
      let commission: AffiliateCommission | null = null;

      // uid가 제공되면 우선 사용 (비즈니스용)
      if (uid) {
        commission = await this.repository.findByUid(uid);
      } else if (id) {
        // id가 제공되면 사용 (어드민용)
        commission = await this.repository.findById(id);
      } else {
        // 둘 다 없으면 에러
        throw new InvalidParameterException('Either uid or id must be provided');
      }

      // Audit Log 기록 (사용자가 커미션 상세 조회)
      if (requestInfo && commission && affiliateId) {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: affiliateId.toString(),
              category: 'AFFILIATE',
              action: 'COMMISSION_DETAIL_VIEW',
              metadata: {
                affiliateId: affiliateId.toString(),
                commissionUid: commission.uid,
                commissionId: commission.id?.toString() || null,
              },
            },
          },
          requestInfo,
        );
      }

      return commission;
    } catch (error) {
      // 파라미터 검증 에러는 그대로 재던지기
      if (error instanceof InvalidParameterException) {
        throw error;
      }

      // Repository 에러는 로깅 후 재던지기
      this.logger.error(
        `커미션 조회 실패 - uid: ${uid || 'none'}, id: ${id?.toString() || 'none'}`,
        error,
      );
      throw error;
    }
  }
}
