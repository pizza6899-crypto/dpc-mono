import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../common/http/decorators/api-response.decorator';
import {
  Public,
} from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { AuthenticateIdentityService } from '../../application/authenticate-identity.service';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { CheckUserStatusService } from '../../application/check-user-status.service';
import { AdminLoginRequestDto } from './dto/request/login.request.dto';
import { AdminLoginResponseDto } from './dto/response/login.response.dto';
import { AdminLogoutResponseDto } from './dto/response/logout.response.dto';
import { AdminAuthStatusResponseDto } from './dto/response/auth-status.response.dto';
import { UserRoleType } from '@prisma/client';
import type { Request } from 'express';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/auth')
@ApiTags('Admin Auth')
@ApiStandardErrors()
export class AdminAuthController {
  constructor(
    private readonly authenticateIdentityService: AuthenticateIdentityService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly checkUserStatusService: CheckUserStatusService,
  ) { }

  @Post('login')
  @Public()
  @Throttle({
    limit: 10,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Admin Login (관리자 로그인)',
    description: 'Email/Password 기반 관리자 로그인',
  })
  @ApiStandardResponse(AdminLoginResponseDto, {
    status: HttpStatus.OK,
    description: 'Login Success',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'ADMIN_LOGIN',
    extractMetadata: (_, args, result, error) => {
      const [params] = args;

      if (error) {
        // 에러 타입에 따라 failureReason 결정
        if (error.message?.includes('THROTTLE')) {
          return {
            loginId: params.loginId,
            failureReason: 'THROTTLE_LIMIT_EXCEEDED',
          };
        }
        return {
          loginId: params.loginId,
          failureReason: 'INVALID_CREDENTIALS',
        };
      }

      // 성공 시
      return {
        loginId: params.loginId,
      };
    },
  })
  async login(
    @Body() dto: AdminLoginRequestDto,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
    @Req() req: Request,
  ): Promise<AdminLoginResponseDto> {
    // 1. 관리자 자격 증명 인증 (이메일/비밀번호 검증, 계정 잠금 체크, 실패 시도 기록)
    const authenticatedUser =
      await this.authenticateIdentityService.execute({
        loginId: dto.loginId,
        password: dto.password,
        clientInfo,
        isAdmin: true,
      });

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
      isAdmin: true,
    });

    return {
      user: {
        id: authenticatedUser.id.toString(),
        email: authenticatedUser.email,
      },
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
    summary: 'Admin Logout (관리자 로그아웃)',
    description:
      '현재 세션 종료. 인증 상태와 관계없이 항상 성공 응답을 반환합니다.',
  })
  @ApiStandardResponse(AdminLogoutResponseDto, {
    status: HttpStatus.OK,
    description: 'Logout Success',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'ADMIN_LOGOUT',
    logOnSuccess: true,
    logOnError: false, // 로그아웃 실패는 기록하지 않음
  })
  async logout(
    @CurrentUser() user?: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo?: RequestClientInfo,
    @Req() req?: Request,
  ): Promise<AdminLogoutResponseDto> {
    // 1. DB 세션 종료 (LogoutService에서 처리)
    // 사용자가 있는 경우에만 로그아웃 서비스 실행 (에러 발생해도 무시)
    if (user && clientInfo) {
      try {
        // req.logout() 전에 sessionID 저장 (DB 세션 종료에 필요)
        const sessionId = req?.sessionID;

        await this.logoutService.execute({
          userId: user.id,
          sessionId,
          clientInfo,
          isAdmin: true,
        });
      } catch (error) {
        // LogoutService 에러는 무시하고 성공 응답 반환
      }
    }

    // 2. Express 세션 종료 (DB 세션 종료 후 처리)
    // 에러가 발생해도 무시하고 성공 응답 반환
    if (req) {
      try {
        await new Promise<void>((resolve) => {
          // 타임아웃 방지를 위해 최대 100ms 후 강제 resolve
          const timeout = setTimeout(() => resolve(), 100);

          const cleanup = () => {
            clearTimeout(timeout);
            resolve();
          };

          if (req.logout) {
            try {
              req.logout(() => {
                // logout 콜백: 에러 여부와 관계없이 세션 destroy 시도
                if (req.session?.destroy) {
                  try {
                    req.session.destroy(() => {
                      cleanup();
                    });
                  } catch {
                    cleanup();
                  }
                } else {
                  cleanup();
                }
              });
            } catch {
              // logout 호출 자체가 실패하면 즉시 resolve
              cleanup();
            }
          } else if (req.session?.destroy) {
            try {
              req.session.destroy(() => {
                cleanup();
              });
            } catch {
              cleanup();
            }
          } else {
            cleanup();
          }
        });
      } catch (error) {
        // 세션 종료 실패는 무시하고 성공 응답 반환
      }
    }

    // 항상 성공 응답 반환
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
    summary: 'Admin Auth Status (관리자 인증 상태)',
    description: '현재 관리자 로그인 세션 유효 여부 확인 (DB 검증 포함)',
  })
  @ApiStandardResponse(AdminAuthStatusResponseDto, {
    status: HttpStatus.OK,
  })
  async getStatus(
    @Req() req: Request,
    @CurrentUser() user?: CurrentUserWithSession,
  ): Promise<AdminAuthStatusResponseDto> {
    // 관리자 역할 체크
    const isAdmin =
      user?.role === UserRoleType.ADMIN ||
      user?.role === UserRoleType.SUPER_ADMIN;
    let isAuthenticated = req.isAuthenticated() && !!user && isAdmin;

    // 세션은 유효하지만 실제 DB에 유저가 존재하는지 확인 (DB Reset 대응 등)
    if (isAuthenticated && user) {
      const isValidUser = await this.checkUserStatusService.execute(user.id);
      if (!isValidUser) {
        isAuthenticated = false;
        // 유효하지 않은 유저라면 로그아웃 처리
        req.logout(() => {
          req.session?.destroy(() => { });
        });
      }
    }

    return {
      isAuthenticated,
      user:
        isAuthenticated && user
          ? {
            id: user.id.toString(),
            email: user.email,
          }
          : null,
    };
  }
}
