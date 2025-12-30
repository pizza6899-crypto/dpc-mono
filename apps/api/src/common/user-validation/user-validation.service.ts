// src/platform/user-validation/user-validation.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../http/exception/api.exception';
import { MessageCode } from '../http/types/message-codes';
import { UserStatus, UserRoleType, KycLevel } from '@repo/database';
import {
  UserValidationOptions,
  KYC_LEVEL_PRIORITY,
} from './user-validation.types';

@Injectable()
export class UserValidationService {
  private readonly logger = new Logger(UserValidationService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 유저 유효성 검사
   * @param userId 검사할 유저 ID
   * @param options 검증 옵션
   * @param currentRole 현재 유저의 역할 (DB 조회 생략용, 선택사항)
   * @throws ApiException | BadRequestException
   */
  async validateUser(
    userId: bigint,
    options: UserValidationOptions = {},
    currentRole?: UserRoleType,
  ): Promise<void> {
    // 기본 옵션 설정
    const opts: Required<
      Omit<
        UserValidationOptions,
        'excludeRoles' | 'customErrorMessage' | 'requireKycLevel'
      >
    > & {
      requireKycLevel?: KycLevel;
      excludeRoles?: UserRoleType[];
      customErrorMessage?: UserValidationOptions['customErrorMessage'];
    } = {
      requireActiveStatus: options.requireActiveStatus ?? true,
      requireEmailVerified: options.requireEmailVerified ?? false,
      requirePhoneVerified: options.requirePhoneVerified ?? false,
      requireKycLevel: options.requireKycLevel,
      excludeRoles: options.excludeRoles,
      customErrorMessage: options.customErrorMessage,
    };

    // 어드민 제외 체크 (DB 조회 전에 - 성능 최적화)
    if (currentRole && opts.excludeRoles?.includes(currentRole)) {
      this.logger.debug(
        `유저 ${userId}는 역할 ${currentRole}로 인해 검증에서 제외됩니다.`,
      );
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        kycLevel: true,
        role: true,
        // emailVerified: true, // 스키마에 추가되면 주석 해제
        // phoneVerified: true, // 스키마에 추가되면 주석 해제
      },
    });

    // 유저 존재 확인
    if (!user) {
      const message =
        opts.customErrorMessage?.userNotFound || 'User not found.';
      throw new ApiException(MessageCode.USER_NOT_FOUND, 404, message);
    }

    // 역할 기반 제외 재확인 (DB에서 가져온 최신 역할로)
    if (opts.excludeRoles?.includes(user.role)) {
      this.logger.debug(
        `유저 ${userId}는 역할 ${user.role}로 인해 검증에서 제외됩니다.`,
      );
      return;
    }

    // 상태 검증
    if (opts.requireActiveStatus) {
      if (user.status !== UserStatus.ACTIVE) {
        const message =
          opts.customErrorMessage?.inactive ||
          'Your account is inactive. Please contact customer support.';
        throw new ApiException(MessageCode.AUTH_ACCOUNT_INACTIVE, 403, message);
      }
    }

    // 이메일 인증 검증 (스키마에 필드 추가 후 주석 해제)
    // if (opts.requireEmailVerified) {
    //   if (!user.emailVerified) {
    //     const message =
    //       opts.customErrorMessage?.emailNotVerified ||
    //       '이메일 인증이 필요합니다.';
    //     throw new BadRequestException(message);
    //   }
    // }

    // 전화번호 인증 검증 (스키마에 필드 추가 후 주석 해제)
    // if (opts.requirePhoneVerified) {
    //   if (!user.phoneVerified) {
    //     const message =
    //       opts.customErrorMessage?.phoneNotVerified ||
    //       '전화번호 인증이 필요합니다.';
    //     throw new BadRequestException(message);
    //   }
    // }

    // KYC 레벨 검증
    if (opts.requireKycLevel) {
      const userKycLevel = KYC_LEVEL_PRIORITY[user.kycLevel] ?? 0;
      const requiredLevel = KYC_LEVEL_PRIORITY[opts.requireKycLevel];

      if (userKycLevel < requiredLevel) {
        const message =
          opts.customErrorMessage?.kycInsufficient ||
          `KYC ${opts.requireKycLevel} level verification is required.`;
        throw new BadRequestException(message);
      }
    }
  }
}
