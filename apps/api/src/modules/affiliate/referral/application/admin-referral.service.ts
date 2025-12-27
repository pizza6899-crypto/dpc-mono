// src/modules/affiliate/referral/application/admin-referral.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { PaginatedData, RequestClientInfo } from 'src/platform/http/types';
import { GetReferralsQueryDto } from '../controllers/dto/request/get-referrals-query.dto';
import { AdminReferralListItemDto } from '../controllers/dto/response/admin-referral-response.dto';
import { ReferralMapper } from '../infrastructure/referral.mapper';
import { ReferralNotFoundException } from '../domain/referral.exception';

@Injectable()
export class AdminReferralService {
  private readonly logger = new Logger(AdminReferralService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mapper: ReferralMapper,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  /**
   * 레퍼럴 목록 조회 (관리자용)
   */
  async getReferrals(
    query: GetReferralsQueryDto,
    adminId: string,
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
        ...(filters.codeId && { codeId: filters.codeId }),
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
                numericId: true,
              },
            },
            subUser: {
              select: {
                id: true,
                email: true,
                numericId: true,
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

      // Activity Log 기록
      await this.activityLog.logSuccess(
        {
          userId: adminId,
          isAdmin: true,
          activityType: ActivityType.ADMIN_AFFILIATE_LINK_LIST_VIEW,
          description: `관리자가 레퍼럴 목록을 조회했습니다. (필터: ${JSON.stringify(filters)})`,
          metadata: {
            filters,
            total,
            page,
            limit,
          },
        },
        requestInfo,
      );

      const data: AdminReferralListItemDto[] = referrals.map((referral) => ({
        id: referral.id,
        affiliateId: referral.affiliateId,
        affiliateEmail: referral.affiliate.email,
        affiliateNumericId: referral.affiliate.numericId,
        subUserId: referral.subUserId,
        subUserEmail: referral.subUser.email,
        subUserNumericId: referral.subUser.numericId,
        codeId: referral.codeId,
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
      this.logger.error(error, `Failed to get referrals - Admin: ${adminId}`);
      throw error;
    }
  }

  /**
   * 레퍼럴 상세 조회 (관리자용)
   */
  async getReferralById(
    id: string,
    adminId: string,
    requestInfo: RequestClientInfo,
  ): Promise<AdminReferralListItemDto> {
    try {
      const referral = await this.prismaService.referral.findUnique({
        where: { id },
        include: {
          affiliate: {
            select: {
              id: true,
              email: true,
              numericId: true,
            },
          },
          subUser: {
            select: {
              id: true,
              email: true,
              numericId: true,
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

      // Activity Log 기록
      await this.activityLog.logSuccess(
        {
          userId: adminId,
          isAdmin: true,
          activityType: ActivityType.ADMIN_AFFILIATE_LINK_LIST_VIEW,
          description: `관리자가 레퍼럴 상세를 조회했습니다. (ID: ${id})`,
          metadata: {
            referralId: id,
          },
        },
        requestInfo,
      );

      return {
        id: referral.id,
        affiliateId: referral.affiliateId,
        affiliateEmail: referral.affiliate.email,
        affiliateNumericId: referral.affiliate.numericId,
        subUserId: referral.subUserId,
        subUserEmail: referral.subUser.email,
        subUserNumericId: referral.subUser.numericId,
        codeId: referral.codeId,
        code: referral.code.code,
        campaignName: referral.code.campaignName,
        ipAddress: referral.ipAddress,
        deviceFingerprint: referral.deviceFingerprint,
        userAgent: referral.userAgent,
        createdAt: referral.createdAt,
        updatedAt: referral.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        error,
        `Failed to get referral by id - ID: ${id}, Admin: ${adminId}`,
      );
      throw error;
    }
  }
}
