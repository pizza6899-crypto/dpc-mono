import { Controller, Post, Get, Body, Req, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../common/http/decorators/api-response.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { AuthenticateIdentityService } from '../../application/authenticate-identity.service';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { CheckUserStatusService } from '../../application/check-user-status.service';
import { UserLoginRequestDto } from './dto/request/login.request.dto';
import { UserLoginResponseDto } from './dto/response/login.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { UserAuthStatusResponseDto } from './dto/response/auth-status.response.dto';
import { UserLogoutResponseDto } from './dto/response/logout.response.dto';
import { UserRoleType } from '@prisma/client';
import type { Request } from 'express';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

@Controller('auth')
@ApiTags('User Auth')
@ApiStandardErrors()
export class UserAuthController {
  constructor(
    private readonly authenticateIdentityService: AuthenticateIdentityService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly checkUserStatusService: CheckUserStatusService,
    private readonly sqidsService: SqidsService,
  ) {}

  @Post('login')
  @Public()
  @Throttle({
    limit: 10,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Login (로그인)',
    description: 'Email/Password 기반 로그인',
  })
  @ApiStandardResponse(UserLoginResponseDto, {
    status: HttpStatus.OK,
    description: 'Login Success',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'LOGIN',
    extractMetadata: (_, args, result, error) => {
      const [dto] = args;
      return {
        loginId: dto.loginId,
        success: !error,
        failureReason: error ? error.message : undefined,
      };
    },
  })
  async login(
    @Body() dto: UserLoginRequestDto,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
    @Req() req: Request,
  ): Promise<UserLoginResponseDto> {
    // 1. 자격 증명 인증 (이메일/비밀번호 검증, 계정 잠금 체크, 실패 시도 기록)
    const authenticatedUser = await this.authenticateIdentityService.execute({
      loginId: dto.loginId,
      password: dto.password,
      clientInfo,
      isAdmin: false,
    });

    // 2. 세션에 사용자 저장
    await new Promise<void>((resolve, reject) => {
      req.login(authenticatedUser as any, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // 3. 로그인 성공 기록 (액티비티 로그 등) 및 HTTP 세션 생성
    await this.loginService.execute({
      user: authenticatedUser,
      clientInfo,
      sessionId: req.sessionID,
      isAdmin: false,
    });

    return {
      id: this.sqidsService.encode(authenticatedUser.id, SqidsPrefix.USER),
    };
  }

  @Post('logout')
  @Public()
  @Throttle({
    limit: 10,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Logout (로그아웃)',
    description:
      '현재 세션 종료. 인증 상태와 관계없이 항상 성공 응답을 반환합니다.',
  })
  @ApiStandardResponse(UserLogoutResponseDto, {
    status: HttpStatus.OK,
    description: 'Logout Success',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'LOGOUT',
    logOnSuccess: true,
    logOnError: false, // 로그아웃 실패는 기록하지 않음
  })
  async logout(
    @CurrentUser() user?: AuthenticatedUser,
    @RequestClientInfoParam() clientInfo?: RequestClientInfo,
    @Req() req?: Request,
  ): Promise<UserLogoutResponseDto> {
    // 1. DB 세션 종료 (LogoutService에서 처리)
    if (user && clientInfo) {
      try {
        const isAdmin =
          user.role === UserRoleType.ADMIN ||
          user.role === UserRoleType.SUPER_ADMIN;

        await this.logoutService.execute({
          userId: user.id,
          sessionId: req?.sessionID,
          clientInfo,
          isAdmin,
        });
      } catch (error) {
        // LogoutService 에러는 무시
      }
    }

    // 2. Express 세션 종료 및 쿠키 삭제
    if (req) {
      await new Promise<void>((resolve) => {
        // passport logout
        req.logout((err) => {
          // session destroy
          req.session?.destroy(() => {
            resolve();
          });
        });
      });
    }

    return {};
  }

  @Get('status')
  @Public()
  @Throttle({
    limit: 30,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Auth Status (인증 상태)',
    description: '현재 로그인 세션 유효 여부 확인 (DB 검증 포함)',
  })
  @ApiStandardResponse(UserAuthStatusResponseDto, {
    status: HttpStatus.OK,
  })
  async getStatus(
    @Req() req: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<UserAuthStatusResponseDto> {
    let isAuthenticated = req.isAuthenticated() && !!user;

    // 세션은 유효하지만 실제 DB에 유저가 존재하는지 확인 (DB Reset 대응 등)
    if (isAuthenticated && user) {
      const isValidUser = await this.checkUserStatusService.execute(user.id);
      if (!isValidUser) {
        isAuthenticated = false;
        // 유효하지 않은 유저라면 로그아웃 처리 (세션 정리)
        req.logout(() => {
          req.session?.destroy(() => {});
        });
      }
    }

    return {
      isAuthenticated,
      user:
        isAuthenticated && user
          ? {
              id: this.sqidsService.encode(user.id, SqidsPrefix.USER),
              role: user.role,
            }
          : null,
    };
  }
}
