import { Injectable, Inject, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { VipMembershipService } from 'src/modules/vip/application/vip-membership.service';
import { SocialType, UserRoleType } from '@repo/database';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { User } from 'src/modules/user/domain';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { CreateUserService } from 'src/modules/user/application/create-user.service';
import { UserAlreadyExistsException } from 'src/modules/user/domain/user.exception';

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
    private readonly prisma: PrismaService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly vipMembershipService: VipMembershipService,
    private readonly createUserService: CreateUserService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

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
        const result = await this.createUserService.execute({
          email: socialUser.email,
          passwordHash: null,
          socialId: socialUser.socialId,
          socialType: socialType,
          role: UserRoleType.USER,
          country: requestInfo.country,
          timezone: requestInfo.timezone,
        });
        user = result.user;
        isNewUser = true;
      } catch (error) {
        if (error instanceof UserAlreadyExistsException) {
          throw new ApiException(
            MessageCode.USER_ALREADY_EXISTS,
            HttpStatus.BAD_REQUEST,
          );
        }
        throw error;
      }

      // 4. VIP 멤버십 생성
      await this.vipMembershipService.getOrCreateMembership(user.id);

      // 5. 신규 사용자 등록 로그 (부가 기능이므로 실패해도 회원가입은 성공 처리)
      try {
        await this.activityLog.logSuccess(
          {
            userId: user.id,
            activityType: ActivityType.USER_REGISTER,
            description: `${socialType} OAuth 회원가입`,
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
          requestInfo,
        );
      } catch (error) {
        // 액티비티 로그 실패는 회원가입 성공에 영향을 주지 않도록 처리
        this.logger.error(
          error,
          `Activity log 기록 실패 (회원가입은 성공) - userId: ${user.id}, socialType: ${socialType}`,
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
      if (!existingUser) {
        throw new ApiException(MessageCode.INTERNAL_SERVER_ERROR, 500);
      }
      user = existingUser;
    }

    return {
      id: user.id,
      email: user.email,
      isNewUser,
    };
  }
}
