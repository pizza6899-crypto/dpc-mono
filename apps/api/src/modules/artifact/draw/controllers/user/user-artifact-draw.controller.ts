import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardErrors, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

// DTOs
import { DrawArtifactRequestDto } from './dto/request/draw-artifact.request.dto';
import { DrawResultResponseDto } from './dto/response/draw-result.response.dto';

// Service
import { DrawArtifactService } from '../../application/draw-artifact.service';

/**
 * [User Artifact Draw] 유물 뽑기 컨트롤러 (사용자용)
 */
@ApiTags('User Artifact Drawing')
@Controller('user/artifact/draw')
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class UserArtifactDrawController {
  constructor(
    private readonly drawService: DrawArtifactService,
  ) { }

  /**
   * [POST] 유물 뽑기 시도 (재화 또는 티켓 소모)
   */
  @Post()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'DRAW_ARTIFACT',
    extractMetadata: (req) => ({
      type: req.body.type,
      paymentType: req.body.paymentType,
      ticketType: req.body.ticketType,
    }),
  })
  @ApiOperation({
    summary: 'Draw Artifact / 유물 뽑기 실행',
    description: `Executes artifact draws using either currency or tickets. / 재화 또는 보유 티켓을 사용하여 유물 뽑기를 수행합니다.
\n- type: SINGLE (1 draw / 1회 뽑기) | TEN (11 draws - Bonus +1 for the price of 10 / 11회 뽑기 - 10개 가격으로 보너스 1개 제공)
\n- paymentType: CURRENCY (Spend primary currency / 대표 재화 소모) | TICKET (Spend held tickets / 보유 티켓 소모)
\n- ticketType: Required for TICKET (ALL or specific grade guaranteed / 티켓 선택 시 필수 - 전체 또는 특정 등급 확정권)`,
  })
  @ApiStandardResponse(DrawResultResponseDto)
  async draw(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DrawArtifactRequestDto,
  ): Promise<DrawResultResponseDto> {
    return this.drawService.execute({
      userId: user.id,
      ...body,
      currency: user.primaryCurrency, // 세션의 대표 커런시 상시 전달
    });
  }
}
