import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { PromotionTranslationService } from '../application/promotion-translation.service';
import {
  UpsertPromotionTranslationDto,
  PromotionTranslationResponseDto,
} from '../dtos/promotion-translation.dto';

@ApiTags('Promotion Translation Admin (프로모션 번역 관리)')
@Controller('promotions/:promotionId/translations')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class PromotionTranslationAdminController {
  constructor(
    private readonly promotionTranslationService: PromotionTranslationService,
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
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PromotionTranslationResponseDto> {
    try {
      const result =
        await this.promotionTranslationService.upsertPromotionTranslation(
          parseInt(promotionId),
          dto.language,
          dto.name,
          dto.description,
        );

      return result;
    } catch (error) {
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
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PromotionTranslationResponseDto[]> {
    const translations =
      await this.promotionTranslationService.getPromotionTranslations(
        parseInt(promotionId),
      );

    return translations;
  }
}
