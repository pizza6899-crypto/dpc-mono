import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
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

@ApiTags('Admin Artifact Catalog')
@Controller('admin/artifact/catalog')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactCatalogAdminController {

  /**
   * [GET] 유물 카탈로그 목록 조회
   */
  @Get()
  @ApiOperation({
    summary: 'Get artifact catalogs list / 유물 카탈로그 목록 조회',
    description: 'Retrieve a paginated list of all artifact catalogs. Supports filtering by grade.\n전체 유물 카탈로그 목록을 페이지네이션하여 조회합니다. 등급별 필터링을 지원합니다.'
  })
  @ApiPaginatedResponse(ArtifactCatalogAdminSummaryResponseDto, {
    description: 'Successfully retrieved paginated list / 페이지네이션 목록 조회 성공'
  })
  async getCatalogs(
    @Query() query: GetArtifactCatalogAdminQueryDto,
  ): Promise<PaginatedData<ArtifactCatalogAdminSummaryResponseDto>> {
    const { page = 1, limit = 20, grades } = query;
    const grade = grades?.[0]; // Use the first grade from the filter for mock data

    // Mock response with pagination structure
    return {
      data: [
        {
          id: '1',
          code: 'ART_001',
          grade: grade || ArtifactGrade.COMMON,
          drawWeight: 1000,
          casinoBenefit: 10,
          slotBenefit: 0,
          sportsBenefit: 0,
          minigameBenefit: 0,
          badBeatBenefit: 0,
          criticalBenefit: 0,
          imageUrl: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      total: 1,
      page,
      limit,
    };
  }

  /**
   * [GET] 유물 상세 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get artifact catalog detail / 유물 상세 조회',
    description: 'Retrieve detailed information of a specific artifact catalog by its ID.\nID를 기반으로 특정 유물의 상세 정보를 조회합니다.'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved detail / 상세 정보 조회 성공',
    type: ArtifactCatalogAdminDetailResponseDto
  })
  async getCatalog(@Param('id') id: string): Promise<ArtifactCatalogAdminDetailResponseDto> {
    // Mock response
    return {
      id,
      code: 'ART_001',
      grade: ArtifactGrade.COMMON,
      drawWeight: 1000,
      casinoBenefit: 10,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatBenefit: 0,
      criticalBenefit: 0,
      imageUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
