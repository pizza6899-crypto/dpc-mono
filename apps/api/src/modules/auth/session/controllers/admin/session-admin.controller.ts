import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { UserRoleType } from '@repo/database';
import { PaginatedData } from 'src/common/http/types';
import { ListSessionsService } from '../../application/list-sessions.service';
import { RevokeSessionService } from '../../application/revoke-session.service';
import { ExpireUserSessionsService } from '../../application/expire-user-sessions.service';
import { ListSessionsQueryDto } from './dto/request/list-sessions-query.dto';
import { SessionListItemDto } from './dto/response/session-list.response.dto';
import {
  RevokeSessionResponseDto,
  RevokeUserSessionsResponseDto,
} from './dto/response/revoke-session.response.dto';

@Controller('admin/sessions')
@ApiTags('Admin Sessions (관리자 세션 관리)')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class SessionAdminController {
  constructor(
    private readonly listSessionsService: ListSessionsService,
    private readonly revokeSessionService: RevokeSessionService,
    private readonly expireUserSessionsService: ExpireUserSessionsService,
  ) {}

  /**
   * 세션 목록 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get session list / 세션 목록 조회 (관리자용)',
    description:
      '관리자가 전체 세션 목록을 조회합니다. 페이징, 필터링, 정렬 기능을 지원합니다. userId 필터를 사용하여 특정 유저의 세션만 조회할 수 있습니다.',
  })
  @ApiPaginatedResponse(SessionListItemDto, {
    status: 200,
    description: 'Successfully retrieved session list / 세션 목록 조회 성공',
  })
  async listSessions(
    @Query() query: ListSessionsQueryDto,
  ): Promise<PaginatedData<SessionListItemDto>> {
    const result = await this.listSessionsService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      userId: query.userId,
      status: query.status,
      type: query.type,
      activeOnly: query.activeOnly,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data: result.data.map((session) => this.toSessionListItemDto(session)),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  /**
   * 특정 세션 종료
   */
  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke session / 특정 세션 종료',
    description:
      '관리자가 특정 세션을 명시적으로 종료 처리합니다. DB에서 REVOKED 상태로 변경하고 실제 세션 연결도 종료합니다.',
  })
  @ApiStandardResponse(RevokeSessionResponseDto, {
    status: 200,
    description: 'Successfully revoked session / 세션 종료 성공',
  })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() admin: CurrentUserWithSession,
  ): Promise<RevokeSessionResponseDto> {
    const revokedSession = await this.revokeSessionService.execute({
      sessionId,
      revokedBy: admin.id,
    });

    return {
      uid: revokedSession.uid,
      sessionId: revokedSession.sessionId,
      userId: revokedSession.userId.toString(),
      success: true,
    };
  }

  /**
   * 특정 유저의 모든 세션 종료
   */
  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke all user sessions / 유저의 모든 세션 종료',
    description:
      '관리자가 특정 유저의 모든 활성 세션을 종료 처리합니다. 각 세션을 REVOKED 상태로 변경하고 실제 세션 연결도 종료합니다.',
  })
  @ApiStandardResponse(RevokeUserSessionsResponseDto, {
    status: 200,
    description: 'Successfully revoked all user sessions / 유저의 모든 세션 종료 성공',
  })
  async revokeUserSessions(
    @Param('userId') userId: string,
    @CurrentUser() admin: CurrentUserWithSession,
  ): Promise<RevokeUserSessionsResponseDto> {
    const result = await this.expireUserSessionsService.execute({
      userId: BigInt(userId),
      revokedBy: admin.id,
    });

    return {
      revokedCount: result.revokedCount,
      userId: userId,
    };
  }

  /**
   * UserSession 엔티티를 DTO로 변환
   * 
   * @private
   */
  private toSessionListItemDto(session: any): SessionListItemDto {
    return {
      uid: session.uid,
      sessionId: session.sessionId,
      userId: session.userId.toString(),
      type: session.type,
      status: session.status,
      deviceInfo: {
        ipAddress: session.deviceInfo.ipAddress,
        userAgent: session.deviceInfo.userAgent,
        deviceFingerprint: session.deviceInfo.deviceFingerprint,
        isMobile: session.deviceInfo.isMobile,
        deviceName: session.deviceInfo.deviceName,
        os: session.deviceInfo.os,
        browser: session.deviceInfo.browser,
      },
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      revokedBy: session.revokedBy?.toString() ?? null,
    };
  }
}

