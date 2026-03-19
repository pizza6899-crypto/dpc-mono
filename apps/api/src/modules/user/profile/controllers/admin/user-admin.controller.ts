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
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import * as AuthTypes from 'src/common/auth/types/auth.types';
import type { PaginatedData } from 'src/common/http/types';
import { ListUsersService } from '../../application/list-users.service';
import { UpdateUserAdminService } from '../../application/update-user-admin.service';
import { CloseUserAdminService } from '../../application/close-user-admin.service';
import { RestoreUserAdminService } from '../../application/restore-user-admin.service';
import { ExpireUserSessionsService } from 'src/modules/auth/session/application/expire-user-sessions.service';
import { RevokeUserGameSessionsService } from 'src/modules/casino-session/application/revoke-user-game-sessions.service';
import { ListUsersAdminQueryDto } from './dto/request/list-users-admin-query.dto';
import { UpdateUserAdminRequestDto } from './dto/request/update-user-admin.request.dto';
import { CloseUserAccountRequestDto } from './dto/request/close-user-account.request.dto';
import { UserAdminListItemDto } from './dto/response/user-admin-list.response.dto';
import { UserAdminDetailResponseDto } from './dto/response/user-admin-detail.response.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

@Controller('admin/users')
@ApiTags('Admin Users')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
@ApiCookieAuth()
export class UserAdminController {
  constructor(
    private readonly listUsersService: ListUsersService,
    private readonly updateUserAdminService: UpdateUserAdminService,
    private readonly closeUserAdminService: CloseUserAdminService,
    private readonly restoreUserAdminService: RestoreUserAdminService,
    private readonly expireUserSessionsService: ExpireUserSessionsService,
    private readonly revokeUserGameSessionsService: RevokeUserGameSessionsService,
  ) {}

  /**
   * 사용자 목록 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get user list / 사용자 목록 조회 (관리자용)',
    description:
      'Retrieve a list of registered users as an administrator. Supports paging, filtering, and sorting. / 관리자가 등록된 사용자 목록을 조회합니다. 페이징, 필터링, 정렬 기능을 지원합니다.',
  })
  @ApiPaginatedResponse(UserAdminListItemDto, {
    status: 200,
    description: 'Successfully retrieved user list',
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
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.getTrust().isEmailVerified,
        isPhoneVerified: user.getTrust().isPhoneVerified,
        registrationMethod: user.getAuthInfo().registrationMethod,
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
    description:
      "Administrator updates the specific user's email, status, and currency settings. / 관리자가 특정 사용자의 이메일, 상태, 통화 설정을 변경합니다.",
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'UPDATE_USER',
    extractMetadata: (req) => ({ userId: req.params.id, body: req.body }),
  })
  @ApiStandardResponse(UserAdminDetailResponseDto, {
    status: 200,
    description: 'Successfully updated user',
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
      role: dto.role,
      primaryCurrency: dto.primaryCurrency,
      playCurrency: dto.playCurrency,
      phoneNumber: dto.phoneNumber,
      isPhoneVerified: dto.isPhoneVerified,
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
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.getTrust().isEmailVerified,
      isPhoneVerified: user.getTrust().isPhoneVerified,
      registrationMethod: user.getAuthInfo().registrationMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 사용자 계정 종료 (관리자용)
   */
  @Patch(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close user account / 사용자 계정 종료/탈퇴 처리 (관리자용)',
    description:
      'Permanently close the user account and terminate all active sessions. / 사용자의 계정을 종료 처리하고 모든 활성 세션을 즉시 파기합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'CLOSE_USER_ACCOUNT',
    extractMetadata: (req) => ({ userId: req.params.id, body: req.body }),
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Successfully closed user account',
  })
  async closeUser(
    @Param('id') id: string,
    @Body() dto: CloseUserAccountRequestDto,
    @CurrentUser() admin: AuthTypes.AuthenticatedUser,
  ): Promise<void> {
    return this.closeUserAdminService.execute({
      userId: BigInt(id),
      adminId: admin.id,
      reason: dto.reason,
    });
  }

  /**
   * 사용자 계정 복구 (관리자용)
   */
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore user account / 사용자 계정 복구 (관리자용)',
    description:
      'Restore a previously closed user account back to active status. / 이전의 종료(탈퇴)된 사용자 계정을 다시 활성 상태로 복구합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'RESTORE_USER_ACCOUNT',
    extractMetadata: (req) => ({ userId: req.params.id }),
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Successfully restored user account',
  })
  async restoreUser(
    @Param('id') id: string,
    @CurrentUser() admin: AuthTypes.AuthenticatedUser,
  ): Promise<void> {
    return this.restoreUserAdminService.execute({
      userId: BigInt(id),
      adminId: admin.id,
    });
  }

  /**
   * 사용자 강제 로그아웃 (관리자용)
   */
  @Patch(':id/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force logout user / 사용자 강제 로그아웃 (관리자용)',
    description:
      'Imidiatly terminate all active sessions of the user. / 해당 사용자의 모든 활성 세션을 즉시 파기하여 강제 로그아웃 처리합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'USER',
    action: 'FORCE_LOGOUT_USER',
    extractMetadata: (req) => ({ userId: req.params.id }),
  })
  @ApiStandardResponse(Object, {
    status: 200,
    description: 'Successfully forced logout user',
  })
  async forceLogout(
    @Param('id') id: string,
    @CurrentUser() admin: AuthTypes.AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<void> {
    await this.expireUserSessionsService.execute({
      userId: BigInt(id),
      revokedBy: admin.id,
      requestInfo,
    });

    // 2. 게임 세션 즉시 파기
    await this.revokeUserGameSessionsService.execute(BigInt(id), admin.id);
  }
}
