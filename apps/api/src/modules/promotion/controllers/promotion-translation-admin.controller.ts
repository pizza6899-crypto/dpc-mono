import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/platform/http/decorators/api-response.decorator';
import { PromotionTranslationService } from '../application/promotion-translation.service';
import {
  UpsertPromotionTranslationDto,
  PromotionTranslationResponseDto,
} from '../dtos/promotion-translation.dto';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';

@ApiTags('Promotion Translation Admin (프로모션 번역 관리)')
@Controller('promotions/:promotionId/translations')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class PromotionTranslationAdminController {
  constructor(
    private readonly promotionTranslationService: PromotionTranslationService,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create/Update promotion translation / 프로모션 번역 생성/수정',
    description:
      'Create or update a translation for a promotion. (프로모션의 번역을 생성하거나 업데이트합니다.)',
  })
  @ApiStandardResponse(PromotionTranslationResponseDto, {
    status: 201,
    description:
      'Successfully created/updated promotion translation / 프로모션 번역 생성/업데이트 성공',
  })
  async upsertTranslation(
    @Param('promotionId') promotionId: string,
    @Body() dto: UpsertPromotionTranslationDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ): Promise<PromotionTranslationResponseDto> {
    try {
      const result =
        await this.promotionTranslationService.upsertPromotionTranslation(
          parseInt(promotionId),
          dto.language,
          dto.name,
          dto.description,
        );

      // 성공 로그 기록
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.PROMOTION_TRANSLATION_CREATE,
          description: `프로모션 번역 생성/수정 - 프로모션 ID: ${promotionId}, 언어: ${dto.language}`,
          metadata: {
            promotionId: parseInt(promotionId),
            language: dto.language,
            name: dto.name,
          },
        },
        requestInfo,
      );

      return result;
    } catch (error) {
      // 실패 로그 기록
      await this.activityLog.logFailure(
        {
          userId: user.id,
          activityType: ActivityType.PROMOTION_TRANSLATION_CREATE,
          description: `프로모션 번역 생성/수정 실패 - 프로모션 ID: ${promotionId}, 언어: ${dto.language}`,
          metadata: {
            promotionId: parseInt(promotionId),
            language: dto.language,
            error: error.message,
          },
        },
        requestInfo,
      );
      throw error;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion translations / 프로모션 번역 목록 조회',
    description:
      'Retrieve all translations for a promotion. (프로모션의 모든 번역을 조회합니다.)',
  })
  @ApiStandardResponse(PromotionTranslationResponseDto, {
    status: 200,
    description:
      'Successfully retrieved promotion translations / 프로모션 번역 목록 조회 성공',
    isArray: true,
  })
  async getTranslations(
    @Param('promotionId') promotionId: string,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ): Promise<PromotionTranslationResponseDto[]> {
    const translations =
      await this.promotionTranslationService.getPromotionTranslations(
        parseInt(promotionId),
      );

    // 로그 기록
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.PROMOTION_TRANSLATION_VIEW,
        description: `프로모션 번역 목록 조회 - 프로모션 ID: ${promotionId}`,
        metadata: {
          promotionId: parseInt(promotionId),
          count: translations.length,
        },
      },
      requestInfo,
    );

    return translations;
  }
}
