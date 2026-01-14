// src/modules/promotion/controllers/admin/promotion-admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
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
import { UserRoleType } from '@repo/database';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { FindPromotionsAdminService } from '../../application/find-promotions-admin.service';
import { CreatePromotionService } from '../../application/create-promotion.service';
import { UpdatePromotionService } from '../../application/update-promotion.service';
import { DeletePromotionService } from '../../application/delete-promotion.service';
import { FindPromotionParticipantsService } from '../../application/find-promotion-participants.service';
import { GetPromotionStatisticsService } from '../../application/get-promotion-statistics.service';
import { CreatePromotionRequestDto } from './dto/request/create-promotion.request.dto';
import { UpdatePromotionRequestDto } from './dto/request/update-promotion.request.dto';
import { PromotionAdminResponseDto } from './dto/response/promotion-admin.response.dto';
import { ListPromotionsQueryDto } from './dto/request/list-promotions-query.dto';
import { ListParticipantsQueryDto } from './dto/request/list-participants-query.dto';
import { UpsertCurrencySettingsRequestDto } from './dto/request/upsert-currency-settings.request.dto';
import { UpsertTranslationRequestDto } from './dto/request/upsert-translation.request.dto';
import {
  PromotionCurrencyResponseDto,
  PromotionCurrencyListResponseDto,
} from './dto/response/promotion-currency.response.dto';
import {
  PromotionTranslationResponseDto,
  PromotionTranslationListResponseDto,
} from './dto/response/promotion-translation.response.dto';
import {
  PromotionParticipantResponseDto,
} from './dto/response/promotion-participant.response.dto';
import { PromotionStatisticsResponseDto } from './dto/response/promotion-statistics.response.dto';
import { PROMOTION_REPOSITORY } from '../../ports/out';
import type { PromotionRepositoryPort } from '../../ports/out/promotion.repository.port';
import { Promotion, PromotionNotFoundException } from '../../domain';
import { Inject } from '@nestjs/common';
import { ExchangeCurrencyCode, Language, Prisma } from '@repo/database';

@Controller('admin/promotions')
@ApiTags('Admin Promotion')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class PromotionAdminController {
  constructor(
    private readonly findPromotionsAdminService: FindPromotionsAdminService,
    private readonly createPromotionService: CreatePromotionService,
    private readonly updatePromotionService: UpdatePromotionService,
    private readonly deletePromotionService: DeletePromotionService,
    private readonly findPromotionParticipantsService: FindPromotionParticipantsService,
    private readonly getPromotionStatisticsService: GetPromotionStatisticsService,
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
      data: result.promotions.map((promotion) => this.mapToAdminResponseDto(promotion)),
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
    description: '새로운 프로모션을 생성합니다.',
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
        managementName: dto?.managementName,
        targetType: dto?.targetType,
      };
    },
  })
  async createPromotion(
    @Body() dto: CreatePromotionRequestDto,
  ): Promise<PromotionAdminResponseDto> {
    const promotion = await this.createPromotionService.execute({
      managementName: dto.managementName,
      isActive: dto.isActive,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      targetType: dto.targetType as string,
      bonusType: dto.bonusType as string,
      bonusRate: dto.bonusRate ? new Prisma.Decimal(dto.bonusRate) : null,
      rollingMultiplier: dto.rollingMultiplier
        ? new Prisma.Decimal(dto.rollingMultiplier)
        : null,
      qualificationMaintainCondition: dto.qualificationMaintainCondition as string,
      isOneTime: dto.isOneTime,
      code: dto.code,
      currencies: dto.currencies?.map((currency) => ({
        currency: currency.currency,
        minDepositAmount: new Prisma.Decimal(currency.minDepositAmount),
        maxBonusAmount: currency.maxBonusAmount
          ? new Prisma.Decimal(currency.maxBonusAmount)
          : null,
      })),
      translations: dto.translations?.map((translation) => ({
        language: translation.language,
        name: translation.name,
        description: translation.description ?? null,
      })),
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
    description: '프로모션 정보를 수정합니다.',
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
      const [, dto] = args;
      return {
        promotionId: result?.id,
        managementName: dto?.managementName,
      };
    },
  })
  async updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionRequestDto,
  ): Promise<PromotionAdminResponseDto> {
    const promotion = await this.updatePromotionService.execute({
      id: BigInt(id),
      managementName: dto.managementName,
      isActive: dto.isActive,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      bonusRate: dto.bonusRate ? new Prisma.Decimal(dto.bonusRate) : undefined,
      rollingMultiplier: dto.rollingMultiplier
        ? new Prisma.Decimal(dto.rollingMultiplier)
        : undefined,
      isOneTime: dto.isOneTime,
      code: dto.code,
    });

    return this.mapToAdminResponseDto(promotion);
  }

  /**
   * 프로모션 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete promotion / 프로모션 삭제',
    description: '프로모션을 삭제합니다.',
  })
  @ApiStandardResponse(
    Object,
    {
      status: HttpStatus.OK,
      description: 'Promotion deleted successfully / 프로모션 삭제 성공',
    },
  )
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_PROMOTION',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id] = args;
      return {
        promotionId: id,
      };
    },
  })
  async deletePromotion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    await this.deletePromotionService.execute(BigInt(id));
    return {};
  }

  /**
   * 프로모션의 통화별 설정 목록 조회 (더 구체적인 라우트를 먼저 배치)
   */
  @Get(':id/currencies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion currency settings / 프로모션 통화별 설정 목록 조회',
    description: '프로모션의 모든 통화별 설정을 조회합니다.',
  })
  @ApiStandardResponse(PromotionCurrencyListResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved currency settings / 통화별 설정 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_CURRENCIES_ADMIN',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id] = args;
      return {
        promotionId: id,
      };
    },
  })
  async getPromotionCurrencies(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionCurrencyListResponseDto> {
    const currencies = await this.repository.getCurrencySettingsByPromotionId(
      BigInt(id),
    );

    return {
      currencies: currencies.map(
        (currency): PromotionCurrencyResponseDto => ({
          id: currency.id.toString(),
          promotionId: currency.promotionId.toString(),
          currency: currency.currency,
          minDepositAmount: currency.minDepositAmount.toString(),
          maxBonusAmount: currency.maxBonusAmount?.toString(),
          createdAt: currency.createdAt,
          updatedAt: currency.updatedAt,
        }),
      ),
    };
  }

  /**
   * 프로모션의 통화별 설정 생성/수정
   */
  @Post(':id/currencies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert promotion currency settings / 프로모션 통화별 설정 생성/수정',
    description: '프로모션의 통화별 설정을 생성하거나 수정합니다.',
  })
  @ApiStandardResponse(
    Object,
    {
      status: HttpStatus.OK,
      description:
        'Currency settings upserted successfully / 통화별 설정 생성/수정 성공',
    },
  )
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
    await this.repository.upsertCurrencySettings({
      promotionId: BigInt(id),
      currency: dto.currency,
      minDepositAmount: new Prisma.Decimal(dto.minDepositAmount),
      maxBonusAmount: dto.maxBonusAmount
        ? new Prisma.Decimal(dto.maxBonusAmount)
        : null,
    });

    return {};
  }

  /**
   * 프로모션의 통화별 설정 삭제
   */
  @Delete(':id/currencies/:currency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete promotion currency settings / 프로모션 통화별 설정 삭제',
    description: '프로모션의 특정 통화별 설정을 삭제합니다.',
  })
  @ApiStandardResponse(
    Object,
    {
      status: HttpStatus.OK,
      description:
        'Currency settings deleted successfully / 통화별 설정 삭제 성공',
    },
  )
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_PROMOTION_CURRENCY',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id, currency] = args;
      return {
        promotionId: id,
        currency: currency,
      };
    },
  })
  async deletePromotionCurrency(
    @Param('id', ParseIntPipe) id: number,
    @Param('currency') currency: ExchangeCurrencyCode,
  ): Promise<any> {
    await this.repository.deleteCurrencySettings(BigInt(id), currency);
    return {};
  }

  /**
   * 프로모션의 번역 정보 목록 조회
   */
  @Get(':id/translations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion translations / 프로모션 번역 정보 목록 조회',
    description: '프로모션의 모든 번역 정보를 조회합니다.',
  })
  @ApiStandardResponse(PromotionTranslationListResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved translations / 번역 정보 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_TRANSLATIONS_ADMIN',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id] = args;
      return {
        promotionId: id,
      };
    },
  })
  async getPromotionTranslations(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionTranslationListResponseDto> {
    const translations = await this.repository.getTranslationsByPromotionId(
      BigInt(id),
    );

    return {
      translations: translations.map(
        (translation): PromotionTranslationResponseDto => ({
          id: translation.id.toString(),
          promotionId: translation.promotionId.toString(),
          language: translation.language,
          name: translation.name,
          description: translation.description,
          createdAt: translation.createdAt,
          updatedAt: translation.updatedAt,
        }),
      ),
    };
  }

  /**
   * 프로모션의 번역 정보 생성/수정
   */
  @Post(':id/translations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert promotion translation / 프로모션 번역 정보 생성/수정',
    description: '프로모션의 번역 정보를 생성하거나 수정합니다.',
  })
  @ApiStandardResponse(
    Object,
    {
      status: HttpStatus.OK,
      description:
        'Translation upserted successfully / 번역 정보 생성/수정 성공',
    },
  )
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPSERT_PROMOTION_TRANSLATION',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id, dto] = args;
      return {
        promotionId: id,
        language: dto?.language,
        name: dto?.name,
      };
    },
  })
  async upsertPromotionTranslation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertTranslationRequestDto,
  ): Promise<any> {
    await this.repository.upsertTranslation({
      promotionId: BigInt(id),
      language: dto.language,
      name: dto.name,
      description: dto.description ?? null,
    });

    return {};
  }

  /**
   * 프로모션의 번역 정보 삭제
   */
  @Delete(':id/translations/:language')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete promotion translation / 프로모션 번역 정보 삭제',
    description: '프로모션의 특정 언어 번역 정보를 삭제합니다.',
  })
  @ApiStandardResponse(
    Object,
    {
      status: HttpStatus.OK,
      description:
        'Translation deleted successfully / 번역 정보 삭제 성공',
    },
  )
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_PROMOTION_TRANSLATION',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id, language] = args;
      return {
        promotionId: id,
        language: language,
      };
    },
  })
  async deletePromotionTranslation(
    @Param('id', ParseIntPipe) id: number,
    @Param('language') language: Language,
  ): Promise<any> {
    await this.repository.deleteTranslation(BigInt(id), language);
    return {};
  }

  /**
   * 프로모션 참가자 목록 조회
   */
  @Get(':id/participants')
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get promotion participants / 프로모션 참가자 목록 조회',
    description: '프로모션에 참가한 사용자 목록을 조회합니다. 페이징 및 필터링 지원.',
  })
  @ApiPaginatedResponse(PromotionParticipantResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved participants / 참가자 목록 조회 성공',
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
          promotionCode: userPromotion.promotionCode,
          status: userPromotion.status as string,
          depositAmount: userPromotion.depositAmount.toString(),
          bonusAmount: userPromotion.bonusAmount.toString(),
          targetRollingAmount: userPromotion.targetRollingAmount.toString(),
          currentRollingAmount: userPromotion.currentRollingAmount.toString(),
          currency: userPromotion.currency,
          bonusGranted: userPromotion.bonusGranted,
          rollingCompleted: userPromotion.isRollingCompleted(),
          createdAt: userPromotion.createdAt,
          updatedAt: userPromotion.updatedAt,
        }),
      ),
      page: query.page || 1,
      limit: query.limit || 20,
      total: result.total,
    };
  }

  /**
   * 단일 프로모션 상세 조회 (더 일반적인 라우트는 나중에 배치)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion by ID / 프로모션 상세 조회',
    description: '관리자가 특정 프로모션의 상세 정보를 조회합니다.',
  })
  @ApiStandardResponse(PromotionAdminResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved promotion / 프로모션 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_DETAIL_ADMIN',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id] = args;
      return {
        promotionId: id,
      };
    },
  })
  async getPromotionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionAdminResponseDto> {
    const promotionId = BigInt(id);
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new PromotionNotFoundException(promotionId);
    }

    const statistics = await this.getPromotionStatisticsService.execute(
      promotionId,
    );

    return this.mapToAdminResponseDto(promotion, statistics);
  }

  private mapToAdminResponseDto(
    promotion: Promotion,
    statistics?: PromotionStatisticsResponseDto,
  ): PromotionAdminResponseDto {
    return {
      id: promotion.id.toString(),
      managementName: promotion.managementName,
      code: promotion.code,
      isActive: promotion.isActive,
      targetType: promotion.targetType as string,
      bonusType: promotion.bonusType as string,
      bonusRate: promotion.bonusRate?.toString(),
      rollingMultiplier: promotion.rollingMultiplier?.toString(),
      isOneTime: promotion.isOneTime,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
      statistics,
    };
  }
}

