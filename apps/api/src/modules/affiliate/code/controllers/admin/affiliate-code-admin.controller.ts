// src/modules/affiliate/code/controllers/admin/affiliate-code-admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { PaginatedResponseDto } from 'src/common/http/types/pagination.types';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { FindCodesAdminService } from '../../application/find-codes-admin.service';
import { CreateCodeService } from '../../application/create-code.service';
import { UpdateCodeService } from '../../application/update-code.service';
import { FindCodeByIdAdminService } from '../../application/find-code-by-id-admin.service';
import { DeleteCodeAdminService } from '../../application/delete-code-admin.service';
import { FindCodesQueryDto } from './dto/request/find-codes-query.dto';
import { CreateCodeAdminRequestDto } from './dto/request/create-code-admin.request.dto';
import { UpdateCodeAdminRequestDto } from './dto/request/update-code-admin.request.dto';
import { AdminCodeListItemDto } from './dto/response/admin-code-list.response.dto';
import { AdminCodeResponseDto } from './dto/response/admin-code.response.dto';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { AffiliateCode } from '../../domain';

@Controller('admin/affiliate-codes')
@ApiTags('Admin Affiliate Codes (관리자 어플리에이트 코드 관리)')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AffiliateCodeAdminController {
  constructor(
    private readonly findCodesAdminService: FindCodesAdminService,
    private readonly createCodeService: CreateCodeService,
    private readonly updateCodeService: UpdateCodeService,
    private readonly findCodeByIdAdminService: FindCodeByIdAdminService,
    private readonly deleteCodeAdminService: DeleteCodeAdminService,
  ) { }

  /**
   * 어플리에이트 코드 목록 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_ADMIN_LIST_VIEW',
    extractMetadata: (_, args, result) => ({
      query: args[0], // FindCodesQueryDto
      count: result?.data?.length ?? 0,
      total: result?.total ?? 0,
    }),
  })
  @ApiOperation({
    summary: 'Get affiliate codes list / 어플리에이트 코드 목록 조회 (관리자용)',
    description:
      '관리자가 모든 어플리에이트 코드를 조회합니다. 페이징, 필터링, 정렬 기능을 지원합니다.',
  })
  @ApiPaginatedResponse(AdminCodeListItemDto, {
    status: 200,
    description:
      'Successfully retrieved affiliate codes list / 어플리에이트 코드 목록 조회 성공',
  })
  async listCodes(
    @Query() query: FindCodesQueryDto,
    @CurrentUser() admin: CurrentUserWithSession,
  ): Promise<PaginatedResponseDto<AdminCodeListItemDto>> {
    const result = await this.findCodesAdminService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      userId: query.userId,
      code: query.code,
      isActive: query.isActive,
      isDefault: query.isDefault,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data: result.data.map(this.toResponseDto),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    } as unknown as PaginatedResponseDto<AdminCodeListItemDto>;
  }

  /**
   * 어플리에이트 코드 상세 조회 (관리자용)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_ADMIN_DETAIL_VIEW',
    extractMetadata: (_, args, result) => ({
      codeId: args[0],
      userId: result?.userId,
    }),
  })
  @ApiOperation({
    summary: 'Get affiliate code detail / 어플리에이트 코드 상세 조회 (관리자용)',
    description: '관리자가 특정 어플리에이트 코드의 상세 정보를 조회합니다.',
  })
  @ApiStandardResponse(AdminCodeResponseDto, {
    status: 200,
    description: 'Successfully retrieved affiliate code detail / 상세 정보 조회 성공',
  })
  async getCode(
    @Param('id') id: string,
  ): Promise<AdminCodeResponseDto> {
    const code = await this.findCodeByIdAdminService.execute(id);
    return this.toResponseDto(code);
  }

  /**
   * 어플리에이트 코드 생성 (관리자용)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_ADMIN_CREATE',
    extractMetadata: (_, args, result) => ({
      targetUserId: args[0]?.userId,
      createdCode: result?.code,
    }),
  })
  @ApiOperation({
    summary: 'Create affiliate code / 어플리에이트 코드 생성 (관리자용)',
    description: '관리자가 특정 사용자의 어플리에이트 코드를 생성합니다.',
  })
  @ApiStandardResponse(AdminCodeResponseDto, {
    status: 201,
    description: 'Successfully created affiliate code / 코드 생성 성공',
  })
  async createCode(
    @Body() dto: CreateCodeAdminRequestDto,
  ): Promise<AdminCodeResponseDto> {
    const code = await this.createCodeService.execute({
      userId: BigInt(dto.userId),
      campaignName: dto.campaignName,
    });
    return this.toResponseDto(code);
  }

  /**
   * 어플리에이트 코드 수정 (관리자용)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_ADMIN_UPDATE',
    extractMetadata: (_, args, result) => ({
      codeId: args[0],
      changes: args[1],
      isDefault: result?.isDefault,
      isActive: result?.isActive,
    }),
  })
  @ApiOperation({
    summary: 'Update affiliate code / 어플리에이트 코드 수정 (관리자용)',
    description:
      '관리자가 어플리에이트 코드 정보를 수정합니다 (캠페인명, 활성상태, 기본코드설정).',
  })
  @ApiStandardResponse(AdminCodeResponseDto, {
    status: 200,
    description: 'Successfully updated affiliate code / 코드 수정 성공',
  })
  async updateCode(
    @Param('id') id: string,
    @Body() dto: UpdateCodeAdminRequestDto,
  ): Promise<AdminCodeResponseDto> {
    // 1. 코드를 먼저 조회하여 Owner ID 획득
    const existingCode = await this.findCodeByIdAdminService.execute(id);

    // 2. UpdateService 호출 (Owner ID 전달)
    const updatedCode = await this.updateCodeService.execute({
      id: existingCode.uid,
      userId: existingCode.userId,
      campaignName: dto.campaignName,
      isActive: dto.isActive,
      isDefault: dto.isDefault,
    });

    return this.toResponseDto(updatedCode);
  }

  /**
   * 어플리에이트 코드 삭제 (관리자용)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_ADMIN_DELETE',
    extractMetadata: (_, args) => ({
      codeId: args[0],
    }),
  })
  @ApiOperation({
    summary: 'Delete affiliate code / 어플리에이트 코드 삭제 (관리자용)',
    description: '관리자가 어플리에이트 코드를 삭제합니다.',
  })
  @ApiStandardResponse(undefined, {
    status: 204,
    description: 'Successfully deleted affiliate code / 코드 삭제 성공',
  })
  async deleteCode(@Param('id') id: string): Promise<void> {
    await this.deleteCodeAdminService.execute(id);
  }

  // --- Helper Methods ---

  private toResponseDto(code: AffiliateCode): AdminCodeResponseDto {
    return {
      id: code.id?.toString() ?? '',
      userId: code.userId.toString(),
      code: code.code,
      campaignName: code.campaignName,
      isActive: code.isActive,
      isDefault: code.isDefault,
      expiresAt: code.expiresAt,
      createdAt: code.createdAt,
      updatedAt: code.updatedAt,
      lastUsedAt: code.lastUsedAt,
    };
  }
}
