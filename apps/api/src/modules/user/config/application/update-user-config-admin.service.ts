import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_CONFIG_REPOSITORY } from '../ports/out/user-config.repository.token';
import type { UserConfigRepositoryPort } from '../ports/out/user-config.repository.port';
import { UserConfig } from '../domain/model/user-config.entity';
import { UserConfigNotFoundException } from '../domain/user-config.exception';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';
import {
    ExchangeCurrencyCode,
    Language,
    LoginIdType,
    OAuthProvider,
    UserStatus,
} from '@prisma/client';

export interface UpdateUserConfigCommand {
    allowSignup?: boolean;
    defaultStatus?: UserStatus;
    maxDailySignupPerIp?: number;
    loginIdType?: LoginIdType;
    requireEmail?: boolean;
    requirePhoneNumber?: boolean;
    requireBirthDate?: boolean;
    requireNickname?: boolean;
    requireReferralCode?: boolean;
    allowedOAuthProviders?: OAuthProvider[];
    loginIdEmailRegex?: string | null;
    loginIdPhoneNumberRegex?: string | null;
    loginIdUsernameRegex?: string | null;
    nicknameRegex?: string | null;
    passwordRegex?: string | null;
    defaultPrimaryCurrency?: ExchangeCurrencyCode;
    defaultPlayCurrency?: ExchangeCurrencyCode;
    defaultLanguage?: Language;
    adminNote?: string | null;
}

@Injectable()
export class UpdateUserConfigAdminService {
    constructor(
        @Inject(USER_CONFIG_REPOSITORY)
        private readonly userConfigRepository: UserConfigRepositoryPort,
        private readonly lockService: AdvisoryLockService,
    ) { }

    /**
     * 관리자가 전역 사용자 설정을 수정합니다.
     * 싱글톤이므로 AdvisoryLock을 사용하여 동시 수정을 방지합니다.
     */
    @Transactional()
    async execute(adminUserId: bigint, command: UpdateUserConfigCommand): Promise<UserConfig> {
        // 싱글톤 설정을 위한 락 획득 (ID: 1)
        await this.lockService.acquireLock(LockNamespace.USER_CONFIG, 1);

        const config = await this.userConfigRepository.findConfig();

        if (!config) {
            throw new UserConfigNotFoundException();
        }

        // 도메인 엔티티의 비즈니스 메서드를 통해 정보 업데이트
        config.update(command, adminUserId);

        // 변경사항 저장 (리포지토리 내에서 캐시 무효화 발생)
        await this.userConfigRepository.save(config);

        return config;
    }
}

