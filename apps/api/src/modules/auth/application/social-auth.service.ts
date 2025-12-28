import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { EnvService } from 'src/platform/env/env.service';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { randomBytes } from 'crypto';
import {
  GoogleAuthUrlResponseDto,
  SocialAuthResponseDto,
} from '../dtos/social-auth.dto';
import { SocialType } from '@repo/database';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

@Injectable()
export class SocialAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
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
    let user;
    let isNewUser = false;

    // 기존 사용자 확인 (구글 ID 또는 이메일로)
    user = await this.prisma.user.findFirst({
      where: {
        // OR: [{ socialId: googleUser.googleId }, { email: googleUser.email }],
        OR: [{ socialId: googleUser.googleId }],
      },
    });

    if (!user) {
      // 새 사용자 생성
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          socialId: googleUser.googleId,
          socialType: SocialType.GOOGLE,
          balances: {
            create: this.envService.wallet.allowedCurrencies.map(
              (currency) => ({
                currency,
              }),
            ),
          },
        },
      });
      isNewUser = true;

      // 신규 사용자 등록 로그
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.USER_REGISTER,
          description: 'Google OAuth 회원가입',
          metadata: {
            provider: 'google',
            socialId: googleUser.googleId,
            name: `${googleUser.firstName} ${googleUser.lastName}`,
            picture: googleUser.picture,
          },
        },
        requestInfo,
      );
    } else if (!user.googleId) {
      // 기존 이메일 사용자에게 구글 ID 연결
      // user = await this.prisma.user.update({
      //   where: { id: user.id },
      //   data: { socialId: googleUser.googleId },
      // });
    }

    // 로그인 로그
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.USER_LOGIN,
        description: `Google OAuth ${isNewUser ? '회원가입 후 ' : ''}로그인`,
        metadata: {
          provider: 'google',
          isNewUser,
        },
      },
      requestInfo,
    );

    return {
      user: {
        id: user.id,
        email: user.email || 'unknown',
        isNewUser,
      },
      isNewUser,
    };
  }
}
