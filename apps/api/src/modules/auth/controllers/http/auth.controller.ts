import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Inject,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../platform/http/decorators/api-response.decorator';
import { AuthService } from '../../application/auth.service';
import { GuestOnly } from 'src/platform/auth/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { LocalAuthGuard } from 'src/platform/auth/guards/local-auth.guard';
import { Public } from 'src/platform/auth/decorators/roles.decorator';
import {
  AuthResponseDto,
  LoginResponseDto,
} from '../../dtos/auth-response.dto';
import { LoginDto } from '../../dtos/login.dto';
import { RegisterDto } from '../../dtos/register.dto';
import { CheckAuthStatusResponseDto } from '../../dtos/check-auth-status.dto';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';

@Controller('auth')
@ApiTags('Auth(인증)')
@ApiStandardErrors()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  @Post('login')
  @Throttle({
    limit: 5,
    ttl: 900, // 15분
    scope: ThrottleScope.IP,
  })
  @GuestOnly()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Login (로그인)',
    description:
      'Login with email and password (이메일/비밀번호로 로그인합니다.)',
  })
  @ApiStandardResponse(LoginResponseDto, {
    status: 200,
    description: 'Login success',
  })
  async login(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @CurrentUser() user: CurrentUserWithSession,
    @Body() loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.USER_LOGIN,
        description: 'User logged in successfully',
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

  @Post('register')
  @Public() // Public 데코레이터 사용 (GuestOnly 대신)
  @Throttle({
    limit: 5,
    ttl: 1800, // 30분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Register (회원가입)',
    description:
      'Creates a new user account. (새로운 사용자 계정을 생성합니다.)',
  })
  @ApiStandardResponse(AuthResponseDto, {
    status: 201,
    description: 'Register success',
  })
  async register(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @Body() registerDto: RegisterDto,
  ): Promise<AuthResponseDto> {
    const response = await this.authService.register(registerDto, requestInfo);
    return response;
  }

  @Post('logout')
  @Throttle({
    limit: 10,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Logout (로그아웃)',
    description:
      'Ends the current session and invalidates the token. (현재 세션을 종료하고 토큰을 무효화합니다.)',
  })
  @ApiStandardResponse(undefined, {
    status: 200,
    description: 'Logout success',
  })
  async logout(
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
    @CurrentUser() user: CurrentUserWithSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // Passport 세션 전략이 자동으로 세션을 관리하므로
    // req.logout()을 호출하면 세션이 자동으로 삭제됨
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
    });

    // 세션 완전 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    // 액티비티 로그
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.USER_LOGOUT,
        description: 'User logged out',
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
    summary: 'Check authentication status (인증 상태 확인)',
    description:
      'Returns whether the current user is authenticated. (현재 사용자의 인증 여부를 반환합니다.)',
  })
  @ApiStandardResponse(CheckAuthStatusResponseDto, {
    status: 200,
    description: 'Authentication status retrieved successfully',
  })
  async checkAuthStatus(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserWithSession | undefined,
  ): Promise<CheckAuthStatusResponseDto> {
    const isAuthenticated = req.isAuthenticated() && !!user;

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
    summary: '세션 테스트',
    description: '일반 사용자 세션 정보를 확인합니다.',
  })
  async testSession(@Req() req: Request) {
    return {
      sessionId: req.sessionID,
      cookieName: 'sessionId', // envService.session.name
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      sessionData: {
        cookie: req.session.cookie,
        // 세션에 저장된 모든 데이터 (보안상 실제로는 제한적으로 노출)
      },
    };
  }
}
