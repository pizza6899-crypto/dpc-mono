import {
  Controller,
  Post,
  Get,
  Query,
  Body,
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
import { AuthenticateCredentialAdminService } from '../../application/authenticate-credential-admin.service';
import { LoginService } from '../../application/login.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { CredentialUserLoginRequestDto } from '../user/dto/request/login.request.dto';
import { CredentialUserLoginResponseDto } from '../user/dto/response/login.response.dto';
import { LoginAttemptResponseDto } from './dto/response/login-attempt.response.dto';
import { FindLoginAttemptsQueryDto } from './dto/request/find-login-attempts-query.dto';
import type { Request } from 'express';

@Controller('admin/auth')
@ApiTags('Admin Auth(관리자 인증)')
@ApiStandardErrors()
export class CredentialAdminController {
  constructor(
    private readonly authenticateCredentialAdminService: AuthenticateCredentialAdminService,
    private readonly loginService: LoginService,
    private readonly findAttemptsService: FindLoginAttemptsService,
  ) {}

  @Post('login')
  @Public()
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
        id: authenticatedUser.id,
        email: authenticatedUser.email,
      },
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
}
