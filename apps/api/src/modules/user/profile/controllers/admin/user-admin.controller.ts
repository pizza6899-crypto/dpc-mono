// src/modules/user/profile/controllers/admin/user-admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import type { PaginatedData } from 'src/common/http/types';
import { ListUsersService } from '../../application/list-users.service';
import { GetUserService } from '../../application/get-user.service';
import { UpdateUserAdminService } from '../../application/update-user-admin.service';
import { ListUsersAdminQueryDto } from './dto/request/list-users-admin-query.dto';
import { UpdateUserAdminRequestDto } from './dto/request/update-user-admin.request.dto';
import { UserAdminListItemDto } from './dto/response/user-admin-list.response.dto';
import { UserAdminDetailResponseDto } from './dto/response/user-admin-detail.response.dto';

import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/users')
@ApiTags('Admin Users')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class UserAdminController {
  constructor(
    private readonly listUsersService: ListUsersService,
    private readonly getUserService: GetUserService,
    private readonly updateUserAdminService: UpdateUserAdminService,
  ) { }

  /**
   * 사용자 상세 조회 (관리자용)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user details / 사용자 상세 조회 (관리자용)',
  })
  @ApiStandardResponse(UserAdminDetailResponseDto, {
    status: 200,
    description: 'Successfully retrieved user details / 사용자 상세 조회 성공',
  })
  async findOne(@Param('id') id: string): Promise<UserAdminDetailResponseDto> {
    const user = await this.getUserService.getById(BigInt(id));
    return {
      id: user.id.toString(),
      loginId: user.loginId,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      status: user.status,
      country: user.getLocation().country,
      timezone: user.getLocation().timezone,
      primaryCurrency: user.getCurrency().primaryCurrency,
      playCurrency: user.getCurrency().playCurrency,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 사용자 목록 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get user list / 사용자 목록 조회 (관리자용)',
    description:
      '관리자가 등록된 사용자 목록을 조회합니다. 페이징, 필터링, 정렬 기능을 지원합니다.',
  })
  @ApiPaginatedResponse(UserAdminListItemDto, {
    status: 200,
    description: 'Successfully retrieved user list / 사용자 목록 조회 성공',
  })
  async listUsers(
    @Query() query: ListUsersAdminQueryDto,
  ): Promise<PaginatedData<UserAdminListItemDto>> {
    const result = await this.listUsersService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy as any,
      sortOrder: query.sortOrder,
      email: query.email,
      loginId: query.loginId,
      nickname: query.nickname,
      role: query.role,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data: result.data.map((user) => ({
        id: user.id.toString(),
        loginId: user.loginId,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
        status: user.status,
        country: user.getLocation().country,
        timezone: user.getLocation().timezone,
        primaryCurrency: user.getCurrency().primaryCurrency,
        playCurrency: user.getCurrency().playCurrency,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  /**
   * 사용자 정보 업데이트 (관리자용)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user / 사용자 정보 수정 (관리자용)',
    description: '관리자가 특정 사용자의 이메일, 상태, 통화 설정을 변경합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'UPDATE_USER',
    extractMetadata: (req) => ({ userId: req.params.id, body: req.body }),
  })
  @ApiStandardResponse(UserAdminDetailResponseDto, {
    status: 200,
    description: 'Successfully updated user / 사용자 정보 수정 성공',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserAdminRequestDto,
  ): Promise<UserAdminDetailResponseDto> {
    const user = await this.updateUserAdminService.execute({
      id: BigInt(id),
      email: dto.email,
      nickname: dto.nickname,
      status: dto.status,
      primaryCurrency: dto.primaryCurrency,
      playCurrency: dto.playCurrency,
    });

    return {
      id: user.id.toString(),
      loginId: user.loginId,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      status: user.status,
      country: user.getLocation().country,
      timezone: user.getLocation().timezone,
      primaryCurrency: user.getCurrency().primaryCurrency,
      playCurrency: user.getCurrency().playCurrency,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
