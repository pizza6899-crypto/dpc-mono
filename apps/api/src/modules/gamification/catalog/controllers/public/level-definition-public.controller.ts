import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { GetLevelDefinitionListService } from '../../application/get-level-definition-list.service';
import { LevelDefinitionResponseDto } from './dto/response/level-definition.response.dto';

/**
 * 게이미피케이션 공개 카탈로그 컨트롤러
 * 
 * 모든 사용자가 레벨 성장 시스템의 전반적인 구조를 조회할 수 있게 합니다.
 */
@Controller('public/gamification/levels')
@ApiTags('Public Gamification Levels')
@Public()
export class LevelDefinitionPublicController {
  constructor(
    private readonly getListService: GetLevelDefinitionListService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get Level Progression Map / 레벨 성장 구조 조회',
    description: 'Retrieves all level requirements and rewards for the standard user. / 일반 유저를 위한 전체 레벨 요건 및 보상 정보를 조회합니다.',
  })
  @ApiStandardResponse(LevelDefinitionResponseDto, { isArray: true })
  async getProgressionMap(): Promise<LevelDefinitionResponseDto[]> {
    const list = await this.getListService.execute();

    // 💡 Tip: 추후 특정 레벨 구간을 마스킹하거나(예: ??) 가공이 필요하면 여기서 수행합니다.
    return list.map((l) => ({
      level: l.level,
      requiredXp: l.requiredXp.toString(),
    }));
  }
}
