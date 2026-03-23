import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardErrors, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';

import { FindUserCharacterService } from '../../application/find-user-character.service';
import { AllocateStatPointsService } from '../../application/allocate-stat-points.service';
import { ResetStatsUserService } from '../../application/reset-stats-user.service';

import { UserCharacter } from '../../domain/user-character.entity';
import { UserCharacterResponseDto } from './dto/response/user-character.response.dto';
import { AllocateStatPointsRequestDto } from './dto/request/allocate-stat-points.request.dto';

@ApiTags('User Character')
@Controller('user/character')
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class UserCharacterController {
  constructor(
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly allocateStatPointsService: AllocateStatPointsService,
    private readonly resetStatsUserService: ResetStatsUserService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get My Character Info / 내 캐릭터 기초 정보 조회',
    description: 'Retrieves current level, XP, remaining stat points, and core stats (STR, DEX, etc.). / 현재 레벨, 경험치, 남은 스탯포인트 및 핵심 스탯(STR, DEX 등)을 조회합니다.',
  })
  @ApiStandardResponse(UserCharacterResponseDto)
  async getMyCharacter(@CurrentUser() user: AuthenticatedUser): Promise<UserCharacterResponseDto> {
    const character = await this.findUserCharacterService.execute(user.id);
    return this.mapToResponseDto(character);
  }

  @Post('stats/allocate')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'CHARACTER_ALLOCATE_STATS',
    extractMetadata: (req) => ({
      statName: req.body.statName,
      points: req.body.points,
    }),
  })
  @ApiOperation({
    summary: 'Allocate Stat Points / 스탯 포인트 투자',
    description: 'Consumes remaining stat points to invest in desired attributes. / 잔여 스탯 포인트를 소모하여 원하는 능력치에 투자합니다.',
  })
  @ApiStandardResponse(UserCharacterResponseDto)
  async allocateStatPoints(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AllocateStatPointsRequestDto,
  ): Promise<UserCharacterResponseDto> {
    const character = await this.allocateStatPointsService.execute({
      userId: user.id,
      statName: dto.statName,
      points: dto.points,
    });

    return this.mapToResponseDto(character);
  }

  @Post('stats/reset')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'CHARACTER_STATS_RESET_USER',
  })
  @ApiOperation({
    summary: 'Reset Stat Points / 스탯 초기화 (유상)',
    description: 'Resets all invested stats and returns points. Costs may apply based on policy. / 모든 스탯을 초기화하고 포인트를 반환합니다. 정책에 따라 비용이 발생할 수 있습니다.',
  })
  @ApiStandardResponse(UserCharacterResponseDto)
  async resetStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserCharacterResponseDto> {
    const character = await this.resetStatsUserService.execute(user.id);
    return this.mapToResponseDto(character);
  }

  private mapToResponseDto(domain: UserCharacter): UserCharacterResponseDto {
    return {
      level: domain.level,
      xp: domain.xp.toString(),
      statPoints: domain.statPoints,
      totalStatPoints: domain.totalStatPoints,
      stats: {
        strength: domain.strength,
        agility: domain.agility,
        luck: domain.luck,
        wisdom: domain.wisdom,
        stamina: domain.stamina,
        charisma: domain.charisma,
      },
      statResetCount: domain.statResetCount,
      currentTitle: domain.currentTitle,
      lastLeveledUpAt: domain.lastLeveledUpAt,
    };
  }
}
