import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { UserRoleType } from '@prisma/client';
import { ApiPaginatedResponse, ApiStandardErrors, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';

// Status Services (Injection)
import { ListMyArtifactsService } from '../../application/list-my-artifacts.service';
import { EquipArtifactService } from '../../application/equip-artifact.service';
import { UnequipArtifactService } from '../../application/unequip-artifact.service';
import { GetMyArtifactProfileService } from '../../application/get-my-artifact-profile.service';

// Audit Log
import { AuditLog } from '../../../../audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../audit-log/domain';

// DTOs
import { UserArtifactResponseDto } from './dto/response/user-artifact.response.dto';
import { UserArtifactProfileResponseDto } from './dto/response/user-artifact-profile.response.dto';
import { EquipArtifactRequestDto } from './dto/request/equip-artifact.request.dto';
import { UnequipArtifactRequestDto } from './dto/request/unequip-artifact.request.dto';
import { GetMyArtifactsQueryDto } from './dto/request/get-my-artifacts.query.dto';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';

@ApiTags('User Artifact Inventory')
@Controller('user/artifact')
@RequireRoles(UserRoleType.USER)
@ApiBearerAuth()
@ApiStandardErrors()
export class UserArtifactInventoryController {
  constructor(
    private readonly listService: ListMyArtifactsService,
    private readonly equipService: EquipArtifactService,
    private readonly unequipService: UnequipArtifactService,
    private readonly profileService: GetMyArtifactProfileService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * [GET] 내 유물 통합 프로필 조회 (상태 + 요약 정보)
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get My Artifact System Profile / 내 유물 통합 프로필 조회',
    description: 'Displays current slots, pity stacks, and a summary of equipped items. / 슬롯 수, 천장 정보, 장착된 유물 요약 등을 포함한 프로필을 조회합니다.',
  })
  @ApiStandardResponse(UserArtifactProfileResponseDto)
  async getMyProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserArtifactProfileResponseDto> {
    return await this.profileService.execute(user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List Owned Artifacts / 보유 유물 목록 조회',
    description: 'Returns a paginated list of artifacts currently owned by the user. / 현재 보유한 전체 유물 리스트를 페이지네이션으로 조회합니다.',
  })
  @Paginated()
  @ApiPaginatedResponse(UserArtifactResponseDto)
  async getMyArtifacts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMyArtifactsQueryDto,
  ): Promise<PaginatedData<UserArtifactResponseDto>> {
    return await this.listService.execute(user.id, query);
  }

  /**
   * [POST] 유물 장착 시도
   */
  @Post('equip')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'EQUIP_ARTIFACT',
    extractMetadata: (req, _args, result) => ({
      userArtifactId: req.body.userArtifactId,
      slotNo: req.body.slotNo,
      artifactCode: result?.artifactCode,
    }),
  })
  @ApiOperation({
    summary: 'Equip Artifact / 유물 장착',
    description: 'Equips an owned artifact to a specific unlocked slot. / 보유한 유물을 지정된 활성 슬롯에 장착합니다.',
  })
  @ApiStandardResponse(UserArtifactResponseDto)
  async equipArtifact(
    @Body() body: EquipArtifactRequestDto,
  ): Promise<UserArtifactResponseDto> {
    const userArtifactId = this.sqidsService.decode(body.userArtifactId, SqidsPrefix.USER_ARTIFACT);
    const result = await this.equipService.execute(userArtifactId, body.slotNo);

    // 응답 ID 인코딩
    result.id = this.sqidsService.encode(BigInt(result.id), SqidsPrefix.USER_ARTIFACT);

    return result;
  }

  /**
   * [POST] 유물 장착 해제
   */
  @Post('unequip')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'UNEQUIP_ARTIFACT',
    extractMetadata: (req) => ({
      userArtifactId: req.body.userArtifactId,
    }),
  })
  @ApiOperation({
    summary: 'Unequip Artifact / 유물 장착 해제',
    description: 'Removes the artifact from its current slot. / 지정된 유물의 장착 정보를 제거합니다.',
  })
  @ApiStandardResponse(Boolean)
  async unequipArtifact(
    @Body() body: UnequipArtifactRequestDto,
  ): Promise<boolean> {
    const userArtifactId = this.sqidsService.decode(body.userArtifactId, SqidsPrefix.USER_ARTIFACT);
    return await this.unequipService.execute(userArtifactId);
  }
}
