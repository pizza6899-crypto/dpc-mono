import {
  Controller,
  Post,
  Get,
  Patch,
  Query,
  Body,
  Param,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../platform/http/decorators/api-response.decorator';
import { Public, RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';
import { AuthenticateCredentialAdminService } from '../../application/authenticate-credential-admin.service';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { ChangePasswordService } from '../../application/change-password.service';
import { ResetUserPasswordAdminService } from '../../application/reset-user-password-admin.service';
import { CredentialUserLoginRequestDto } from '../user/dto/request/login.request.dto';
import { CredentialUserLoginResponseDto } from '../user/dto/response/login.response.dto';
import { CredentialUserLogoutResponseDto } from '../user/dto/response/logout.response.dto';
import { CredentialUserAuthStatusResponseDto } from '../user/dto/response/auth-status.response.dto';
import { LoginAttemptResponseDto } from './dto/response/login-attempt.response.dto';
import { FindLoginAttemptsQueryDto } from './dto/request/find-login-attempts-query.dto';
import { ChangePasswordRequestDto } from '../user/dto/request/change-password.request.dto';
import { ChangePasswordResponseDto } from '../user/dto/response/change-password.response.dto';
import { ResetUserPasswordRequestDto } from './dto/request/reset-user-password.request.dto';
import { ResetUserPasswordResponseDto } from './dto/response/reset-user-password.response.dto';
import { UserRoleType } from '@repo/database';
import type { Request } from 'express';

@Controller('admin/auth')
@ApiTags('Admin Auth(관리자 인증)')
@ApiStandardErrors()
export class CredentialAdminController {
  constructor(
    private readonly authenticateCredentialAdminService: AuthenticateCredentialAdminService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly findAttemptsService: FindLoginAttemptsService,
    private readonly changePasswordService: ChangePasswordService,
    private readonly resetUserPasswordAdminService: ResetUserPasswordAdminService,
  ) {}

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
  @ApiStandardResponse(CredentialUserLoginResponseDto, {
    status: HttpStatus.OK,
    description: 'Login Success',
  })
  async login(
    @Body() dto: CredentialUserLoginRequestDto,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
    @Req() req: Request,
  ): Promise<CredentialUserLoginResponseDto> {
    // 1. 관리자 자격 증명 인증 (이메일/비밀번호 검증, 계정 잠금 체크, 실패 시도 기록)
    const authenticatedUser =
      await this.authenticateCredentialAdminService.execute({
        email: dto.email,
        password: dto.password,
        clientInfo,
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

    // 3. 로그인 성공 기록 (액티비티 로그 등)
    await this.loginService.execute({
      user: authenticatedUser,
      clientInfo,
      isAdmin: true,
    });

    return {
      user: {
        uid: authenticatedUser.uid,
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
    description: '현재 세션 종료. 인증 상태와 관계없이 항상 성공 응답을 반환합니다.',
  })
  @ApiStandardResponse(CredentialUserLogoutResponseDto, {
    status: HttpStatus.OK,
    description: 'Logout Success',
  })
  async logout(
    @CurrentUser() user?: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo?: RequestClientInfo,
    @Req() req?: Request,
  ): Promise<CredentialUserLogoutResponseDto> {
    // 사용자가 있는 경우에만 로그아웃 서비스 실행 (에러 발생해도 무시)
    if (user && clientInfo) {
      try {
        await this.logoutService.execute({
          userId: user.id,
          clientInfo,
          isAdmin: true,
        });
      } catch (error) {
        // LogoutService 에러는 무시하고 성공 응답 반환
      }
    }

    // 세션 종료 처리 (에러가 발생해도 무시하고 성공 응답 반환)
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
    return { success: true };
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
    description: '현재 관리자 로그인 세션 유효 여부 확인',
  })
  @ApiStandardResponse(CredentialUserAuthStatusResponseDto, {
    status: HttpStatus.OK,
  })
  async checkStatus(
    @Req() req: Request,
    @CurrentUser() user?: CurrentUserWithSession,
  ): Promise<CredentialUserAuthStatusResponseDto> {
    // 관리자 역할 체크
    const isAdmin =
      user?.role === UserRoleType.ADMIN ||
      user?.role === UserRoleType.SUPER_ADMIN;
    const isAuthenticated = req.isAuthenticated() && !!user && isAdmin;

    return {
      isAuthenticated,
      user:
        isAuthenticated && user
          ? {
              uid: user.uid,
              email: user.email,
            }
          : null,
    };
  }

  @Get('login-attempts')
  @ApiOperation({
    summary: 'Login Attempts (로그인 시도 내역 조회)',
    description:
      '감사 및 보안 모니터링 목적. email 또는 ipAddress 중 하나는 필수입니다.',
  })
  @ApiStandardResponse(LoginAttemptResponseDto, {
    status: HttpStatus.OK,
    isArray: true,
  })
  async getAttempts(
    @Query() query: FindLoginAttemptsQueryDto,
  ): Promise<LoginAttemptResponseDto[]> {
    const attempts = await this.findAttemptsService.execute({
      email: query.email,
      ipAddress: query.ipAddress,
      limit: query.limit,
    });

    return attempts.map((attempt) => ({
      id: attempt.id?.toString() || '',
      uid: attempt.uid || '',
      userId: attempt.userId,
      result: attempt.result,
      failureReason: attempt.failureReason,
      ipAddress: attempt.ipAddress,
      email: attempt.email,
      attemptedAt: attempt.attemptedAt,
      isAdmin: attempt.isAdmin,
    }));
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change Admin Password / 관리자 비밀번호 변경',
    description: '로그인한 관리자가 현재 비밀번호를 알고 있는 상태에서 비밀번호를 변경합니다.',
  })
  @ApiStandardResponse(ChangePasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'Password changed successfully / 비밀번호 변경 성공',
  })
  async changePassword(
    @CurrentUser() admin: CurrentUserWithSession,
    @Body() dto: ChangePasswordRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ChangePasswordResponseDto> {
    await this.changePasswordService.execute({
      userId: admin.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      requestInfo,
      isAdmin: true,
    });

    return { success: true };
  }

  @Patch('users/:userId/password')
  @HttpCode(HttpStatus.OK)
  @RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Reset User Password / 사용자 비밀번호 초기화',
    description: '관리자가 특정 사용자의 비밀번호를 초기화합니다.',
  })
  @ApiStandardResponse(ResetUserPasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'User password reset successfully / 사용자 비밀번호 초기화 성공',
  })
  async resetUserPassword(
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ResetUserPasswordResponseDto> {
    const targetUserId = BigInt(userId);

    await this.resetUserPasswordAdminService.execute({
      targetUserId,
      adminUserId: admin.id,
      newPassword: dto.newPassword,
      requestInfo,
    });

    return {
      success: true,
      message: 'Password has been reset.',
    };
  }
}
