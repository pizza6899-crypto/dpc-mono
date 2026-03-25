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
    summary: 'Get My Character Info / 내 캐릭터 정보 조회',
    description: 'Retrieves current level, XP, remaining stat points, and core stats (Casino, Slot, Sports Benefit, etc.). / 현재 레벨, 경험치, 남은 스탯포인트 및 비즈니스 핵심 능력치(카지노, 슬롯, 스포츠 혜택 등)를 조회합니다.',
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
    summary: 'Allocate/Adjust Stat Points / 스탯 포인트 투자 및 조정',
    description: 'Adjusts character stats based on the mode. INC: increase by points, DEC: decrease by 1 and return point, MAX: invest all possible points. / 투자 모드에 따라 능력치를 조정합니다. INC: 지정된 수치만큼 증가, DEC: 1 감소 및 포인트 반환, MAX: 가용 포인트 내 최대치 투자.',
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
      mode: dto.mode,
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
    summary: 'Reset Stat Points / 스탯 초기화 (임시 무상)',
    description: 'Resets all invested stats and returns points. Currently free for a limited time. / 모든 스탯을 초기화하고 포인트를 반환합니다. 현재 임시로 무상으로 제공됩니다.',
  })
  @ApiStandardResponse(UserCharacterResponseDto)
  async resetStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserCharacterResponseDto> {
    // 세션(AuthenticatedUser)에 있는 유저의 주 사용 통화 정보를 전달하여 결제 처리를 수행합니다.
    const character = await this.resetStatsUserService.execute(user.id, user.primaryCurrency);
    return this.mapToResponseDto(character);
  }

  private mapToResponseDto(domain: UserCharacter): UserCharacterResponseDto {
    return {
      level: domain.level,
      xp: domain.xp.toString(),
      statPoints: domain.statPoints,
      totalStatPoints: domain.totalStatPoints,
      stats: {
        casinoBenefit: domain.casinoBenefit,
        slotBenefit: domain.slotBenefit,
        sportsBenefit: domain.sportsBenefit,
        minigameBenefit: domain.minigameBenefit,
        badBeatJackpot: domain.badBeatJackpot,
        criticalJackpot: domain.criticalJackpot,
      },
    };
  }
}
