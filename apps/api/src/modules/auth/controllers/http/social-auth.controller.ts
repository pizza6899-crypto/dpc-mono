import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../platform/http/decorators/api-response.decorator';
import { SocialAuthService } from '../../application/social-auth.service';
import { GuestOnly } from 'src/platform/auth/decorators/roles.decorator';
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import type { Response, Request } from 'express';
import { EnvService } from 'src/platform/env/env.service';
import { CookieUtil } from 'src/utils/cookie.utill';
import { GoogleAuthGuard } from 'src/platform/auth/guards/google-auth.guard';
import {
  GoogleAuthUrlResponseDto,
  SocialAuthResponseDto,
} from '../../dtos/social-auth.dto';

@Controller('auth/social')
@ApiTags('Social Auth(소셜 인증)')
@ApiStandardErrors()
export class SocialAuthController {
  constructor(
    private readonly socialAuthService: SocialAuthService,
    private readonly envService: EnvService,
  ) {}

  @Get('google/url')
  @GuestOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Google OAuth URL (구글 OAuth URL 생성)',
    description:
      'Generate Google OAuth authorization URL for login. (구글 OAuth 로그인을 위한 인증 URL을 생성합니다.)',
  })
  @ApiStandardResponse(GoogleAuthUrlResponseDto, {
    status: 200,
    description: 'Google OAuth URL generated successfully',
  })
  async getGoogleAuthUrl(): Promise<GoogleAuthUrlResponseDto> {
    return this.socialAuthService.getGoogleAuthUrl();
  }

  @Get('google')
  @GuestOnly()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Authentication (구글 OAuth 인증)',
    description:
      'Initiate Google OAuth authentication flow. (구글 OAuth 인증 플로우를 시작합니다.)',
  })
  async googleAuth() {
    // Passport Google 전략이 자동으로 처리
    // 이 메서드는 실행되지 않음
  }

  @Get('google/callback')
  @GuestOnly()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Callback (구글 OAuth 콜백)',
    description:
      'Handle Google OAuth callback and authenticate user. (구글 OAuth 콜백을 처리하고 사용자를 인증합니다.)',
  })
  @ApiStandardResponse(SocialAuthResponseDto, {
    status: 200,
    description: 'Google OAuth authentication successful',
  })
  async googleAuthCallback(
    @Req() req: any,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SocialAuthResponseDto> {
    // Passport Google 전략에서 검증된 사용자 정보
    const googleUser = req.user;

    const result = await this.socialAuthService.processGoogleAuth(
      googleUser,
      requestInfo,
    );

    return result;
  }

  @Get('google/redirect')
  @GuestOnly()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Redirect Handler (구글 OAuth 리다이렉트 핸들러)',
    description:
      'Handle Google OAuth redirect from authorization server. (구글 OAuth 인증 서버로부터의 리다이렉트를 처리합니다.)',
  })
  async handleGoogleRedirect(
    @Req() req: any,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Passport Google 전략에서 검증된 사용자 정보
      const googleUser = req.user;

      const result = await this.socialAuthService.processGoogleAuth(
        googleUser,
        requestInfo,
      );

      // 프론트엔드로 리다이렉트 (액세스 토큰과 함께)
      const redirectUrl = `${this.envService.app.corsOrigin[0]}/auth/callback?isNewUser=${result.isNewUser}`;
      res.redirect(redirectUrl);
    } catch (err) {
      // 인증 실패 시 에러 페이지로 리다이렉트
      res.redirect(
        `${this.envService.app.corsOrigin[0]}/auth/error?error=authentication_failed`,
      );
    }
  }
}
