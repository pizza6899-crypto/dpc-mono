import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { GetReferralsQueryDto } from '../controllers/dto/request/get-referrals-query.dto';
import { AdminReferralListItemDto } from '../controllers/dto/response/admin-referral-response.dto';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import {
  ReferralNotFoundException,
  ReferralException,
} from '../domain/referral.exception';

@Injectable()
export class AdminReferralService {
  private readonly logger = new Logger(AdminReferralService.name);

  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
  ) {}

  /**
   * 레퍼럴 목록 조회 (관리자용)
   */
  async getReferrals(
    query: GetReferralsQueryDto,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminReferralListItemDto>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
      } = query;

      const { referrals, total } = await this.repository.findManyForAdmin({
        page,
        limit,
        sortBy: sortBy as any,
        sortOrder,
        affiliateId: filters.affiliateId,
        subUserId: filters.subUserId,
        codeId: filters.codeId ? BigInt(filters.codeId) : undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      });

      const data: AdminReferralListItemDto[] = referrals.map((referral) => ({
        id: referral.id?.toString() ?? '',
        affiliateId: referral.affiliateId,
        affiliateEmail: referral.affiliateEmail,
        subUserId: referral.subUserId,
        subUserEmail: referral.subUserEmail,
        codeId: referral.codeId.toString(),
        code: referral.codeValue,
        campaignName: referral.campaignName || '',
        ipAddress: referral.ipAddress,
        deviceFingerprint: referral.deviceFingerprint,
        userAgent: referral.userAgent,
        createdAt: referral.createdAt,
        updatedAt: referral.updatedAt,
      }));

      return {
        data,
        page,
        limit,
        total,
      };
    } catch (error) {
      if (error instanceof ReferralException) {
        this.logger.warn(
          `Referral domain exception - Admin: ${adminId}`,
          error.message,
        );
      } else {
        this.logger.error(error, `Failed to get referrals - Admin: ${adminId}`);
      }
      throw error;
    }
  }

  /**
   * 레퍼럴 상세 조회 (관리자용)
   */
  async getReferralById(
    id: bigint,
    adminId: bigint,
  ): Promise<AdminReferralListItemDto> {
    try {
      const referral = await this.repository.findByIdForAdmin(id);

      if (!referral) {
        throw new ReferralNotFoundException(id);
      }

      return {
        id: referral.id?.toString() ?? '',
        affiliateId: referral.affiliateId,
        affiliateEmail: referral.affiliateEmail,
        subUserId: referral.subUserId,
        subUserEmail: referral.subUserEmail,
        codeId: referral.codeId.toString(),
        code: referral.codeValue,
        campaignName: referral.campaignName || '',
        ipAddress: referral.ipAddress,
        deviceFingerprint: referral.deviceFingerprint,
        userAgent: referral.userAgent,
        createdAt: referral.createdAt,
        updatedAt: referral.updatedAt,
      };
    } catch (error) {
      // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
      if (error instanceof ReferralException) {
        this.logger.warn(
          `Referral domain exception - ID: ${id}, Admin: ${adminId}`,
          error.message,
        );
      } else {
        // 예상치 못한 예외만 ERROR 레벨로 로깅
        this.logger.error(
          error,
          `Failed to get referral by id - ID: ${id}, Admin: ${adminId}`,
        );
      }
      throw error;
    }
  }
}
