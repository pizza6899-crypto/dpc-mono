// src/modules/affiliate/commission/application/find-commission-by-id.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AffiliateCommission, InvalidParameterException } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';

interface FindCommissionByIdParams {
  uid?: string; // 비즈니스용 (CUID)
  id?: bigint; // 어드민용 (BigInt)
}

@Injectable()
export class FindCommissionByIdService {
  private readonly logger = new Logger(FindCommissionByIdService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
  ) {}

  async execute({
    uid,
    id,
  }: FindCommissionByIdParams): Promise<AffiliateCommission | null> {
    try {
      // uid가 제공되면 우선 사용 (비즈니스용)
      if (uid) {
        return await this.repository.findByUid(uid);
      }

      // id가 제공되면 사용 (어드민용)
      if (id) {
        return await this.repository.findById(id);
      }

      // 둘 다 없으면 에러
      throw new InvalidParameterException('Either uid or id must be provided');
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
