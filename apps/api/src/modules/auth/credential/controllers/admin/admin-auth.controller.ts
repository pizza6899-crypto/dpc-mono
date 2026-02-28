import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  HttpStatus,
  HttpCode,
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
import { ChangePasswordService } from '../../application/change-password.service';
import { CheckUserStatusService } from '../../application/check-user-status.service';
import { AdminLoginRequestDto } from './dto/request/login.request.dto';
import { AdminLoginResponseDto } from './dto/response/login.response.dto';
import { AdminLogoutResponseDto } from './dto/response/logout.response.dto';
import { AdminAuthStatusResponseDto } from './dto/response/auth-status.response.dto';
import { AdminChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { AdminChangePasswordResponseDto } from './dto/response/change-password.response.dto';
import { UserRoleType } from '@prisma/client';
import type { Request } from 'express';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/auth')
@ApiTags('Admin / Auth Credential')
@ApiStandardErrors()
export class AdminAuthController {
  constructor(
    private readonly authenticateIdentityService: AuthenticateIdentityService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly changePasswordService: ChangePasswordService,
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
    summary: 'Admin Login / 관리자 로그인',
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
    summary: 'Admin Logout / 관리자 로그아웃',
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
    logOnError: false,
  })
  async logout(
    @CurrentUser() user?: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo?: RequestClientInfo,
    @Req() req?: Request,
  ): Promise<AdminLogoutResponseDto> {
    if (user && clientInfo) {
      try {
        const sessionId = req?.sessionID;
        await this.logoutService.execute({
          userId: user.id,
          sessionId,
          clientInfo,
          isAdmin: true,
        });
      } catch (error) {
      }
    }

    if (req) {
      try {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 100);
          const cleanup = () => {
            clearTimeout(timeout);
            resolve();
          };

          if (req.logout) {
            try {
              req.logout(() => {
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
      }
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
    summary: 'Admin Auth Status / 관리자 인증 상태',
    description: '현재 관리자 로그인 세션 유효 여부 확인 (DB 검증 포함)',
  })
  @ApiStandardResponse(AdminAuthStatusResponseDto, {
    status: HttpStatus.OK,
  })
  async getStatus(
    @Req() req: Request,
    @CurrentUser() user?: CurrentUserWithSession,
  ): Promise<AdminAuthStatusResponseDto> {
    const isAdmin =
      user?.role === UserRoleType.ADMIN ||
      user?.role === UserRoleType.SUPER_ADMIN;
    let isAuthenticated = req.isAuthenticated() && !!user && isAdmin;

    if (isAuthenticated && user) {
      const isValidUser = await this.checkUserStatusService.execute(user.id);
      if (!isValidUser) {
        isAuthenticated = false;
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

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change Admin Password / 관리자 비밀번호 변경',
    description:
      '로그인한 관리자가 현재 비밀번호를 알고 있는 상태에서 비밀번호를 변경합니다.',
  })
  @ApiStandardResponse(AdminChangePasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'Password changed successfully / 비밀번호 변경 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'ADMIN_PASSWORD_CHANGE',
    extractMetadata: (_, args, result, error) => {
      if (error) {
        return {
          failureReason: 'INVALID_CURRENT_PASSWORD',
        };
      }
      return {};
    },
  })
  async changePassword(
    @CurrentUser() admin: CurrentUserWithSession,
    @Body() dto: AdminChangePasswordRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AdminChangePasswordResponseDto> {
    await this.changePasswordService.execute({
      userId: admin.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      requestInfo,
      isAdmin: true,
    });

    return {};
  }
}
