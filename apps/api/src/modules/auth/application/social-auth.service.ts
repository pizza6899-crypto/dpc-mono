import { Injectable, Inject } from '@nestjs/common';
import { EnvService } from 'src/platform/env/env.service';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { randomBytes } from 'crypto';
import {
  GoogleAuthUrlResponseDto,
  SocialAuthResponseDto,
} from '../dtos/social-auth.dto';
import { SocialType } from '@repo/database';
import { RegisterSocialService } from '../registration/application/register-social.service';

@Injectable()
export class SocialAuthService {
  constructor(
    private readonly envService: EnvService,
    private readonly registerSocialService: RegisterSocialService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  /**
   * 구글 OAuth 인증 URL 생성
   */
  async getGoogleAuthUrl(): Promise<GoogleAuthUrlResponseDto> {
    const state = randomBytes(32).toString('hex');

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.envService.googleOAuth.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.envService.googleOAuth.redirectUri)}` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')}` +
      `&response_type=code` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    return {
      authUrl,
      state,
    };
  }

  /**
   * Passport Google 전략으로 인증된 사용자 처리
   */
  async processGoogleAuth(
    googleUser: any,
    requestInfo: RequestClientInfo,
  ): Promise<SocialAuthResponseDto> {
    // Registration 모듈을 통해 소셜 회원가입 처리
    const result = await this.registerSocialService.execute({
      socialUser: {
        socialId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        picture: googleUser.picture,
      },
      socialType: SocialType.GOOGLE,
      requestInfo,
    });

    // 로그인 로그 (회원가입 로그는 RegisterSocialService에서 처리)
    await this.activityLog.logSuccess(
      {
        userId: result.id,
        activityType: ActivityType.USER_LOGIN,
        description: `Google OAuth ${result.isNewUser ? '회원가입 후 ' : ''}로그인`,
        metadata: {
          provider: 'google',
          isNewUser: result.isNewUser,
        },
      },
      requestInfo,
    );

    return {
      user: {
        id: result.id,
        email: result.email || 'unknown',
        isNewUser: result.isNewUser,
      },
      isNewUser: result.isNewUser,
    };
  }
}
