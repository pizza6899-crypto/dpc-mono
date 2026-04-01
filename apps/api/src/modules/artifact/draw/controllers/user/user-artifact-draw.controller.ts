import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { RequestDrawDto } from './dto/request/request-draw.dto';
import { DrawRequestResponseDto } from './dto/response/draw-request.response.dto';
import { DrawResultResponseDto } from './dto/response/draw-result.response.dto';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

import { RequestArtifactDrawService } from '../../application/request-artifact-draw.service';
import { ClaimArtifactDrawService } from '../../application/claim-artifact-draw.service';
import { ListUnclaimedDrawsService } from '../../application/list-unclaimed-draws.service';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { ArtifactDrawRequest } from '../../domain/artifact-draw-request.entity';

/**
 * [Artifact Draw] Ruins Artifact Gacha Controller / 유적지 유물 뽑기 컨트롤러
 *
 * Follows a Commit-Reveal process based on future block hashes:
 * 미래 블록 해시 기반의 Commit-Reveal 프로세스를 따릅니다:
 *
 * 1. [Request/Commit] User pays currency/ticket and a future target slot is determined.
 *    - [신청/Commit] 유저가 재화/티켓을 지불하고 결과를 산출할 미래의 타겟 슬롯을 지정합니다.
 * 2. [Settle] The server reveals results once the target slot is reached (Background process).
 *    - [산출/Settle] 타겟 슬롯 도달 후 서버가 결과를 산출하고 보상을 지급합니다 (백그라운드 처리).
 * 3. [Claim/Reveal] User verifies the result and completes the draw sequence.
 *    - [확인/Reveal] 유저가 최종 결과를 확인하고 뽑기 연출 및 과정을 마무리합니다.
 */
@ApiTags('User Artifact Draw')
@Controller('user/artifact/draw')
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class UserArtifactDrawController {
  constructor(
    private readonly requestService: RequestArtifactDrawService,
    private readonly claimService: ClaimArtifactDrawService,
    private readonly listService: ListUnclaimedDrawsService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * [POST] 유물 뽑기 신청 (Commit)
   * 티켓/재화를 차감하고 결과를 산출할 미래 슬롯을 지정합니다.
   */
  @Post('request')
  @ApiOperation({
    summary: 'Request Artifact Draw / 유물 뽑기 신청 (결제)',
    description: 'Deducts currency or ticket and commits a draw request for a future Solana slot. / 재화 또는 티켓을 차감하고, 미래의 솔라나 슬롯을 대상으로 뽑기 요청을 생성합니다.',
  })
  @ApiStandardResponse(DrawRequestResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'REQUEST_DRAW',
    extractMetadata: (req, args) => ({
      drawType: args[1]?.drawType,
      paymentType: args[1]?.paymentType,
    }),
  })
  async requestDraw(
    @Body() dto: RequestDrawDto,
  ): Promise<DrawRequestResponseDto> {
    const request = await this.requestService.execute({
      drawType: dto.drawType,
      paymentType: dto.paymentType,
      ticketType: dto.ticketType,
    });

    return this.mapToRequestResponse(request);
  }

  /**
   * [GET] 확인하지 않은 뽑기 요청 조회
   * 서버에서 결과 산출(SETTLED)이 끝났으나 유저가 아직 확인하지 않은 내역들을 불러옵니다.
   */
  @Get('unclaimed')
  @ApiOperation({
    summary: 'List Unclaimed Draws / 확인하지 않은 뽑기 결과 목록 조회',
    description: 'Retrieves all draws that have been settled by the server but not yet claimed by the user. / 서버에서 결과 산출이 완료되었으나 유저가 아직 확인(Reveal)하지 않은 내역들을 조회합니다.',
  })
  @ApiStandardResponse(DrawResultResponseDto, { isArray: true })
  async getUnclaimedDraws(): Promise<DrawResultResponseDto[]> {
    const draws = await this.listService.execute();
    return draws.map(d => this.mapToResultResponse(d));
  }

  /**
   * [POST] 뽑기 결과 확인 및 확정 (Reveal/Claim)
   * 블록 해시로 결정된 아이템 결과를 확인하고 상태를 CLAIMED로 변경합니다.
   */
  @Post('claim/:requestId')
  @ApiOperation({
    summary: 'Claim Artifact Draw Result / 유물 뽑기 결과 최종 확인',
    description: 'Verifies the block hash, reveals the draw result, and completes the claim process. / 블록 해시를 기반으로 결과를 확인하고, 당첨된 유물을 공개하며 수령 절차를 완료합니다.',
  })
  @ApiStandardResponse(DrawResultResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'CLAIM_RESULT',
    extractMetadata: (req, args) => ({
      requestId: args[1],
    }),
  })
  async claimDraw(
    @Param('requestId') requestId: string,
  ): Promise<DrawResultResponseDto> {
    const decodedId = this.sqidsService.decode(requestId, SqidsPrefix.ARTIFACT_DRAW_REQUEST);
    const request = await this.claimService.execute(decodedId);

    return this.mapToResultResponse(request);
  }

  // --- Helpers ---

  private mapToRequestResponse(entity: ArtifactDrawRequest): DrawRequestResponseDto {
    return {
      requestId: this.sqidsService.encode(entity.id, SqidsPrefix.ARTIFACT_DRAW_REQUEST),
      targetSlot: entity.targetSlot.toString(),
      createdAt: entity.createdAt,
    };
  }

  private mapToResultResponse(entity: ArtifactDrawRequest): DrawResultResponseDto {
    const items = entity.result || [];
    return {
      requestId: this.sqidsService.encode(entity.id, SqidsPrefix.ARTIFACT_DRAW_REQUEST),
      status: entity.status,
      items: items.map((item) => ({
        userArtifactId: this.sqidsService.encode(item.userArtifactId, SqidsPrefix.USER_ARTIFACT),
        artifactCode: item.artifactCode,
        grade: item.grade,
        blockhash: item.blockhash,
        roll: item.roll,
      })),
      settledAt: entity.settledAt || undefined,
      claimedAt: entity.claimedAt || undefined,
    };
  }
}
