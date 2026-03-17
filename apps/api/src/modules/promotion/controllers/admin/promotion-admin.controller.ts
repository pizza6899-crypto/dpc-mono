// src/modules/promotion/controllers/admin/promotion-admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import type { PaginatedData } from 'src/common/http/types/pagination.types';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType, Prisma } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { FindPromotionsAdminService } from '../../application/find-promotions-admin.service';
import { CreatePromotionService } from '../../application/create-promotion.service';
import { UpdatePromotionService } from '../../application/update-promotion.service';
import { FindPromotionParticipantsService } from '../../application/find-promotion-participants.service';
import { GetPromotionAdminService } from '../../application/get-promotion-admin.service';
import { CreatePromotionRequestDto } from './dto/request/create-promotion.request.dto';
import { UpdatePromotionRequestDto } from './dto/request/update-promotion.request.dto';
import { PromotionAdminResponseDto } from './dto/response/promotion-admin.response.dto';
import { ListPromotionsQueryDto } from './dto/request/list-promotions-query.dto';
import { ListParticipantsQueryDto } from './dto/request/list-participants-query.dto';
import { UpsertCurrencySettingsRequestDto } from './dto/request/upsert-currency-settings.request.dto';
import { UpsertTranslationRequestDto } from './dto/request/upsert-translation.request.dto';
import { PromotionParticipantResponseDto } from './dto/response/promotion-participant.response.dto';
import { PromotionStatisticsResponseDto } from './dto/response/promotion-statistics.response.dto';
import { PROMOTION_REPOSITORY } from '../../ports';
import type { PromotionRepositoryPort } from '../../ports/promotion.repository.port';
import {
  Promotion,
  PromotionNotFoundException,
  PromotionPolicy,
} from '../../domain';

@Controller('admin/promotions')
@ApiTags('Admin Promotion')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class PromotionAdminController {
  constructor(
    private readonly findPromotionsAdminService: FindPromotionsAdminService,
    private readonly createPromotionService: CreatePromotionService,
    private readonly updatePromotionService: UpdatePromotionService,
    private readonly findPromotionParticipantsService: FindPromotionParticipantsService,
    private readonly getPromotionAdminService: GetPromotionAdminService,
    private readonly policy: PromotionPolicy,
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  /**
   * 관리자용 프로모션 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get promotions (Admin) / 프로모션 목록 조회 (관리자)',
    description: '관리자가 프로모션 목록을 조회합니다. 페이징 및 필터링 지원.',
  })
  @ApiPaginatedResponse(PromotionAdminResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved promotions / 프로모션 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTIONS_ADMIN',
    category: 'PROMOTION',
    extractMetadata: (_, args, result) => {
      return {
        promotionCount: result?.data?.length || 0,
        total: result?.total || 0,
        page: result?.page || 1,
      };
    },
  })
  async getPromotions(
    @Query() query: ListPromotionsQueryDto,
  ): Promise<PaginatedData<PromotionAdminResponseDto>> {
    const result = await this.findPromotionsAdminService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      isActive: query.isActive,
      targetType: query.targetType,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      data: result.promotions.map(({ promotion, statistics }) =>
        this.mapToAdminResponseDto(promotion, statistics),
      ),
      page: query.page || 1,
      limit: query.limit || 20,
      total: result.total,
    };
  }

  /**
   * 프로모션 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create promotion / 프로모션 생성',
    description: `
새로운 프로모션의 기본 정보를 생성합니다. 
생성 후 상세 페이지에서 통화별 설정 및 다국어 정보를 등록해야 합니다.

### 주요 설정 안내
1. **보너스 타입 (bonusType)**:
   - \`PERCENTAGE\`: 입금액의 특정 비율(bonusRate)만큼 보너스 지급.
   - \`FIXED_AMOUNT\`: 입금액과 상관없이 고정 금액 지급. (통화별 설정의 \`maxBonusAmount\`가 지급액이 됨)
    `,
  })
  @ApiStandardResponse(PromotionAdminResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Promotion created successfully / 프로모션 생성 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_PROMOTION',
    category: 'PROMOTION',
    extractMetadata: (_, args, result) => {
      const [dto] = args;
      return {
        promotionId: result?.id,
        targetType: dto?.targetType,
      };
    },
  })
  async createPromotion(
    @Body() dto: CreatePromotionRequestDto,
  ): Promise<PromotionAdminResponseDto> {
    const promotion = await this.createPromotionService.execute({
      isActive: dto.isActive,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      targetType: dto.targetType,
      bonusType: dto.bonusType,
      maxUsageCount: dto.maxUsageCount,
      bonusExpiryMinutes: dto.bonusExpiryMinutes,
    });

    return this.mapToAdminResponseDto(promotion);
  }

  /**
   * 프로모션 수정
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update promotion / 프로모션 수정',
    description: `
프로모션의 기본 정보를 수정합니다.
    `,
  })
  @ApiStandardResponse(PromotionAdminResponseDto, {
    status: HttpStatus.OK,
    description: 'Promotion updated successfully / 프로모션 수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_PROMOTION',
    category: 'PROMOTION',
    extractMetadata: (_, args, result) => {
      return {
        promotionId: result?.id,
      };
    },
  })
  async updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionRequestDto,
  ): Promise<PromotionAdminResponseDto> {
    const promotion = await this.updatePromotionService.execute({
      id: BigInt(id),
      isActive: dto.isActive,
      startDate:
        dto.startDate === undefined
          ? undefined
          : dto.startDate === null
            ? null
            : new Date(dto.startDate),
      endDate:
        dto.endDate === undefined
          ? undefined
          : dto.endDate === null
            ? null
            : new Date(dto.endDate),
      bonusType: dto.bonusType,
      targetType: dto.targetType,
      maxUsageCount: dto.maxUsageCount,
      bonusExpiryMinutes: dto.bonusExpiryMinutes,
    });

    return this.mapToAdminResponseDto(promotion);
  }

  /**
   * 프로모션 상세 조회 (관리자)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion detail (Admin) / 프로모션 상세 조회 (관리자)',
    description:
      '특정 프로모션의 상세 정보(통화별 설정, 번역, 통계 등)를 조회합니다.',
  })
  @ApiStandardResponse(PromotionAdminResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved promotion detail / 프로모션 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_DETAIL_ADMIN',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id] = args;
      return { promotionId: id };
    },
  })
  async getPromotion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionAdminResponseDto> {
    const { promotion, statistics } =
      await this.getPromotionAdminService.execute(BigInt(id));
    return this.mapToAdminResponseDto(promotion, statistics);
  }

  /**
   * 프로모션의 통화별 설정 생성/수정
   */
  @Post(':id/currencies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Upsert promotion currency rules / 프로모션 통화별 규칙 생성/수정',
    description: `
프로모션의 통화별 정책(금액 설정)을 생성하거나 수정합니다.
    `,
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description:
      'Currency rules upserted successfully / 통화별 규칙 생성/수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPSERT_PROMOTION_CURRENCY',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id, dto] = args;
      return {
        promotionId: id,
        currency: dto?.currency,
        minDepositAmount: dto?.minDepositAmount,
        maxBonusAmount: dto?.maxBonusAmount,
      };
    },
  })
  async upsertPromotionCurrency(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertCurrencySettingsRequestDto,
  ): Promise<any> {
    const promotion = await this.repository.findById(BigInt(id));
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    // 도메인 레벨에서 설정 파일들에 대한 종합 검증
    this.policy.validateConfiguration({
      bonusType: promotion.bonusType,
      currencyRules: [
        {
          minDepositAmount: new Prisma.Decimal(dto.minDepositAmount),
          maxBonusAmount: dto.maxBonusAmount ? new Prisma.Decimal(dto.maxBonusAmount) : null,
          bonusRate: dto.bonusRate ? new Prisma.Decimal(dto.bonusRate) : null,
        }
      ]
    });

    await this.repository.upsertCurrencySettings({
      promotionId: BigInt(id),
      currency: dto.currency,
      minDepositAmount: new Prisma.Decimal(dto.minDepositAmount),
      maxDepositAmount: dto.maxDepositAmount ? new Prisma.Decimal(dto.maxDepositAmount) : null,
      maxBonusAmount: dto.maxBonusAmount ? new Prisma.Decimal(dto.maxBonusAmount) : null,
      maxWithdrawAmount: dto.maxWithdrawAmount ? new Prisma.Decimal(dto.maxWithdrawAmount) : null,
      bonusRate: dto.bonusRate ? new Prisma.Decimal(dto.bonusRate) : null,
      wageringMultiplier: dto.wageringMultiplier ? new Prisma.Decimal(dto.wageringMultiplier) : null,
    });

    return {};
  }

  /**
   * 프로모션 다국어 정보 생성/수정
   */
  @Post(':id/translations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert promotion translations / 프로모션 다국어 정보 생성/수정',
    description: '프로모션의 제목, 설명 등 다국어 정보를 생성하거나 수정합니다.',
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description: 'Translations upserted successfully / 다국어 정보 생성/수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPSERT_PROMOTION_TRANSLATION',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id, dto] = args;
      return { promotionId: id, language: dto?.language };
    },
  })
  async upsertPromotionTranslation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertTranslationRequestDto,
  ): Promise<any> {
    await this.repository.upsertTranslation({
      promotionId: BigInt(id),
      language: dto.language,
      title: dto.title,
      description: dto.description || null,
    });

    return {};
  }

  /**
   * 프로모션 참여자 목록 조회
   */
  @Get(':id/participants')
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get promotion participants / 프로모션 참가자 목록 조회',
    description:
      '프로모션에 참가한 사용자 목록을 조회합니다. 페이징 및 필터링 지원.',
  })
  @ApiPaginatedResponse(PromotionParticipantResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved participants / 참가자 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_PARTICIPANTS_ADMIN',
    category: 'PROMOTION',
    extractMetadata: (_, args, result) => {
      const [id] = args;
      return {
        promotionId: id,
        participantCount: result?.data?.length || 0,
        total: result?.total || 0,
      };
    },
  })
  async getPromotionParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListParticipantsQueryDto,
  ): Promise<PaginatedData<PromotionParticipantResponseDto>> {
    const result = await this.findPromotionParticipantsService.execute({
      promotionId: BigInt(id),
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      userId: query.userId ? BigInt(query.userId) : undefined,
    });

    return {
      data: result.userPromotions.map(
        ({ userPromotion, user }): PromotionParticipantResponseDto => ({
          id: userPromotion.id.toString(),
          userId: userPromotion.userId.toString(),
          userEmail: user?.email || null,
          promotionId: userPromotion.promotionId.toString(),
          status: userPromotion.status as string,
          depositAmount: userPromotion.depositAmount.toString(),
          bonusAmount: userPromotion.bonusAmount.toString(),
          currency: userPromotion.currency,
          createdAt: userPromotion.createdAt,
          updatedAt: userPromotion.updatedAt,
        }),
      ),
      page: query.page || 1,
      limit: query.limit || 20,
      total: result.total,
    };
  }

  private mapToAdminResponseDto(
    promotion: Promotion,
    statistics?: PromotionStatisticsResponseDto,
  ): PromotionAdminResponseDto {
    return {
      id: promotion.id.toString(),
      isActive: promotion.isActive,
      targetType: promotion.targetType as string,
      bonusType: promotion.bonusType as string,
      maxUsageCount: promotion.maxUsageCount,
      currentUsageCount: promotion.currentUsageCount,
      bonusExpiryMinutes: promotion.bonusExpiryMinutes,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
      statistics,
      currencyRules:
        promotion.getCurrencyRules()?.map((c) => ({
          id: c.id.toString(),
          promotionId: c.promotionId.toString(),
          currency: c.currency,
          minDepositAmount: c.minDepositAmount.toString(),
          maxDepositAmount: c.maxDepositAmount?.toString() ?? null,
          maxBonusAmount: c.maxBonusAmount?.toString() ?? null,
          maxWithdrawAmount: c.maxWithdrawAmount?.toString() ?? null,
          bonusRate: c.bonusRate?.toString() ?? null,
          wageringMultiplier: c.wageringMultiplier?.toString() ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })) || [],
      translations:
        promotion.getTranslations()?.map((t) => ({
          id: t.id.toString(),
          promotionId: t.promotionId.toString(),
          language: t.language,
          title: t.title,
          description: t.description,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })) || [],
    };
  }
}
