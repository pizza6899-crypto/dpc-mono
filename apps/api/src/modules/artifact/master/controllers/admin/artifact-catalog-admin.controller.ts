import { Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { GetArtifactCatalogAdminService } from '../../application/get-artifact-catalog-admin.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ArtifactCatalogAdminSummaryResponseDto } from './dto/response/artifact-catalog-admin-list.response.dto';
import { ArtifactCatalogAdminDetailResponseDto } from './dto/response/artifact-catalog-admin-detail.response.dto';
import { CreateArtifactCatalogAdminRequestDto } from './dto/request/create-artifact-catalog-admin.request.dto';
import { UpdateArtifactCatalogAdminRequestDto } from './dto/request/update-artifact-catalog-admin.request.dto';
import { ArtifactGrade } from '@prisma/client';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { GetArtifactCatalogAdminQueryDto } from './dto/request/get-artifact-catalog-admin-query.dto';
import { ArtifactCatalog } from '../../domain/artifact-catalog.entity';

@ApiTags('Admin Artifact Catalog')
@Controller('admin/artifact/catalog')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactCatalogAdminController {
  constructor(private readonly getService: GetArtifactCatalogAdminService) { }

  /**
   * [GET] 유물 카탈로그 목록 조회
   */
  @Get()
  @ApiOperation({
    summary: 'Get Artifact Catalog List / 유물 카탈로그 목록 조회',
    description: 'Retrieve a list of artifact catalogs with filtering and pagination. / 필터링 및 페이지네이션을 지원하는 유물 카탈로그 목록 조회'
  })
  @ApiPaginatedResponse(ArtifactCatalogAdminSummaryResponseDto)
  async getCatalogs(
    @Query() query: GetArtifactCatalogAdminQueryDto,
  ): Promise<PaginatedData<ArtifactCatalogAdminSummaryResponseDto>> {
    const { data, total, page, limit } = await this.getService.getCatalogs(query);

    return {
      total,
      page,
      limit,
      data: data.map(item => this.mapToSummaryDto(item))
    };
  }

  /**
   * [GET] 유물 카탈로그 단건 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get Artifact Catalog Detail / 유물 카탈로그 단건 상세 조회',
    description: 'Retrieve detailed information of a specific artifact catalog. / 특정 유물 카탈로그의 상세 정보를 조회합니다.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success / 조회 성공',
    type: ArtifactCatalogAdminDetailResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found / 해당 유물을 찾을 수 없음'
  })
  async getCatalog(@Param('id') id: string): Promise<ArtifactCatalogAdminDetailResponseDto> {
    const item = await this.getService.getCatalog(id);
    return this.mapToDetailDto(item);
  }

  /**
   * Entity를 Summary DTO로 변환 (인라인 매핑 메서드)
   */
  private mapToSummaryDto(item: ArtifactCatalog): ArtifactCatalogAdminSummaryResponseDto {
    return {
      id: item.id.toString(),
      code: item.code,
      grade: item.grade,
      drawWeight: item.drawWeight,
      imageUrl: item.imageUrl ?? undefined,
      casinoBenefit: item.statsSummary.casinoBenefit,
      slotBenefit: item.statsSummary.slotBenefit,
      sportsBenefit: item.statsSummary.sportsBenefit,
      minigameBenefit: item.statsSummary.minigameBenefit,
      badBeatBenefit: item.statsSummary.badBeatBenefit,
      criticalBenefit: item.statsSummary.criticalBenefit,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Entity를 Detail DTO로 변환
   */
  private mapToDetailDto(item: ArtifactCatalog): ArtifactCatalogAdminDetailResponseDto {
    return this.mapToSummaryDto(item);
  }

  /**
   * [POST] 유물 등록
   */
  @Post()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'CREATE_CATALOG',
    extractMetadata: (req) => ({ payload: req.body }),
  })
  @ApiOperation({
    summary: 'Create new artifact catalog / 유물 신규 등록',
    description: 'Register a new artifact master data. Image URL will be resolved from the provided fileId in the service.\n새로운 유물 마스터 데이터를 등록합니다. 이미지 URL은 전달된 fileId를 기반으로 서비스에서 처리됩니다.'
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully created / 유물 등록 성공',
    type: ArtifactCatalogAdminDetailResponseDto
  })
  async createCatalog(
    @Body() dto: CreateArtifactCatalogAdminRequestDto,
  ): Promise<ArtifactCatalogAdminDetailResponseDto> {
    // Mock response
    return {
      id: '100',
      code: dto.code,
      grade: dto.grade,
      drawWeight: dto.drawWeight ?? 1000,
      casinoBenefit: dto.casinoBenefit ?? 0,
      slotBenefit: dto.slotBenefit ?? 0,
      sportsBenefit: dto.sportsBenefit ?? 0,
      minigameBenefit: dto.minigameBenefit ?? 0,
      badBeatBenefit: dto.badBeatBenefit ?? 0,
      criticalBenefit: dto.criticalBenefit ?? 0,
      imageUrl: `https://mock-storage.com/${dto.fileId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * [PATCH] 유물 정보 수정
   */
  @Patch(':id')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'UPDATE_CATALOG',
    extractMetadata: (req) => ({ id: req.params.id, payload: req.body }),
  })
  @ApiOperation({
    summary: 'Update artifact catalog / 유물 정보 수정',
    description: 'Update existing artifact catalog data. Only provided fields will be updated.\n기존 유물 카탈로그 정보를 수정합니다. 전달된 필드만 업데이트됩니다.'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated / 유물 정보 수정 성공',
    type: ArtifactCatalogAdminDetailResponseDto
  })
  async updateCatalog(
    @Param('id') id: string,
    @Body() dto: UpdateArtifactCatalogAdminRequestDto,
  ): Promise<ArtifactCatalogAdminDetailResponseDto> {
    // Mock response
    return {
      id,
      code: dto.code || 'ART_UPDATED',
      grade: dto.grade || ArtifactGrade.EPIC,
      drawWeight: dto.drawWeight ?? 1000,
      casinoBenefit: dto.casinoBenefit ?? 0,
      slotBenefit: dto.slotBenefit ?? 0,
      sportsBenefit: dto.sportsBenefit ?? 0,
      minigameBenefit: dto.minigameBenefit ?? 0,
      badBeatBenefit: dto.badBeatBenefit ?? 0,
      criticalBenefit: dto.criticalBenefit ?? 0,
      imageUrl: dto.fileId ? `https://mock-storage.com/${dto.fileId}` : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * [DELETE] 유물 삭제
   */
  @Delete(':id')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'DELETE_CATALOG',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
  @ApiOperation({
    summary: 'Delete artifact catalog / 유물 삭제',
    description: 'Delete a specific artifact catalog data. This cannot be undone.\n특정 유물 카탈로그 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted / 유물 삭제 성공'
  })
  async deleteCatalog(@Param('id') id: string): Promise<{ success: boolean }> {
    // Mock response
    return { success: true };
  }
}
