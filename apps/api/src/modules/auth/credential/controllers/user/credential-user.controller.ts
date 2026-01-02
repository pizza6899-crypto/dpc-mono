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
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { AuthenticateCredentialService } from '../../application/authenticate-credential.service';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { ChangePasswordService } from '../../application/change-password.service';
import { RequestPasswordResetService } from '../../application/request-password-reset.service';
import { ResetPasswordService } from '../../application/reset-password.service';
import { CredentialUserLoginRequestDto } from './dto/request/login.request.dto';
import { CredentialUserLoginResponseDto } from './dto/response/login.response.dto';
import { CredentialUserAuthStatusResponseDto } from './dto/response/auth-status.response.dto';
import { CredentialUserLogoutResponseDto } from './dto/response/logout.response.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { ChangePasswordResponseDto } from './dto/response/change-password.response.dto';
import { RequestPasswordResetRequestDto } from './dto/request/request-password-reset.request.dto';
import { RequestPasswordResetResponseDto } from './dto/response/request-password-reset.response.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';
import { ResetPasswordResponseDto } from './dto/response/reset-password.response.dto';
import { UserRoleType } from '@repo/database';
import type { Request } from 'express';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('auth')
@ApiTags('Auth(인증)')
@ApiStandardErrors()
export class CredentialUserController {
  constructor(
    private readonly authenticateCredentialService: AuthenticateCredentialService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly changePasswordService: ChangePasswordService,
    private readonly requestPasswordResetService: RequestPasswordResetService,
    private readonly resetPasswordService: ResetPasswordService,
  ) { }

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
  @ApiStandardResponse(CredentialUserLoginResponseDto, {
    status: HttpStatus.OK,
    description: 'Login Success',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'LOGIN',
    extractMetadata: (args) => {
      const [dto] = args;
      return {
        email: dto.email,
      };
    },
  })
  async login(
    @Body() dto: CredentialUserLoginRequestDto,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
    @Req() req: Request,
  ): Promise<CredentialUserLoginResponseDto> {
    // 1. 자격 증명 인증 (이메일/비밀번호 검증, 계정 잠금 체크, 실패 시도 기록)
    const authenticatedUser = await this.authenticateCredentialService.execute({
      email: dto.email,
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
    summary: 'Logout (로그아웃)',
    description: '현재 세션 종료. 인증 상태와 관계없이 항상 성공 응답을 반환합니다.',
  })
  @ApiStandardResponse(CredentialUserLogoutResponseDto, {
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
    @CurrentUser() user?: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo?: RequestClientInfo,
    @Req() req?: Request,
  ): Promise<CredentialUserLogoutResponseDto> {
    // 1. DB 세션 종료 (LogoutService에서 처리)
    // 사용자가 있는 경우에만 로그아웃 서비스 실행 (에러 발생해도 무시)
    if (user && clientInfo) {
      try {
        const isAdmin =
          user.role === UserRoleType.ADMIN ||
          user.role === UserRoleType.SUPER_ADMIN;

        // req.logout() 전에 sessionID 저장 (DB 세션 종료에 필요)
        const sessionId = req?.sessionID;

        await this.logoutService.execute({
          userId: user.id,
          sessionId,
          clientInfo,
          isAdmin,
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
    summary: 'Auth Status (인증 상태)',
    description: '현재 로그인 세션 유효 여부 확인',
  })
  @ApiStandardResponse(CredentialUserAuthStatusResponseDto, {
    status: HttpStatus.OK,
  })
  async checkStatus(
    @Req() req: Request,
    @CurrentUser() user?: CurrentUserWithSession,
  ): Promise<CredentialUserAuthStatusResponseDto> {
    const isAuthenticated = req.isAuthenticated() && !!user;

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

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change Password / 비밀번호 변경',
    description: '로그인한 사용자가 현재 비밀번호를 알고 있는 상태에서 비밀번호를 변경합니다.',
  })
  @ApiStandardResponse(ChangePasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'Password changed successfully / 비밀번호 변경 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'PASSWORD_CHANGE',
    extractMetadata: (args, result, error) => {
      if (error) {
        return {
          failureReason: 'INVALID_CURRENT_PASSWORD',
        };
      }
      return {};
    },
  })
  async changePassword(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: ChangePasswordRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ChangePasswordResponseDto> {
    await this.changePasswordService.execute({
      userId: user.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      requestInfo,
      isAdmin: false,
    });

    return { success: true };
  }

  @Post('password/reset-request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 5,
    ttl: 3600, // 1시간
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Request Password Reset / 비밀번호 재설정 요청',
    description: '비밀번호를 잊은 경우 이메일로 재설정 토큰을 발송합니다.',
  })
  @ApiStandardResponse(RequestPasswordResetResponseDto, {
    status: HttpStatus.OK,
    description: 'Password reset email sent / 비밀번호 재설정 이메일 발송 완료',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'PASSWORD_RESET_REQUEST',
    extractMetadata: (args) => {
      const [dto] = args;
      return {
        email: dto.email,
      };
    },
  })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<RequestPasswordResetResponseDto> {
    await this.requestPasswordResetService.execute({
      email: dto.email,
      requestInfo,
    });

    return {
      success: true,
      message: 'Password reset email has been sent.',
    };
  }

  @Post('password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 10,
    ttl: 3600, // 1시간
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Reset Password / 비밀번호 재설정',
    description: '이메일로 받은 토큰을 사용하여 비밀번호를 재설정합니다.',
  })
  @ApiStandardResponse(ResetPasswordResponseDto, {
    status: HttpStatus.OK,
    description: 'Password reset successfully / 비밀번호 재설정 성공',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'PASSWORD_RESET',
    extractMetadata: (args, result, error) => {
      if (error) {
        let failureReason = 'UNKNOWN_ERROR';
        if (error.message?.includes('INVALID_TOKEN')) {
          failureReason = 'INVALID_TOKEN';
        } else if (error.message?.includes('USER_NOT_FOUND')) {
          failureReason = 'USER_NOT_FOUND';
        }
        return {
          failureReason,
        };
      }
      return {};
    },
  })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ResetPasswordResponseDto> {
    await this.resetPasswordService.execute({
      token: dto.token,
      newPassword: dto.newPassword,
      requestInfo,
    });

    return { success: true };
  }
}
