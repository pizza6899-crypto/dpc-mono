// src/modules/promotion/controllers/user/promotion-user.controller.ts
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
import { FindUserPromotionsService } from '../../application/find-user-promotions.service';
import { GetActivePromotionsForUserService } from '../../application/get-active-promotions-for-user.service';
import { GetPromotionByIdForUserService } from '../../application/get-promotion-by-id-for-user.service';
import {
  ActivePromotionsResponseDto,
  PromotionResponseDto,
} from './dto/response/promotion.response.dto';
import {
  MyPromotionsResponseDto,
  UserPromotionResponseDto,
} from './dto/response/user-promotion.response.dto';
import { ListActivePromotionsQueryDto } from './dto/request/list-active-promotions-query.dto';
import { ListMyPromotionsQueryDto } from './dto/request/list-my-promotions-query.dto';
import { PROMOTION_REPOSITORY } from '../../ports/out';
import type { PromotionRepositoryPort } from '../../ports/out/promotion.repository.port';
import { Inject } from '@nestjs/common';
import { Language } from '@repo/database';

@Controller('promotions')
@ApiTags('Promotion (프로모션)')
@ApiStandardErrors()
export class PromotionUserController {
  constructor(
    private readonly findUserPromotionsService: FindUserPromotionsService,
    private readonly getActivePromotionsForUserService: GetActivePromotionsForUserService,
    private readonly getPromotionByIdForUserService: GetPromotionByIdForUserService,
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  /**
   * 활성 프로모션 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get active promotions / 활성 프로모션 목록 조회',
    description: '현재 활성화된 프로모션 목록을 조회합니다. 페이지네이션 및 언어 파라미터 지원.',
  })
  @ApiPaginatedResponse(PromotionResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved active promotions / 활성 프로모션 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTIONS',
    category: 'PROMOTION',
    extractMetadata: (args, result) => {
      return {
        promotionCount: result?.data?.length || 0,
        total: result?.total || 0,
        page: result?.page || 1,
      };
    },
  })
  async getActivePromotions(
    @Query() query: ListActivePromotionsQueryDto,
  ): Promise<PaginatedData<PromotionResponseDto>> {
    return await this.getActivePromotionsForUserService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      language: query.language,
      currency: query.currency,
    });
  }

  /**
   * 프로모션 상세 조회
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get promotion by ID / 프로모션 상세 조회',
    description: '특정 프로모션의 상세 정보를 조회합니다. 언어 파라미터로 번역 정보를 받을 수 있습니다.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: Language,
    description: '언어 코드 (번역 정보 포함, 기본값: EN)',
    example: Language.EN,
  })
  @ApiStandardResponse(PromotionResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved promotion / 프로모션 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_PROMOTION_DETAIL',
    category: 'PROMOTION',
    extractMetadata: (args) => {
      const [id] = args;
      return {
        promotionId: id,
      };
    },
  })
  async getPromotionById(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language?: Language,
  ): Promise<PromotionResponseDto> {
    return await this.getPromotionByIdForUserService.execute({
      id: BigInt(id),
      language,
    });
  }

  /**
   * 사용자의 프로모션 목록 조회
   */
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get my promotions / 내 프로모션 목록 조회',
    description: '사용자가 참여한 프로모션 목록을 조회합니다. 페이지네이션 지원.',
  })
  @ApiPaginatedResponse(UserPromotionResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved user promotions / 사용자 프로모션 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_MY_PROMOTIONS',
    category: 'PROMOTION',
    extractMetadata: (args, result, error) => {
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
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const result = await this.repository.findUserPromotionsPaginated({
      userId: user.id,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
    });

    return {
      data: result.userPromotions.map(
        (up): UserPromotionResponseDto => ({
          id: up.id,
          promotionId: up.promotionId,
          status: up.status as string,
          bonusGranted: up.bonusGranted,
          depositAmount: up.depositAmount.toString(),
          bonusAmount: up.bonusAmount.toString(),
          targetRollingAmount: up.targetRollingAmount.toString(),
          currentRollingAmount: up.currentRollingAmount.toString(),
          currency: up.currency,
          createdAt: up.createdAt,
        }),
      ),
      page: query.page || 1,
      limit: query.limit || 20,
      total: result.total,
    };
  }
}

