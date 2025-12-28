import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../platform/http/decorators/api-response.decorator';
import { Public } from 'src/platform/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { LocalAuthGuard } from 'src/platform/auth/guards/local-auth.guard';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { CredentialUserLoginRequestDto } from './dto/request/login.request.dto';
import { CredentialUserLoginResponseDto } from './dto/response/login.response.dto';
import { CredentialUserAuthStatusResponseDto } from './dto/response/auth-status.response.dto';
import { UserRoleType } from '@repo/database';
import type { Request } from 'express';

@Controller('auth')
@ApiTags('Auth(인증)')
@ApiStandardErrors()
export class CredentialUserController {
  constructor(
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('login')
  @Public() // Guard 내부에서 실제 검증 수행
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Login (로그인)',
    description: 'Email/Password 기반 로그인',
  })
  @ApiStandardResponse(CredentialUserLoginResponseDto, {
    status: HttpStatus.OK,
    description: 'Login Success',
  })
  async login(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
    @Body() _dto: CredentialUserLoginRequestDto, // Swagger 문서화를 위해 필요
  ): Promise<CredentialUserLoginResponseDto> {
    await this.loginService.execute({ user, clientInfo, isAdmin: false });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout (로그아웃)',
    description: '현재 세션 종료',
  })
  @ApiStandardResponse(undefined, {
    status: HttpStatus.OK,
    description: 'Logout Success',
  })
  async logout(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
    @Req() req: Request,
  ): Promise<void> {
    // 사용자 role을 확인하여 isAdmin 결정
    const isAdmin =
      user.role === UserRoleType.ADMIN ||
      user.role === UserRoleType.SUPER_ADMIN;

    await this.logoutService.execute({
      userId: user.id,
      clientInfo,
      isAdmin,
    });

    // 세션 종료 처리 (Promise로 감싸서 에러 처리)
    await new Promise<void>((resolve, reject) => {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          reject(err);
          return;
        }

        req.session.destroy((destroyErr) => {
          if (destroyErr) {
            console.error('Session destroy error:', destroyErr);
            reject(destroyErr);
            return;
          }

          resolve();
        });
      });
    });
  }

  @Get('status')
  @Public()
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
              id: user.id,
              email: user.email,
            }
          : null,
    };
  }
}
