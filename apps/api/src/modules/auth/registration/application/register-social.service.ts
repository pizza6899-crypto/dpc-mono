import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CountryUtil } from 'src/utils/country.util';
import { CreateCodeService } from 'src/modules/affiliate/code/application/create-code.service';
import { SocialType, UserRoleType } from '@prisma/client';
import { User } from 'src/modules/user/domain';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { CreateUserService } from 'src/modules/user/application/create-user.service';
import { UserAlreadyExistsException } from 'src/modules/user/domain/user.exception';
import { InitializeUserWalletsService } from 'src/modules/wallet/application/initialize-user-wallets.service';

export interface SocialUserInfo {
  socialId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export interface RegisterSocialParams {
  socialUser: SocialUserInfo;
  socialType: SocialType;
  requestInfo: RequestClientInfo;
}

export interface RegisterSocialResult {
  id: bigint;
  email: string;
  isNewUser: boolean;
}

/**
 * 소셜 회원가입 Use Case
 */
@Injectable()
export class RegisterSocialService {
  private readonly logger = new Logger(RegisterSocialService.name);

  constructor(
    private readonly dispatchLogService: DispatchLogService,
    private readonly createCodeService: CreateCodeService,
    private readonly createUserService: CreateUserService,
    private readonly initializeUserWalletsService: InitializeUserWalletsService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) { }

  @Transactional()
  async execute(params: RegisterSocialParams): Promise<RegisterSocialResult> {
    const { socialUser, socialType, requestInfo } = params;
    let user: User;
    let isNewUser = false;

    // 1. 기존 사용자 확인 (소셜 ID로) - 도메인 레이어 사용
    const existingUser = await this.userRepository.findBySocialId(
      socialUser.socialId,
    );

    if (!existingUser) {
      // 2. 새 사용자 생성 (user 모듈의 유즈케이스 사용)
      try {
        const countryConfig = CountryUtil.getCountryConfig({
          countryCode: requestInfo.country,
          timezone: requestInfo.timezone,
        });

        const result = await this.createUserService.execute({
          email: socialUser.email,
          passwordHash: null,
          socialId: socialUser.socialId,
          socialType: socialType,
          role: UserRoleType.USER,
          country: requestInfo.country,
          timezone: countryConfig.timezone,
        });
        user = result.user;
        isNewUser = true;

        // 3. 월렛 생성 (동기)
        await this.initializeUserWalletsService.execute(user.id);

        // 본인만의 기본 레퍼럴 코드 생성 (동기)
        // 첫 번째 코드이므로 자동으로 기본(default) 코드가 됨
        await this.createCodeService.execute({
          userId: user.id,
          campaignName: 'Default',
        });

      } catch (error) {
        if (error instanceof UserAlreadyExistsException) {
          throw error;
        }
        throw error;
      }


      // 5. 신규 사용자 등록 Audit 로그 (부가 기능이므로 실패해도 회원가입은 성공 처리)
      try {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.AUTH,
            data: {
              userId: user.id.toString(),
              action: 'SOCIAL_USER_REGISTER',
              status: 'SUCCESS',
              metadata: {
                provider: socialType.toLowerCase(),
                socialId: socialUser.socialId,
                name:
                  socialUser.firstName && socialUser.lastName
                    ? `${socialUser.firstName} ${socialUser.lastName}`
                    : undefined,
                picture: socialUser.picture,
              },
            },
          },
          requestInfo,
        );
      } catch (error) {
        // Audit 로그 실패는 회원가입 성공에 영향을 주지 않도록 처리
        this.logger.error(
          error,
          `Audit log 기록 실패 (회원가입은 성공) - userId: ${user.id}, socialType: ${socialType}`,
        );
      }

      this.logger.log(
        `소셜 회원가입 성공 - 사용자: ${user.id}, 소셜 타입: ${socialType}, 소셜 ID: ${socialUser.socialId}`,
      );
    } else {
      // 기존 사용자 - 소셜 계정 연결 로직은 향후 구현
      // else if (!existingUser.socialId) {
      //   user = await this.userRepository.update({
      //     id: existingUser.id,
      //     data: { socialId: socialUser.socialId, socialType: socialType },
      //   });
      // }
      user = existingUser;
    }

    return {
      id: user.id,
      email: user.email,
      isNewUser,
    };
  }
}
