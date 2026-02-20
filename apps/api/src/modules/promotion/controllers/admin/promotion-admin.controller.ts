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
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { FindPromotionsAdminService } from '../../application/find-promotions-admin.service';
import { CreatePromotionService } from '../../application/create-promotion.service';
import { UpdatePromotionService } from '../../application/update-promotion.service';

import { FindPromotionParticipantsService } from '../../application/find-promotion-participants.service';
import { GetPromotionAdminService } from '../../application/get-promotion-admin.service';
import { DeletePromotionService } from '../../application/delete-promotion.service';
import { AddPromotionNoteService } from '../../application/add-promotion-note.service';
import { CreatePromotionRequestDto } from './dto/request/create-promotion.request.dto';
import { UpdatePromotionRequestDto } from './dto/request/update-promotion.request.dto';
import { PromotionAdminResponseDto } from './dto/response/promotion-admin.response.dto';
import { ListPromotionsQueryDto } from './dto/request/list-promotions-query.dto';
import { ListParticipantsQueryDto } from './dto/request/list-participants-query.dto';
import { UpsertCurrencySettingsRequestDto } from './dto/request/upsert-currency-settings.request.dto';
import { UpsertTranslationRequestDto } from './dto/request/upsert-translation.request.dto';
import { AddPromotionNoteRequestDto } from './dto/request/add-promotion-note.request.dto';
import { PromotionParticipantResponseDto } from './dto/response/promotion-participant.response.dto';
import { PromotionStatisticsResponseDto } from './dto/response/promotion-statistics.response.dto';
import { PROMOTION_REPOSITORY } from '../../ports/out';
import type { PromotionRepositoryPort } from '../../ports/out/promotion.repository.port';
import {
  Promotion,
  PromotionNotFoundException,
  PromotionPolicy,
} from '../../domain';
import { Inject } from '@nestjs/common';
import { ExchangeCurrencyCode, Language, Prisma } from '@prisma/client';

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
    private readonly deletePromotionService: DeletePromotionService,
    private readonly addPromotionNoteService: AddPromotionNoteService,
    private readonly policy: PromotionPolicy,
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

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
1. **입금 필수 여부 (isDepositRequired)**:
   - \`true\`: 사용자가 입금을 해야 보너스가 지급됩니다.
   - \`false\`: 쿠폰 방식으로, 사용자가 코드를 입력하면 즉시 보너스가 지급됩니다. (보너스 타입은 반드시 \`FIXED_AMOUNT\`여야 함)
2. **보너스 타입 (bonusType)**:
   - \`PERCENTAGE\`: 입금액의 특정 비율(bonusRate)만큼 보너스 지급.
   - \`FIXED_AMOUNT\`: 입금액과 상관없이 고정 금액 지급. (통화별 설정의 \`maxBonusAmount\`가 지급액이 됨)

### 유효성 검사 규칙
- 비입금 프로모션은 \`bonusType\`이 \`FIXED_AMOUNT\`여야 합니다.
- \`PERCENTAGE\` 타입은 \`bonusRate\`가 필수입니다.

### 설정 예시
1. **100% 첫 충전 보너스** (입금형):
   - \`isDepositRequired\`: true
   - \`bonusType\`: PERCENTAGE
   - \`bonusRate\`: 1.0 (100%)
2. **20 USDT 무료 쿠폰** (비입금형):
   - \`isDepositRequired\`: false
   - \`bonusType\`: FIXED_AMOUNT
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
      qualificationMaintainCondition:
        dto.qualificationMaintainCondition as string,
      isOneTime: dto.isOneTime,
      code: dto.code,
      targetUserIds: dto.targetUserIds,
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

### 수정 가능 항목
- 관리용 이름, 활성화 상태, 프로모션 코드
- 시작일 및 종료일
- 보너스 비율(PERCENTAGE 타입용), 롤링 배수
- 1회성 여부, 입금 필수 여부 등

**주의**: 보너스 타입(\`bonusType\`)이나 타겟 타입(\`targetType\`) 등 핵심 도메인 로직과 직결된 값은 수정을 제한하는 것을 권장하며, 변경 시 기존 참여자와의 정합성에 유의해야 합니다.

### 수정 예시 (활성화 및 기간 연장)
\`\`\`json
{
  "isActive": true,
  "endDate": "2026-12-31T23:59:59Z",
  "managementName": "첫 충전 이벤트 (연장)"
}
\`\`\`
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
      bonusRate:
        dto.bonusRate === undefined
          ? undefined
          : dto.bonusRate === null
            ? null
            : new Prisma.Decimal(dto.bonusRate),
      rollingMultiplier:
        dto.rollingMultiplier === undefined
          ? undefined
          : dto.rollingMultiplier === null
            ? null
            : new Prisma.Decimal(dto.rollingMultiplier),
      isOneTime: dto.isOneTime,
      code: dto.code,
      bonusType: dto.bonusType,
      targetType: dto.targetType,
      isDepositRequired: dto.isDepositRequired,
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
   * 프로모션 삭제 (Soft Delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete promotion / 프로모션 삭제',
    description: '프로모션을 삭제(소프트 삭제) 처리합니다.',
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description: 'Promotion deleted successfully / 프로모션 삭제 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'DELETE_PROMOTION',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id] = args;
      return { promotionId: id };
    },
  })
  async deletePromotion(@Param('id', ParseIntPipe) id: number): Promise<any> {
    await this.deletePromotionService.execute(BigInt(id));
    return {};
  }

  /**
   * 프로모션 메모 추가
   */
  @Post(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add promotion note / 프로모션 메모 추가',
    description: '프로모션에 새로운 관리자 메모를 추가합니다.',
  })
  @ApiStandardResponse(PromotionAdminResponseDto, {
    status: HttpStatus.OK,
    description: 'Note added successfully / 메모 추가 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'ADD_PROMOTION_NOTE',
    category: 'PROMOTION',
    extractMetadata: (_, args) => {
      const [id, dto] = args;
      return { promotionId: id, note: dto?.note };
    },
  })
  async addNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPromotionNoteRequestDto,
  ): Promise<PromotionAdminResponseDto> {
    const promotion = await this.addPromotionNoteService.execute(
      BigInt(id),
      dto.note,
    );
    // 상세 정보 포함을 위해 statistics 없이 매핑하거나, 필요시 statistics 추가 조회
    return this.mapToAdminResponseDto(promotion);
  }

  /**
   * 프로모션의 통화별 설정 생성/수정
   */
  @Post(':id/currencies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Upsert promotion currency settings / 프로모션 통화별 설정 생성/수정',
    description: `
프로모션의 통화별 정책(금액 설정)을 생성하거나 수정합니다.

### 주요 설정 안내
1. **최소 입금액 (minDepositAmount)**:
   - 프로모션의 \`isDepositRequired\`가 \`true\`인 경우: 반드시 0보다 큰 값을 입력해야 합니다.
   - 프로모션의 \`isDepositRequired\`가 \`false\`(쿠폰형)인 경우: \`0\`으로 설정되며, 생략 시 자동으로 \`0\`이 입력됩니다.
2. **최대 보너스액 (maxBonusAmount)**:
   - 보너스 타입이 \`PERCENTAGE\`인 경우: 입금액 대비 지급될 수 있는 최대 한도입니다.
   - 보너스 타입이 \`FIXED_AMOUNT\`인 경우: **실제로 지급될 고정 금액**이 됩니다. (필수 입력)
3. **최대 출금액 (maxWithdrawAmount)**:
   - 해당 보너스를 통해 획득한 당첨금 중 출금 가능한 최대 금액을 제한할 때 사용합니다. (Optional)

**참고**: 특정 통화에 대한 설정이 이미 존재하면 수정하고, 없으면 새로 생성합니다.
    `,
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description:
      'Currency settings upserted successfully / 통화별 설정 생성/수정 성공',
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

    const minDepositAmount = dto.minDepositAmount
      ? new Prisma.Decimal(dto.minDepositAmount)
      : promotion.isDepositRequired
        ? new Prisma.Decimal(0) // 입금 필수인데 없으면 0으로 일단 처리 (validateConfiguration에서 걸릴 것)
        : new Prisma.Decimal(0); // 비입금 프로모션은 기본 0

    // 설정 유효성 검사
    this.policy.validateConfiguration({
      isDepositRequired: promotion.isDepositRequired,
      bonusType: promotion.bonusType,
      bonusRate: promotion.bonusRate,
      currencies: [
        {
          minDepositAmount,
          maxBonusAmount: dto.maxBonusAmount
            ? new Prisma.Decimal(dto.maxBonusAmount)
            : null,
        },
      ],
    });

    await this.repository.upsertCurrencySettings({
      promotionId: BigInt(id),
      currency: dto.currency,
      minDepositAmount,
      maxBonusAmount: dto.maxBonusAmount
        ? new Prisma.Decimal(dto.maxBonusAmount)
        : null,
      maxWithdrawAmount: dto.maxWithdrawAmount
        ? new Prisma.Decimal(dto.maxWithdrawAmount)
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
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description:
      'Currency settings deleted successfully / 통화별 설정 삭제 성공',
  })
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
   * 프로모션의 번역 정보 생성/수정
   */
  @Post(':id/translations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert promotion translation / 프로모션 번역 정보 생성/수정',
    description: '프로모션의 번역 정보를 생성하거나 수정합니다.',
  })
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description: 'Translation upserted successfully / 번역 정보 생성/수정 성공',
  })
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
  @ApiStandardResponse(Object, {
    status: HttpStatus.OK,
    description: 'Translation deleted successfully / 번역 정보 삭제 성공',
  })
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
      isDepositRequired: promotion.isDepositRequired,
      maxUsageCount: promotion.maxUsageCount,
      currentUsageCount: promotion.currentUsageCount,
      bonusExpiryMinutes: promotion.bonusExpiryMinutes,
      note: promotion.note,
      qualificationMaintainCondition:
        promotion.qualificationMaintainCondition as string,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
      statistics,
      currencies:
        promotion.getCurrencies()?.map((c) => ({
          id: c.id.toString(),
          promotionId: c.promotionId.toString(),
          currency: c.currency,
          minDepositAmount: c.minDepositAmount.toString(),
          maxBonusAmount: c.maxBonusAmount?.toString() ?? null,
          maxWithdrawAmount: c.maxWithdrawAmount?.toString() ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })) || [],
      translations:
        promotion.getTranslations()?.map((t) => ({
          id: t.id.toString(),
          promotionId: t.promotionId.toString(),
          language: t.language,
          name: t.name,
          description: t.description,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })) || [],
    };
  }
}
