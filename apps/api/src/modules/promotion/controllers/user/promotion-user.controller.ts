// src/modules/promotion/controllers/user/promotion-user.controller.ts
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import type { PaginatedData } from 'src/common/http/types/pagination.types';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetActivePromotionsForUserService } from '../../application/get-active-promotions-for-user.service';
import { GetPromotionByCodeForUserService } from '../../application/get-promotion-by-code-for-user.service';
import { PromotionResponseDto } from './dto/response/promotion.response.dto';
import { UserPromotionResponseDto } from './dto/response/user-promotion.response.dto';
import { ListActivePromotionsQueryDto } from './dto/request/list-active-promotions-query.dto';
import { ListMyPromotionsQueryDto } from './dto/request/list-my-promotions-query.dto';
import { Language, ExchangeCurrencyCode } from '@prisma/client';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { Promotion, PromotionTranslation, UserPromotion } from '../../domain';
import { PromotionCurrency } from '../../domain/model/promotion-currency.entity';
import { ApplyCouponRequestDto } from './dto/request/apply-coupon.request.dto';
import { ApplyCouponPromotionService } from '../../application/apply-coupon-promotion.service';
import { GetMyPromotionsForUserService } from '../../application/get-my-promotions-for-user.service';

@Controller('promotions')
@ApiTags('User Promotion')
@ApiBearerAuth()
@ApiStandardErrors()
export class PromotionUserController {
  constructor(
    private readonly getActivePromotionsForUserService: GetActivePromotionsForUserService,
    private readonly getPromotionByCodeForUserService: GetPromotionByCodeForUserService,
    private readonly getMyPromotionsForUserService: GetMyPromotionsForUserService,
    private readonly applyCouponPromotionService: ApplyCouponPromotionService,
    private readonly sqidsService: SqidsService,
  ) {}

  /**
   * 활성 프로모션 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get active promotions / 활성 프로모션 목록 조회',
    description:
      '현재 활성화된 프로모션 목록을 조회합니다. 페이지네이션 및 언어 파라미터 지원.',
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
    @CurrentUser() user: CurrentUserWithSession | undefined,
    @Query() query: ListActivePromotionsQueryDto,
  ): Promise<PaginatedData<PromotionResponseDto>> {
    const result = await this.getActivePromotionsForUserService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      language: query.language,
      currency: query.currency,
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
    @CurrentUser() user: CurrentUserWithSession,
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

  /**
   * 프로모션 상세 조회 (코드 기반)
   */
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion by Code / 프로모션 상세 조회 (코드 기반)',
    description:
      '특정 프로모션 코드를 사용하여 상세 정보를 조회합니다. 언어 파라미터로 번역 정보를 받을 수 있습니다.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: Language,
    description: '언어 코드 (번역 정보 포함, 기본값: EN)',
    example: Language.EN,
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ExchangeCurrencyCode,
    description: '통화 코드',
    example: ExchangeCurrencyCode.USDT,
  })
  @ApiStandardResponse(PromotionResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved promotion / 프로모션 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_DETAIL',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [code] = args;
      return {
        promotionCode: code,
      };
    },
  })
  async getPromotionByCode(
    @Param('code') code: string,
    @Query('language') language?: Language,
    @Query('currency') currency?: ExchangeCurrencyCode,
  ): Promise<PromotionResponseDto> {
    const result = await this.getPromotionByCodeForUserService.execute({
      code,
      language,
      currency,
    });

    return this.mapPromotionToDto(
      result.promotion,
      result.translation,
      result.currencySetting,
    );
  }

  /**
   * 비입금 프로모션(쿠폰) 적용
   */
  @Post('apply-coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Apply coupon (Non-deposit promotion) / 비입금 프로모션(쿠폰) 적용',
    description: '입금 없이 즉시 보너스가 지급되는 쿠폰 프로모션을 적용합니다.',
  })
  @ApiStandardResponse(UserPromotionResponseDto, {
    status: HttpStatus.OK,
    description: 'Coupon applied successfully / 쿠폰 적용 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'APPLY_COUPON',
    category: 'PROMOTION',
    extractMetadata: (_, args, result) => {
      const [, dto] = args;
      return {
        code: dto?.code,
        currency: dto?.currency,
        bonusAmount: result?.bonusAmount,
        userPromotionId: result?.id,
      };
    },
  })
  async applyCoupon(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: ApplyCouponRequestDto,
  ): Promise<UserPromotionResponseDto> {
    const userPromotion = await this.applyCouponPromotionService.execute({
      user,
      code: dto.code,
      currency: dto.currency,
    });

    return this.mapUserPromotionToDto(userPromotion);
  }

  private mapPromotionToDto(
    promotion: Promotion,
    translation: PromotionTranslation,
    currencySetting: PromotionCurrency,
  ): PromotionResponseDto {
    return {
      code: promotion.code,
      name: translation.name,
      description: translation.description ?? null,
      language: translation.language,
      currency: currencySetting.currency,
      minDepositAmount: currencySetting.minDepositAmount.toString(),
      maxBonusAmount: currencySetting.maxBonusAmount?.toString() || null,
      targetType: promotion.targetType,
      bonusType: promotion.bonusType,
      bonusRate: promotion.bonusRate?.toString(),
      rollingMultiplier: promotion.rollingMultiplier?.toString(),
      isOneTime: promotion.isOneTime,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
    };
  }

  private mapUserPromotionToDto(up: UserPromotion): UserPromotionResponseDto {
    return {
      id: this.sqidsService.encode(up.id, SqidsPrefix.USER_PROMOTION),
      promotionCode: up.promotionCode,
      status: up.status as string,
      bonusGranted: up.bonusGranted,
      depositAmount: up.depositAmount.toString(),
      bonusAmount: up.bonusAmount.toString(),
      targetRollingAmount: up.targetRollingAmount.toString(),
      currentRollingAmount: up.currentRollingAmount.toString(),
      currency: up.currency,
      createdAt: up.createdAt,
    };
  }
}
