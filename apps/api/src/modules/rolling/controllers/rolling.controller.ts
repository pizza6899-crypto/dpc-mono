// src/modules/rolling/controllers/rolling.controller.ts
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/platform/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RollingService } from '../application/rolling.service';
import { UserRollingSummaryDto, RollingResponseDto } from '../dtos/rolling.dto';

@ApiTags('Rolling (롤링)')
@Controller('rolling')
@ApiStandardErrors()
export class RollingController {
  constructor(private readonly rollingService: RollingService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get rolling summary / 롤링 요약 정보 조회',
    description:
      "Retrieve the user's active rolling summary information. (사용자의 활성 롤링 요약 정보를 조회합니다.) Includes active rolling list, total required amount, current completed amount, and withdrawal availability. (활성 롤링 목록, 총 필요 금액, 현재 완료 금액, 출금 가능 여부를 포함합니다.)",
  })
  @ApiStandardResponse(UserRollingSummaryDto, {
    status: 200,
    description:
      'Successfully retrieved rolling summary / 롤링 요약 정보 조회 성공',
  })
  async getRollingSummary(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<UserRollingSummaryDto> {
    return await this.rollingService.getRollingSummary(user.id);
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active rolling list / 활성 롤링 목록 조회',
    description:
      "Retrieve the user's active rolling list. (사용자의 활성 롤링 목록을 조회합니다.) Results are sorted in FIFO order. (FIFO 순서로 정렬됩니다.)",
  })
  @ApiStandardResponse(RollingResponseDto, {
    status: 200,
    description:
      'Successfully retrieved active rolling list / 활성 롤링 목록 조회 성공',
    isArray: true,
  })
  async getActiveRollings(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<RollingResponseDto[]> {
    const rollings = await this.rollingService.getActiveRollings(user.id);

    // DTO 변환
    return rollings.map((rolling) => ({
      id: rolling.id.toString(),
      sourceType: rolling.sourceType,
      requiredAmount: rolling.requiredAmount.toString(),
      currentAmount: rolling.currentAmount.toString(),
      progressPercentage: rolling.requiredAmount.gt(0)
        ? rolling.currentAmount.div(rolling.requiredAmount).mul(100).toNumber()
        : 100,
      status: rolling.status,
      completedAt: rolling.completedAt,
      cancelledAt: rolling.cancelledAt,
      createdAt: rolling.createdAt,
    }));
  }
}
