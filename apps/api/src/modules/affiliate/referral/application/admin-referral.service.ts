// src/modules/affiliate/referral/application/admin-referral.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Prisma } from '@repo/database';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { GetReferralsQueryDto } from '../controllers/dto/request/get-referrals-query.dto';
import { AdminReferralListItemDto } from '../controllers/dto/response/admin-referral-response.dto';
import { ReferralMapper } from '../infrastructure/referral.mapper';
import {
  ReferralNotFoundException,
  ReferralException,
} from '../domain/referral.exception';

@Injectable()
export class AdminReferralService {
  private readonly logger = new Logger(AdminReferralService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mapper: ReferralMapper,
    private readonly dispatchLogService: DispatchLogService,
  ) { }

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
      const skip = (page - 1) * limit;

      const where: Prisma.ReferralWhereInput = {
        ...(filters.affiliateId && { affiliateId: filters.affiliateId }),
        ...(filters.subUserId && { subUserId: filters.subUserId }),
        ...(filters.codeId && { codeId: BigInt(filters.codeId) }),
        ...(filters.startDate &&
          filters.endDate && {
          createdAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        }),
      };

      const orderBy: Prisma.ReferralOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [referrals, total] = await Promise.all([
        this.prismaService.referral.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            affiliate: {
              select: {
                id: true,
                email: true,
              },
            },
            subUser: {
              select: {
                id: true,
                email: true,
              },
            },
            code: {
              select: {
                id: true,
                code: true,
                campaignName: true,
              },
            },
          },
        }),
        this.prismaService.referral.count({ where }),
      ]);

      // Audit Log 기록
      // BigInt를 문자열로 변환하여 직렬화 가능하게 만듦
      const serializableFilters = {
        ...filters,
        ...(filters.affiliateId && { affiliateId: filters.affiliateId.toString() }),
        ...(filters.subUserId && { subUserId: filters.subUserId.toString() }),
      };
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: adminId.toString(),
            category: 'AFFILIATE',
            action: 'ADMIN_REFERRAL_LIST_VIEW',
            metadata: {
              filters: serializableFilters,
              total,
              page,
              limit,
            },
          },
        },
        requestInfo,
      );

      const data: AdminReferralListItemDto[] = referrals.map((referral) => ({
        id: referral.id.toString(),
        affiliateId: referral.affiliateId,
        affiliateEmail: referral.affiliate.email,
        subUserId: referral.subUserId,
        subUserEmail: referral.subUser.email,
        codeId: referral.codeId.toString(),
        code: referral.code.code,
        campaignName: referral.code.campaignName,
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
      // 도메인 예외는 WARN 레벨로 로깅 (비즈니스 로직의 정상적인 흐름)
      if (error instanceof ReferralException) {
        this.logger.warn(
          `Referral domain exception - Admin: ${adminId}`,
          error.message,
        );
      } else {
        // 예상치 못한 예외만 ERROR 레벨로 로깅
        this.logger.error(error, `Failed to get referrals - Admin: ${adminId}`);
      }
      throw error;
    }
  }

  /**
   * 레퍼럴 상세 조회 (관리자용)
   */
  async getReferralById(
    id: string,
    adminId: bigint,
    requestInfo: RequestClientInfo,
  ): Promise<AdminReferralListItemDto> {
    try {
      const referral = await this.prismaService.referral.findUnique({
        where: { id: BigInt(id) },
        include: {
          affiliate: {
            select: {
              id: true,
              email: true,
            },
          },
          subUser: {
            select: {
              id: true,
              email: true,
            },
          },
          code: {
            select: {
              id: true,
              code: true,
              campaignName: true,
            },
          },
        },
      });

      if (!referral) {
        throw new ReferralNotFoundException(id);
      }

      // Audit Log 기록
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: adminId.toString(),
            category: 'AFFILIATE',
            action: 'ADMIN_REFERRAL_DETAIL_VIEW',
            metadata: {
              referralId: id,
            },
          },
        },
        requestInfo,
      );

      return {
        id: referral.id.toString(),
        affiliateId: referral.affiliateId,
        affiliateEmail: referral.affiliate.email,
        subUserId: referral.subUserId,
        subUserEmail: referral.subUser.email,
        codeId: referral.codeId.toString(),
        code: referral.code.code,
        campaignName: referral.code.campaignName,
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
