import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardErrors, ApiStandardResponse, ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginationQueryDto, PaginatedData } from 'src/common/http/types/pagination.types';
import { FindUserCharacterService } from '../../application/find-user-character.service';
import { FindUserCharacterLogsService } from '../../application/find-user-character-logs.service';
import { GainXpService } from '../../application/gain-xp.service';
import { ResetStatsAdminService } from '../../application/reset-stats-admin.service';
import { UserCharacterAdminResponseDto } from './dto/response/user-character-admin.response.dto';
import { AdjustXpAdminRequestDto } from './dto/request/adjust-xp-admin.request.dto';
import { UserCharacterLogResponseDto } from './dto/response/user-character-log-admin.response.dto';
import { Prisma } from '@prisma/client';

@ApiTags('Admin Gamification Character')
@Controller('admin/gamification/characters')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CharacterAdminController {
  constructor(
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly findUserCharacterLogsService: FindUserCharacterLogsService,
    private readonly gainXpService: GainXpService,
    private readonly resetStatsAdminService: ResetStatsAdminService,
  ) { }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get User Character Info (Admin) / 사용자 캐릭터 정보 조회',
    description: 'Retrieves character stats and level for a specific user. / 특정 사용자의 레벨 및 스탯 정보를 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: 'User ID / 사용자 ID', example: '123' })
  @ApiStandardResponse(UserCharacterAdminResponseDto)
  async getCharacterInfo(@Param('userId') userId: string): Promise<UserCharacterAdminResponseDto> {
    const character = await this.findUserCharacterService.execute(BigInt(userId));

    return this.mapToAdminResponseDto(character);
  }

  @Get(':userId/logs')
  @Paginated()
  @ApiOperation({
    summary: 'Get User Character Logs (Admin) / 사용자 캐릭터 활동 로그 조회',
    description: 'Retrieves growth and stat change history for a specific user. / 특정 사용자의 성장 및 스탯 변동 이력을 조회합니다.',
  })
  @ApiPaginatedResponse(UserCharacterLogResponseDto)
  async getCharacterLogs(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedData<UserCharacterLogResponseDto>> {
    const paginatedLogs = await this.findUserCharacterLogsService.execute(
      BigInt(userId),
      query.limit,
      query.page
    );

    return {
      ...paginatedLogs,
      data: paginatedLogs.data.map(l => ({
        id: l.id.toString(),
        type: l.type,
        beforeLevel: l.beforeLevel,
        afterLevel: l.afterLevel,
        beforeStatPoints: l.beforeStatPoints,
        afterStatPoints: l.afterStatPoints,
        details: l.details,
        createdAt: l.createdAt,
      })),
    };
  }

  @Post(':userId/xp')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'CHARACTER_ADJUST_XP',
    extractMetadata: (req) => ({
      targetUserId: req.params.userId,
      amount: req.body.amount,
      reason: req.body.reason,
    }),
  })
  @ApiOperation({
    summary: 'Adjust User XP (Admin) / 관리자 경험치 지급 및 차감',
    description: 'Manually adds or removes XP for a user. Can trigger level-ups. / 사용자에게 수동으로 경험치를 지급하거나 차감합니다. 레벨업이 트리거될 수 있습니다.',
  })
  @ApiStandardResponse(UserCharacterAdminResponseDto)
  async adjustXp(
    @Param('userId') userId: string,
    @Body() dto: AdjustXpAdminRequestDto,
  ): Promise<UserCharacterAdminResponseDto> {
    const character = await this.gainXpService.execute(
      BigInt(userId),
      new Prisma.Decimal(dto.amount)
    );

    return this.mapToAdminResponseDto(character);
  }

  @Post(':userId/stats/reset')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'CHARACTER_STATS_RESET_ADMIN',
  })
  @ApiOperation({
    summary: '[Admin] Force Stat Reset / 캐릭터 스탯 강제 초기화',
    description: 'Resets all stats and returns all points for a user. (Admin only, No cost) / 특정 유저의 스탯을 초기화하고 모든 포인트를 반환합니다. (관리자 전용, 비용 없음)',
  })
  @ApiParam({ name: 'userId', description: 'Target User ID / 대상 유저 ID' })
  @ApiStandardResponse(UserCharacterAdminResponseDto)
  async resetUserStats(
    @Param('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<UserCharacterAdminResponseDto> {
    const character = await this.resetStatsAdminService.execute(BigInt(userId), reason || 'ADMIN_RESET');
    return this.mapToAdminResponseDto(character);
  }

  private mapToAdminResponseDto(domain: any): UserCharacterAdminResponseDto {
    return {
      userId: domain.userId.toString(),
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
      statResetCount: domain.statResetCount,
      currentTitle: domain.currentTitle,
      lastLeveledUpAt: domain.lastLeveledUpAt,
    };
  }
}
