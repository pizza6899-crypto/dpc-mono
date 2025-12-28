import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../platform/http/decorators/api-response.decorator';
import { LoginResponseDto } from '../../dtos/auth-response.dto';
import { AdminLoginDto } from '../../dtos/login.dto';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';
import {
  GuestOnly,
  Public,
} from 'src/platform/auth/decorators/roles.decorator';
import { EnvService } from 'src/platform/env/env.service';
import type { Request } from 'express';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { AdminLocalAuthGuard } from 'src/platform/auth/guards/admin-local-auth.guard';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types';
import {
  CurrentUser,
  type CurrentUserWithSession,
} from 'src/platform/auth/decorators/current-user.decorator';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { CheckAuthStatusResponseDto } from '../../dtos/check-auth-status.dto';

@Controller('admin/auth')
@ApiTags('관리자 인증')
@ApiStandardErrors()
export class AdminAuthController {
  constructor(
    private readonly envService: EnvService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 5,
    ttl: 900,
    scope: ThrottleScope.IP,
  })
  @GuestOnly()
  @UseGuards(AdminLocalAuthGuard)
  @ApiOperation({
    summary: '관리자 로그인',
    description: '관리자 계정으로 로그인합니다.',
  })
  @ApiStandardResponse(LoginResponseDto, {
    status: 200,
    description: '관리자 로그인 성공',
  })
  async login(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @CurrentUser() user: CurrentUserWithSession,
    @Body() loginDto: AdminLoginDto,
  ): Promise<LoginResponseDto> {
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.ADMIN_LOGIN,
        description: 'Admin logged in successfully',
      },
      requestInfo,
    );
    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 10,
    ttl: 60,
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: '관리자 로그아웃',
    description: '관리자 세션을 종료합니다.',
  })
  @ApiStandardResponse(undefined, {
    status: 200,
    description: '관리자 로그아웃 성공',
  })
  async logout(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @CurrentUser() user: CurrentUserWithSession,
    @Req() req: Request,
  ): Promise<void> {
    req.logout((err) => {
      if (err) {
        console.error('Admin logout error:', err);
      }
    });

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.USER_LOGOUT,
        description: 'Admin logged out',
      },
      requestInfo,
    );
  }

  @Get('status')
  @Public()
  @Throttle({
    limit: 30,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: '관리자 로그인 상태 확인',
    description: '현재 관리자의 로그인 여부를 확인합니다.',
  })
  @ApiStandardResponse(CheckAuthStatusResponseDto, {
    status: 200,
    description: '관리자 로그인 상태 확인 성공',
  })
  async checkAdminAuthStatus(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserWithSession | undefined,
  ): Promise<CheckAuthStatusResponseDto> {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isAuthenticated = req.isAuthenticated() && !!user && isAdmin;

    return {
      isAuthenticated,
      user:
        isAuthenticated && user
          ? {
              id: user.id,
              email: user.email,
            }
          : null,
    };
  }

  @Get('session-test')
  @Public()
  @ApiOperation({
    summary: '관리자 세션 테스트',
    description: '관리자 세션 정보를 확인합니다.',
  })
  async testAdminSession(@Req() req: Request) {
    // 세션이 없으면 초기화 (일반 사용자처럼)
    if (req.session) {
      // 세션에 접근만 해도 express-session이 자동으로 처리
      (req.session as any).test = Date.now();
    }

    return {
      sessionId: req.sessionID,
      cookieName: this.envService.adminSession.name,
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      sessionData: {
        cookie: req.session?.cookie,
      },
    };
  }
}
