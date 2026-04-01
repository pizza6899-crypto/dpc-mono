import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardErrors, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

import { SynthesizeArtifactRequestDto } from './dto/request/synthesize-artifact.request.dto';
import { SynthesizeArtifactResponseDto } from './dto/response/synthesize-artifact.response.dto';

import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { SynthesizeArtifactService } from '../../application/synthesize-artifact.service';

/**
 * [Artifact Synthesis] 유저 전용 유물 합성 컨트롤러
 * 
 * 보유한 유물들을 소모하여 상위 등급 합성을 시도하는 기능을 제공합니다.
 */
@ApiTags('User Artifact Synthesis')
@Controller('user/artifact/synthesis')
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class UserArtifactSynthesisController {
  constructor(
    private readonly synthesisService: SynthesizeArtifactService,
    private readonly sqidsService: SqidsService,
  ) { }

  @Post()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'SYNTHESIZE_ARTIFACT',
    extractMetadata: (req, _args, result: SynthesizeArtifactResponseDto) => ({
      ingredients: req.body.ingredientIds,
      isSuccess: result?.isSuccess,
      rewardArtifactCode: result?.reward?.artifactCode,
    }),
  })
  @ApiOperation({
    summary: 'Synthesize Artifacts / 유물 합성 시도',
    description: 'Consumes multiple artifacts of the same grade to attempt a synthesis to a higher grade or same grade. / 동일 등급의 유물을 소모하여 합성을 시도합니다. 성공 시 상위 등급 유물을 획득합니다.',
  })
  @ApiStandardResponse(SynthesizeArtifactResponseDto)
  async synthesizeArtifact(
    @Body() dto: SynthesizeArtifactRequestDto,
  ): Promise<SynthesizeArtifactResponseDto> {
    const ingredientIds = dto.ingredientIds.map(sqid => 
      this.sqidsService.decode(sqid, SqidsPrefix.USER_ARTIFACT)
    );
    const result = await this.synthesisService.execute(ingredientIds);

    // 응답 전용 ID 인코딩 처리
    if (result.reward) {
      result.reward.id = this.sqidsService.encode(BigInt(result.reward.id), SqidsPrefix.USER_ARTIFACT);
    }

    return result;
  }
}
