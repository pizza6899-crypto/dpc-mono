// src/modules/promotion/controllers/user/promotion-user.controller.ts
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import type { PaginatedData } from 'src/common/http/types/pagination.types';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetActivePromotionsForUserService } from '../../application/get-active-promotions-for-user.service';
import { PromotionResponseDto } from './dto/response/promotion.response.dto';
import { UserPromotionResponseDto } from './dto/response/user-promotion.response.dto';
import { ListActivePromotionsQueryDto } from './dto/request/list-active-promotions-query.dto';
import { ListMyPromotionsQueryDto } from './dto/request/list-my-promotions-query.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { Promotion, PromotionTranslation, UserPromotion } from '../../domain';
import { PromotionCurrencyRule } from '../../domain/model/promotion-currency-rule.entity';
import { GetMyPromotionsForUserService } from '../../application/get-my-promotions-for-user.service';

@Controller('promotions')
@ApiTags('User Promotion')
@ApiBearerAuth()
@ApiStandardErrors()
export class PromotionUserController {
  constructor(
    private readonly getActivePromotionsForUserService: GetActivePromotionsForUserService,
    private readonly getMyPromotionsForUserService: GetMyPromotionsForUserService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * 활성 프로모션 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get active promotions / 활성 프로모션 목록 조회',
    description:
      '현재 활성화된 프로모션 목록을 조회합니다. 페이지네이션을 지원하며, 언어와 통화는 세션 설정을 따릅니다.',
  })
  @ApiPaginatedResponse(PromotionResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved active promotions / 활성 프로모션 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTIONS',
    category: 'PROMOTION',
    extractMetadata: (_, args, result) => {
      return {
        promotionCount: result?.data?.length || 0,
        total: result?.total || 0,
        page: result?.page || 1,
      };
    },
  })
  async getActivePromotions(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() query: ListActivePromotionsQueryDto,
  ): Promise<PaginatedData<PromotionResponseDto>> {
    const result = await this.getActivePromotionsForUserService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      language: user?.language,
      currency: user?.playCurrency,
      userId: user?.id,
    });

    return {
      data: result.data.map((info) =>
        this.mapPromotionToDto(
          info.promotion,
          info.translation,
          info.currencySetting,
        ),
      ),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  /**
   * 사용자의 프로모션 목록 조회
   */
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get my promotions / 내 프로모션 목록 조회',
    description:
      '사용자가 참여한 프로모션 목록을 조회합니다. 페이지네이션 지원.',
  })
  @ApiPaginatedResponse(UserPromotionResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved user promotions / 사용자 프로모션 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_MY_PROMOTIONS',
    category: 'PROMOTION',
    extractMetadata: (_, args, result, error) => {
      if (error) {
        return {
          failureReason: 'USER_NOT_AUTHENTICATED',
        };
      }
      return {
        promotionCount: result?.data?.length || 0,
        total: result?.total || 0,
        page: result?.page || 1,
      };
    },
  })
  async getMyPromotions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyPromotionsQueryDto,
  ): Promise<PaginatedData<UserPromotionResponseDto>> {
    const result = await this.getMyPromotionsForUserService.execute({
      userId: user.id,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
    });

    return {
      data: result.userPromotions.map((up) => this.mapUserPromotionToDto(up)),
      page: query.page || 1,
      limit: query.limit || 20,
      total: result.total,
    };
  }

  private mapPromotionToDto(
    promotion: Promotion,
    translation: PromotionTranslation,
    currencyRule: PromotionCurrencyRule,
  ): PromotionResponseDto {
    return {
      id: this.sqidsService.encode(promotion.id, SqidsPrefix.PROMOTION),
      title: translation.title,
      description: translation.description ?? null,
      language: translation.language,
      currency: currencyRule.currency,
      minDepositAmount: currencyRule.minDepositAmount.toString(),
      maxBonusAmount: currencyRule.maxBonusAmount?.toString() || null,
      targetType: promotion.targetType,
      bonusRate: currencyRule.bonusRate?.toString(),
      wageringMultiplier: currencyRule.wageringMultiplier?.toString(),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      maxUsagePerUser: promotion.maxUsagePerUser,
      periodicResetType: promotion.periodicResetType,
      applicableDays: promotion.applicableDays,
      applicableStartTime: promotion.applicableStartTime,
      applicableEndTime: promotion.applicableEndTime,
    };
  }

  private mapUserPromotionToDto(up: UserPromotion): UserPromotionResponseDto {
    return {
      id: this.sqidsService.encode(up.id, SqidsPrefix.USER_PROMOTION),
      status: up.status as string,
      depositAmount: up.depositAmount.toString(),
      bonusAmount: up.bonusAmount.toString(),
      currency: up.currency,
      createdAt: up.createdAt,
      completedAt: up.completedAt,
    };
  }
}
