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
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { LocalAuthGuard } from 'src/platform/auth/guards/local-auth.guard';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { LoginResponseDto } from './dto/response/login.response.dto';
import { AuthStatusResponseDto } from './dto/response/auth-status.response.dto';
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
  @ApiStandardResponse(LoginResponseDto, {
    status: HttpStatus.OK,
    description: 'Login Success',
  })
  async login(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClienttInfo() clientInfo: RequestClientInfo,
    @Body() _dto: LoginRequestDto, // Swagger 문서화를 위해 필요
  ): Promise<LoginResponseDto> {
    await this.loginService.execute({ user, clientInfo });

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
    @RequestClienttInfo() clientInfo: RequestClientInfo,
    @Req() req: Request,
  ): Promise<void> {
    await this.logoutService.execute({ userId: user.id, clientInfo });

    req.logout((err) => {
      if (err) console.error('Logout error:', err);
    });
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
  }

  @Get('status')
  @Public()
  @ApiOperation({
    summary: 'Auth Status (인증 상태)',
    description: '현재 로그인 세션 유효 여부 확인',
  })
  @ApiStandardResponse(AuthStatusResponseDto, {
    status: HttpStatus.OK,
  })
  async checkStatus(
    @Req() req: Request,
    @CurrentUser() user?: CurrentUserWithSession,
  ): Promise<AuthStatusResponseDto> {
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
