import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { UserRoleType } from '@prisma/client';
import { ApiStandardErrors, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';

import { FindUserCharacterService } from '../../application/find-user-character.service';
import { AllocateStatPointsService } from '../../application/allocate-stat-points.service';

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
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get My Character Info / 내 캐릭터 기초 정보 조회',
    description: 'Retrieves current level, XP, remaining stat points, and core stats (STR, DEX, etc.). / 현재 레벨, 경험치, 남은 스탯포인트 및 핵심 스탯(STR, DEX 등)을 조회합니다.',
  })
  @ApiStandardResponse(UserCharacterResponseDto)
  async getMyCharacter(@CurrentUser() user: AuthenticatedUser): Promise<UserCharacterResponseDto> {
    const character = await this.findUserCharacterService.execute(user.id);
    return UserCharacterResponseDto.fromDomain(character);
  }

  @Post('stats/allocate')
  @ApiOperation({
    summary: 'Allocate Stat Points / 스탯 포인트 투자',
    description: 'Consumes remaining stat points to invest in desired attributes. / 잔여 스탯 포인트를 소모하여 원하는 능력치에 투자합니다.',
  })
  @ApiStandardResponse(UserCharacterResponseDto)
  async allocateStatPoints(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AllocateStatPointsRequestDto,
  ): Promise<UserCharacterResponseDto> {
    await this.allocateStatPointsService.execute({
      userId: user.id,
      statName: dto.statName,
      points: dto.points,
    });

    // 투자 후 결과 다시 조회 응답
    const character = await this.findUserCharacterService.execute(user.id);
    return UserCharacterResponseDto.fromDomain(character);
  }
}
