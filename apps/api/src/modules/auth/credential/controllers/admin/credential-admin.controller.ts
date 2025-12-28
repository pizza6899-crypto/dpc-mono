import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
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
import { AdminLocalAuthGuard } from 'src/platform/auth/guards/admin-local-auth.guard';
import { LoginService } from '../../application/login.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { CredentialUserLoginResponseDto } from '../user/dto/response/login.response.dto';
import { LoginAttemptResponseDto } from './dto/response/login-attempt.response.dto';

@Controller('admin/auth')
@ApiTags('Admin Auth(관리자 인증)')
@ApiStandardErrors()
export class CredentialAdminController {
  constructor(
    private readonly loginService: LoginService,
    private readonly findAttemptsService: FindLoginAttemptsService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(AdminLocalAuthGuard)
  @ApiOperation({
    summary: 'Admin Login (관리자 로그인)',
  })
  @ApiStandardResponse(CredentialUserLoginResponseDto, {
    status: HttpStatus.OK,
  })
  async login(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClienttInfo() clientInfo: RequestClientInfo,
  ): Promise<CredentialUserLoginResponseDto> {
    await this.loginService.execute({ user, clientInfo, isAdmin: true });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Get('login-attempts')
  @ApiOperation({
    summary: 'Login Attempts (로그인 시도 내역 조회)',
    description: '감사 및 보안 모니터링 목적',
  })
  @ApiStandardResponse(LoginAttemptResponseDto, {
    status: HttpStatus.OK,
    isArray: true,
  })
  async getAttempts(
    @Query('email') email?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('limit') limit: number = 50,
  ): Promise<LoginAttemptResponseDto[]> {
    const attempts = await this.findAttemptsService.execute({
      email,
      ipAddress,
      limit,
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
}
