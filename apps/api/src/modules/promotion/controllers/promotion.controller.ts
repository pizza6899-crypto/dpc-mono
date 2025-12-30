import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { PromotionService } from '../application/promotion.service';
import {
  PromotionResponseDto,
  UserPromotionResponseDto,
} from '../dtos/promotion.dto';

@ApiTags('Promotion (프로모션)')
@Controller('promotions')
@ApiStandardErrors()
export class PromotionController {
  constructor(
    private readonly promotionService: PromotionService,
  ) {}

  @Get('active')
  @ApiOperation({
    summary: 'Get active promotions / 활성 프로모션 조회',
    description:
      'Retrieve active promotions available for the user. (사용자가 사용 가능한 활성 프로모션을 조회합니다.)',
  })
  @ApiStandardResponse(PromotionResponseDto, {
    status: 200,
    description:
      'Successfully retrieved active promotions / 활성 프로모션 조회 성공',
    isArray: true,
  })
  async getActivePromotions(
    @CurrentUser() user: CurrentUserWithSession,
    @Query('language') language?: string,
    @RequestClientInfoParam() requestInfo?: RequestClientInfo,
  ): Promise<PromotionResponseDto[]> {
    const promotions = await this.promotionService.getActivePromotions(
      user.id,
      language || 'ko',
    );

    return promotions;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get promotion details / 프로모션 상세 조회',
    description:
      'Retrieve detailed information about a specific promotion. (특정 프로모션의 상세 정보를 조회합니다.)',
  })
  @ApiStandardResponse(PromotionResponseDto, {
    status: 200,
    description: 'Successfully retrieved promotion / 프로모션 조회 성공',
  })
  async getPromotionById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithSession,
    @Query('language') language?: string,
    @RequestClientInfoParam() requestInfo?: RequestClientInfo,
  ): Promise<PromotionResponseDto> {
    const promotion = await this.promotionService.getPromotionById(
      parseInt(id),
      language || 'ko',
    );

    return promotion;
  }

  @Get('my/history')
  @ApiOperation({
    summary: 'Get my promotion history / 내 프로모션 이력 조회',
    description:
      "Retrieve the user's promotion application history. (사용자의 프로모션 신청 이력을 조회합니다.)",
  })
  @ApiStandardResponse(UserPromotionResponseDto, {
    status: 200,
    description:
      'Successfully retrieved promotion history / 프로모션 이력 조회 성공',
    isArray: true,
  })
  async getMyPromotions(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo?: RequestClientInfo,
  ): Promise<UserPromotionResponseDto[]> {
    const history = await this.promotionService.getUserPromotions(user.id);

    return history;
  }
}
