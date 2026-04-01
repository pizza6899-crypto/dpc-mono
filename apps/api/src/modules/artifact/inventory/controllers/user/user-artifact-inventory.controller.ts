import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { UserRoleType } from '@prisma/client';
import { ApiPaginatedResponse, ApiStandardErrors, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';

// Status Services (Injection)
import { GetUserArtifactStatusService } from '../../../status/application/get-user-artifact-status.service';

// DTOs
import { UserArtifactResponseDto } from './dto/response/user-artifact.response.dto';
import { UserArtifactProfileResponseDto } from './dto/response/user-artifact-profile.response.dto';
import { EquipArtifactRequestDto } from './dto/request/equip-artifact.request.dto';
import { UnequipArtifactRequestDto } from './dto/request/unequip-artifact.request.dto';
import { GetMyArtifactsQueryDto } from './dto/request/get-my-artifacts.query.dto';

@ApiTags('User Artifact Inventory')
@Controller('user/artifact')
@RequireRoles(UserRoleType.USER)
@ApiStandardErrors()
export class UserArtifactInventoryController {
  constructor(
    private readonly statusService: GetUserArtifactStatusService,
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
    // 실제 서비스 구현 대신 목업 및 Status 모듈 서비스 조합
    const status = await this.statusService.execute(user.id);

    // TODO: 인벤토리 모듈의 장착 유물 조회 서비스 구현 필요
    return {
      activeSlotCount: status.activeSlotCount,
      slots: Array.from({ length: status.activeSlotCount }, (_, i) => ({
        slotNo: i + 1,
        artifact: null, // 실제 구현 시 장착 정보 매핑
      })),
      effects: {
        casinoBenefit: 0,
        slotBenefit: 0,
        sportsBenefit: 0,
        minigameBenefit: 0,
        badBeatBenefit: 0,
        criticalBenefit: 0,
      },
      tickets: status.tickets,
    };
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
    // TODO: 인벤토리 전문 조회 서비스 연동 필요
    return {
      data: [],
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      total: 0,
    }; // Mock
  }

  /**
   * [POST] 유물 장착 시도
   */
  @Post('equip')
  @ApiOperation({
    summary: 'Equip Artifact / 유물 장착',
    description: 'Equips an owned artifact to a specific unlocked slot. / 보유한 유물을 지정된 활성 슬롯에 장착합니다.',
  })
  @ApiStandardResponse(UserArtifactResponseDto)
  async equipArtifact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: EquipArtifactRequestDto,
  ): Promise<any> {
    // TODO: 장착 로직 서비스 구현 필요
    return {
      message: '장착이 성공적으로 처리되었습니다.',
      userArtifactId: body.userArtifactId,
      slotNo: body.slotNo,
    }; // Mock
  }

  /**
   * [POST] 유물 장착 해제
   */
  @Post('unequip')
  @ApiOperation({
    summary: 'Unequip Artifact / 유물 장착 해제',
    description: 'Removes the artifact from its current slot. / 지정된 유물의 장착 정보를 제거합니다.',
  })
  @ApiStandardResponse(Boolean)
  async unequipArtifact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UnequipArtifactRequestDto,
  ): Promise<boolean> {
    const { userArtifactId } = body;
    // TODO: 장속 해제 로직 구현 필요
    console.log('Unequipping:', userArtifactId);
    return true; // Mock
  }
}
